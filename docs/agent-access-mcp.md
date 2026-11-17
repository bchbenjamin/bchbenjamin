# Agent and MCP access — on hold

Agent REST and MCP expansion is intentionally paused per the owner's current product decision.

The existing implementation remains in the source tree for reference, but Spring Security denies `/api/v1/agent/**` and `/mcp`. The owner workspace does not expose token creation or MCP controls. Do not issue agent credentials or rely on the previous endpoint/protocol notes in this document.

Before reactivation, carry out a separate review covering:

- Explicit per-agent read and action scopes.
- Private career data and resume generation as opt-in scopes, never defaults.
- Independent token revocation, expiry and rotation.
- Sensitive-read audit events, per-token rate limits and usage quotas.
- Resource-level filters, media access policy and owner approval for writes.
- MCP protocol conformance and end-to-end tests with current clients.

No agent capability should bypass the same private-data boundary as the owner REST API. The next MCP design should be based on the completed CMS and resume permission model rather than on the legacy `portfolio:read` token scope.
