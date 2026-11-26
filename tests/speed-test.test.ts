import {it,expect} from "vitest";
import {GET,POST} from "../src/app/api/speed-test/route";
import {megabitsPerSecond,medianLatency} from "../src/lib/speed-test";
it("calculates measured throughput and median latency",()=>{
 expect(megabitsPerSecond(1000000,1000)).toBe(8);
 expect(medianLatency([50,10,20])).toBe(20);
});
it("returns no-cache bounded download and latency responses",async()=>{
 const response=GET(new Request("https://example.com/api/speed-test?mode=download"));
 expect(response.headers.get("cache-control")).toContain("no-store");
 expect((await response.arrayBuffer()).byteLength).toBe(2*1024*1024);
 expect(GET(new Request("https://example.com/api/speed-test?mode=ping")).status).toBe(204);
});
it("discards uploaded bytes and rejects oversized or cross-origin tests",async()=>{
 const url="https://example.com/api/speed-test";
 const request=(n:number,origin="https://example.com")=>new Request(url,{method:"POST",headers:{"Content-Type":"application/octet-stream",origin},body:new Uint8Array(n)});
 expect(await (await POST(request(1024))).json()).toEqual({bytes:1024});
 expect((await POST(request(1024*1024+1))).status).toBe(413);
 expect((await POST(request(1,"https://other.example"))).status).toBe(403);
});
