package in.bchbenjamin.portfolio.analytics;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
public class AnalyticsController {
 private final JdbcTemplate jdbc;
 public AnalyticsController(JdbcTemplate jdbc) { this.jdbc=jdbc; }
 private String clean(Map<String,String> data,String key,int max) {
   String value=data.getOrDefault(key,"Unknown");
   if(value==null || !value.matches("[\\p{L}\\p{N} ._+-]{1,"+max+"}")) return "Unknown";
   return value;
 }
 @PostMapping("/api/v1/public/analytics")
 public ResponseEntity<Void> collect(@RequestBody Map<String,String> data,HttpServletRequest request) {
   String origin=request.getHeader("Origin");
   if(origin==null || !java.util.Set.of("https://www.bchbenjamin.in","https://bchbenjamin.in","https://bchbenjamin.vercel.app").contains(origin)) return ResponseEntity.status(403).build();
   if("1".equals(request.getHeader("Sec-GPC")) || "1".equals(request.getHeader("DNT"))) return ResponseEntity.noContent().build();
   String country=request.getHeader("x-vercel-ip-country");
   if(country==null || !country.matches("[A-Z]{2}")) country="ZZ";
   jdbc.update("INSERT INTO portfolio_viewing_minutes VALUES (date_trunc('minute',now())) ON CONFLICT DO NOTHING");
   if("visit".equals(data.get("event"))) jdbc.update("""
     INSERT INTO portfolio_analytics(day,country,model,os,browser,source,medium,campaign,visits)
     VALUES ((now() AT TIME ZONE 'UTC')::date,?,?,?,?,?,?,?,1)
     ON CONFLICT(day,country,model,os,browser,source,medium,campaign)
     DO UPDATE SET visits=portfolio_analytics.visits+1
     """,country,clean(data,"model",80),clean(data,"os",30),clean(data,"browser",30),clean(data,"source",80),clean(data,"medium",80),clean(data,"campaign",80));
   return ResponseEntity.noContent().build();
 }
 @GetMapping("/api/v1/admin/analytics")
 public Map<String,Object> report() {
   return Map.of("visits",jdbc.queryForObject("SELECT coalesce(sum(visits),0) FROM portfolio_analytics WHERE day >= current_date-6",Long.class),
   "minutes",jdbc.queryForObject("SELECT count(*) FROM portfolio_viewing_minutes WHERE minute >= now()-interval '7 days'",Long.class),
   "daily",jdbc.queryForList("SELECT day,sum(visits) visits FROM portfolio_analytics WHERE day >= current_date-6 GROUP BY day ORDER BY day"),
   "countries",jdbc.queryForList("SELECT country,sum(visits) visits FROM portfolio_analytics WHERE day >= current_date-6 GROUP BY country ORDER BY visits DESC LIMIT 30"),
   "devices",jdbc.queryForList("SELECT model,os,browser,sum(visits) visits FROM portfolio_analytics WHERE day >= current_date-6 GROUP BY model,os,browser ORDER BY visits DESC LIMIT 50"),
   "sources",jdbc.queryForList("SELECT source,medium,campaign,sum(visits) visits FROM portfolio_analytics WHERE day >= current_date-6 GROUP BY source,medium,campaign ORDER BY visits DESC LIMIT 50"));
 }
}
