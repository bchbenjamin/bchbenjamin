import {afterEach,describe,expect,it,vi} from "vitest";
import {clearAdminEntry,grantAdminEntry,hasAdminEntry} from "../src/lib/admin-entry";
afterEach(()=>vi.unstubAllGlobals());
describe("developer workspace entry",()=>{
 it("requires an explicit launcher entry in the current tab and clears on return",()=>{
  const values=new Map<string,string>();
  vi.stubGlobal("sessionStorage",{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)});
  expect(hasAdminEntry()).toBe(false);
  grantAdminEntry();
  expect(hasAdminEntry()).toBe(true);
  clearAdminEntry();
  expect(hasAdminEntry()).toBe(false);
 });
 it("fails closed when browser storage is unavailable",()=>{
  vi.stubGlobal("sessionStorage",{getItem:()=>{throw Error("blocked");}});
  expect(hasAdminEntry()).toBe(false);
 });
});
