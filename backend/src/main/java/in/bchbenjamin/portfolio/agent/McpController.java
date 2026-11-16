package in.bchbenjamin.portfolio.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mcp")
public class McpController {
    private static final String CURRENT_VERSION = "2026-07-28";
    private static final Set<String> LEGACY_VERSIONS = Set.of("2025-11-25", "2025-06-18", "2025-03-26");
    private final ObjectMapper mapper;
    private final JdbcTemplate jdbc;
    private final AgentProposalService proposals;
    private final Set<String> allowedOrigins;

    public McpController(ObjectMapper mapper, JdbcTemplate jdbc, AgentProposalService proposals,
                         @Value("${app.security.allowed-origins:http://localhost:3000}") String origins) {
        this.mapper = mapper;
        this.jdbc = jdbc;
        this.proposals = proposals;
        this.allowedOrigins = java.util.Arrays.stream(origins.split(",")).map(String::trim).filter(value -> !value.isBlank()).collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<JsonNode> handle(@RequestBody JsonNode request,
        @RequestHeader(name = "MCP-Protocol-Version", required = false) String requestedVersion,
        @RequestHeader(name = "Mcp-Method", required = false) String methodHeader,
        @RequestHeader(name = "Mcp-Name", required = false) String nameHeader,
        @RequestHeader(name = "Accept", required = false) String accept,
        @RequestHeader(name = "Origin", required = false) String origin,
        Authentication authentication) {
        JsonNode id = request.get("id");
        if (origin != null && !allowedOrigins.contains(origin)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (accept == null || !accept.contains("application/json") || !accept.contains("text/event-stream")) {
            return ResponseEntity.badRequest().body(error(id, -32600, "Accept must include application/json and text/event-stream"));
        }
        if (!"2.0".equals(request.path("jsonrpc").asText())) return ResponseEntity.badRequest().body(error(id, -32600, "jsonrpc must be 2.0"));
        if (!request.has("id")) return ResponseEntity.accepted().build();

        String method = request.path("method").asText();
        JsonNode params = request.path("params");
        String version = requestedVersion == null || requestedVersion.isBlank() ? "2025-03-26" : requestedVersion;
        boolean modern = CURRENT_VERSION.equals(version);
        if (!modern && !LEGACY_VERSIONS.contains(version)) {
            ObjectNode response = error(id, -32022, "Unsupported protocol version");
            ((ObjectNode) response.get("error")).putObject("data").putArray("supported").add(CURRENT_VERSION).add("2025-11-25");
            return ResponseEntity.badRequest().body(response);
        }
        if (modern) {
            String bodyVersion = params.path("_meta").path("io.modelcontextprotocol/protocolVersion").asText();
            if (!CURRENT_VERSION.equals(bodyVersion) || !CURRENT_VERSION.equals(requestedVersion)) {
                return ResponseEntity.badRequest().body(error(id, -32020, "MCP-Protocol-Version header does not match request metadata"));
            }
            if (methodHeader == null || !method.equals(methodHeader)) {
                return ResponseEntity.badRequest().body(error(id, -32020, "Mcp-Method header does not match JSON-RPC method"));
            }
            if ("tools/call".equals(method) && (nameHeader == null || !nameHeader.equals(params.path("name").asText()))) {
                return ResponseEntity.badRequest().body(error(id, -32020, "Mcp-Name header does not match tool name"));
            }
            if ("initialize".equals(method) || "notifications/initialized".equals(method)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error(id, -32601, "Initialize handshake is not part of the stateless protocol"));
            }
        }

        try {
            Object result = switch (method) {
                case "initialize" -> initialize(version);
                case "ping" -> mapper.createObjectNode();
                case "tools/list" -> tools(authentication);
                case "tools/call" -> call(params, authentication);
                default -> throw new McpError(-32601, "Method not found");
            };
            return ResponseEntity.ok(success(id, result, modern));
        } catch (McpError error) {
            return ResponseEntity.ok(error(id, error.code, error.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error(id, -32603, "Tool execution failed"));
        }
    }

    private ObjectNode initialize(String version) {
        ObjectNode result = mapper.createObjectNode();
        result.put("protocolVersion", version);
        result.putObject("capabilities").putObject("tools").put("listChanged", false);
        result.putObject("serverInfo").put("name", "bchbenjamin-portfolio").put("version", "0.1.0");
        result.put("instructions", "Read published portfolio data. Any requested changes are proposals and require owner review; agents cannot directly mutate portfolio content.");
        return result;
    }

    private ObjectNode tools(Authentication authentication) {
        ArrayNode list = mapper.createArrayNode();
        if (hasScope(authentication, "portfolio:read")) {
            ObjectNode emptySchema = mapper.createObjectNode().put("type", "object");
            emptySchema.putArray("required");
            list.add(tool("portfolio_get_profile", "Read the published portfolio profile", emptySchema));
            ObjectNode projectSchema = mapper.createObjectNode().put("type", "object");
            list.add(tool("portfolio_list_projects", "List published portfolio projects", projectSchema));
        }
        if (hasScope(authentication, "portfolio:propose")) {
            ObjectNode schema = mapper.createObjectNode().put("type", "object");
            ObjectNode properties = schema.putObject("properties");
            properties.putObject("resource").put("type", "string").putArray("enum").add("profile").add("projects").add("experience").add("education").add("skills").add("skill-groups").add("achievements");
            properties.putObject("operation").put("type", "string").putArray("enum").add("CREATE").add("UPDATE").add("DELETE");
            properties.putObject("targetId").put("type", "string");
            properties.putObject("payload").put("type", "object");
            schema.putArray("required").add("resource").add("operation");
            list.add(tool("portfolio_create_change_proposal", "Submit a content change for explicit owner review. This does not apply the change.", schema));
        }
        ObjectNode result = mapper.createObjectNode();
        result.set("tools", list);
        return result;
    }

    private ObjectNode call(JsonNode params, Authentication authentication) throws Exception {
        String name = params.path("name").asText();
        JsonNode arguments = params.path("arguments");
        Object data;
        switch (name) {
            case "portfolio_get_profile" -> {
                requireScope(authentication, "portfolio:read");
                data = jdbc.queryForMap("SELECT full_name, headline, summary, location, email, website_url, github_url, linkedin_url FROM profile WHERE published = TRUE ORDER BY updated_at DESC LIMIT 1");
            }
            case "portfolio_list_projects" -> {
                requireScope(authentication, "portfolio:read");
                data = jdbc.queryForList("SELECT slug, name, tagline, summary, description, repository_url, live_url FROM projects WHERE published = TRUE ORDER BY sort_order, name");
            }
            case "portfolio_create_change_proposal" -> {
                requireScope(authentication, "portfolio:propose");
                UUID targetId = arguments.hasNonNull("targetId") ? UUID.fromString(arguments.get("targetId").asText()) : null;
                Map<String, Object> payload = arguments.has("payload") && arguments.get("payload").isObject()
                    ? mapper.convertValue(arguments.get("payload"), mapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)) : Map.of();
                data = proposals.create(arguments.path("resource").asText(), arguments.path("operation").asText(), targetId, payload, authentication.getName());
            }
            default -> throw new McpError(-32602, "Unknown tool");
        }
        ObjectNode result = mapper.createObjectNode();
        ArrayNode content = result.putArray("content");
        content.addObject().put("type", "text").put("text", mapper.writeValueAsString(data));
        result.set("structuredContent", mapper.valueToTree(data));
        result.put("isError", false);
        return result;
    }

    private ObjectNode tool(String name, String description, ObjectNode schema) {
        ObjectNode tool = mapper.createObjectNode();
        tool.put("name", name);
        tool.put("description", description);
        tool.set("inputSchema", schema);
        return tool;
    }

    private boolean hasScope(Authentication authentication, String scope) {
        return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(value -> value.equals("SCOPE_" + scope));
    }

    private void requireScope(Authentication authentication, String scope) {
        if (!hasScope(authentication, scope)) throw new McpError(-32003, "Token lacks required scope: " + scope);
    }

    private ObjectNode success(JsonNode id, Object result, boolean modern) {
        ObjectNode response = mapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        response.set("id", id == null ? mapper.getNodeFactory().nullNode() : id);
        ObjectNode resultNode = mapper.valueToTree(result);
        if (modern) {
            ObjectNode metadata = resultNode.putObject("_meta");
            metadata.putObject("io.modelcontextprotocol/serverInfo").put("name", "bchbenjamin-portfolio").put("version", "0.1.0");
        }
        response.set("result", resultNode);
        return response;
    }

    private ObjectNode error(JsonNode id, int code, String message) {
        ObjectNode response = mapper.createObjectNode();
        response.put("jsonrpc", "2.0");
        response.set("id", id == null ? mapper.getNodeFactory().nullNode() : id);
        response.putObject("error").put("code", code).put("message", message);
        return response;
    }

    private static final class McpError extends RuntimeException {
        private final int code;
        private McpError(int code, String message) { super(message); this.code = code; }
    }
}
