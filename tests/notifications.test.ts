import {expect,it} from "vitest";
import {activeNotifications,validNotificationTarget} from "../src/lib/notifications";
it("expires notifications and respects dismissal",()=>{
 const n={id:"1",title:"Test",body:"Test",target:"app:gallery",published_at:"2026-01-01T00:00:00Z",expires_at:"2026-01-08T00:00:00Z"};
 expect(activeNotifications([n],[],Date.parse("2026-01-07"))).toEqual([n]);
 expect(activeNotifications([n],[],Date.parse("2026-01-08"))).toEqual([]);
 expect(activeNotifications([n],["1"],Date.parse("2026-01-07"))).toEqual([]);
});
it("only allows known launcher apps or LinkedIn post links",()=>{
 expect(validNotificationTarget("app:gallery")).toBe(true);
 expect(validNotificationTarget("app:admin")).toBe(false);
 expect(validNotificationTarget("https://www.linkedin.com/posts/example")).toBe(true);
 expect(validNotificationTarget("https://www.linkedin.com.evil.test/posts/example")).toBe(false);
});
