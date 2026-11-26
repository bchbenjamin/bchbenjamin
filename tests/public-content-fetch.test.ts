import {afterEach,describe,expect,it,vi} from "vitest";
import {fetchPublicJson} from "../src/lib/content";
afterEach(()=>vi.unstubAllGlobals());
describe("public API cold-start recovery",()=>{
 it("retries a transient backend error",async()=>{
  const fetcher=vi.fn().mockResolvedValueOnce(new Response("",{status:503})).mockResolvedValueOnce(Response.json({name:"Published"}));
  vi.stubGlobal("fetch",fetcher);
  expect(await fetchPublicJson("https://example.invalid/profile")).toEqual({name:"Published"});
  expect(fetcher).toHaveBeenCalledTimes(2);
 });
 it("does not retry unpublished or rate-limited content",async()=>{
  for(const status of [404,401,403,429]){
   const fetcher=vi.fn().mockResolvedValue(new Response("",{status}));
   vi.stubGlobal("fetch",fetcher);
   expect(await fetchPublicJson("https://example.invalid/profile")).toBeNull();
   expect(fetcher).toHaveBeenCalledTimes(1);
  }
 });
 it("bounds connection retries and never substitutes stale data",async()=>{
  const fetcher=vi.fn().mockRejectedValue(Error("connection"));
  vi.stubGlobal("fetch",fetcher);
  expect(await fetchPublicJson("https://example.invalid/profile")).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(2);
 });
});
