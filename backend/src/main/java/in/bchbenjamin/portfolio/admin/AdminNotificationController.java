package in.bchbenjamin.portfolio.admin;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/admin/notifications")
public class AdminNotificationController {
    private static final Set<String> APPS=Set.of("about","projects","experience","education","certifications","achievements","gallery","files","googleplus","skills","journey","chess");
    private final JdbcTemplate jdbc;
    private final AdminAuditService audit;
    public AdminNotificationController(JdbcTemplate jdbc,AdminAuditService audit){this.jdbc=jdbc;this.audit=audit;}
    @GetMapping
    public List<Map<String,Object>> list(){
        return jdbc.queryForList("SELECT * FROM portfolio_notifications ORDER BY published_at DESC LIMIT 200");
    }
    @PostMapping
    @Transactional
    public Map<String,Object> publish(@RequestBody Map<String,Object> body,@AuthenticationPrincipal OidcUser actor){
        String title=field(body,"title",160),message=field(body,"body",1000),target=field(body,"target",1000);
        if(!validTarget(target))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Select a launcher app or a LinkedIn post URL");
        Object days=body.getOrDefault("days",7);
        if(!(days instanceof Number n)||n.doubleValue()!=n.intValue()||n.intValue()<1||n.intValue()>7)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Expiry must be 1–7 days");
        UUID id=jdbc.queryForObject("INSERT INTO portfolio_notifications(title,body,target,expires_at) VALUES (?,?,?,now()+ (? * interval '1 day')) RETURNING id",UUID.class,title,message,target,n.intValue());
        audit.record(actor,"PUBLISH","notification",id);
        return Map.of("id",id);
    }
    @DeleteMapping("/{id}")
    @Transactional
    public void revoke(@PathVariable UUID id,@AuthenticationPrincipal OidcUser actor){
        if(jdbc.update("UPDATE portfolio_notifications SET revoked=true WHERE id=?",id)==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Notification not found");
        audit.record(actor,"REVOKE","notification",id);
    }
    private static String field(Map<String,Object> body,String key,int max){
        Object v=body.get(key);
        if(!(v instanceof String s)||s.isBlank()||s.length()>max)throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid "+key);
        return s.strip();
    }
    static boolean validTarget(String target){
        if(target.startsWith("app:"))return APPS.contains(target.substring(4));
        try{
            URI u=URI.create(target);
            return "https".equals(u.getScheme())&&u.getUserInfo()==null&&u.getPort()==-1&&Set.of("linkedin.com","www.linkedin.com").contains(u.getHost())&&u.getPath()!=null&&(u.getPath().startsWith("/posts/")||u.getPath().startsWith("/feed/update/")||u.getPath().startsWith("/pulse/"));
        }catch(Exception e){return false;}
    }
}
