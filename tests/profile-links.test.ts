import {describe,expect,it} from "vitest";
import {profileLinks} from "../src/lib/profile-links";
import {site} from "../src/lib/content";
describe("Google+ app links",()=>{
 it("uses actual public destinations and never duplicates the homepage",()=>{
  const links=profileLinks({...site,owner:{...site.owner,website:"https://bchbenjamin.in",github:"https://github.com/example",linkedin:"https://www.linkedin.com/in/example/",email:""}});
  expect(links[0]).toMatchObject({href:"/",internal:true});
  expect(links.filter(x=>x.label==="Website")).toHaveLength(0);
  expect(links.find(x=>x.label==="LinkedIn")?.href).toBe("https://www.linkedin.com/in/example/");
  expect(links.every(x=>x.icon.startsWith("/"))).toBe(true);
 });
 it("does not expose invalid links or placeholder chess websites",()=>{
  const links=profileLinks({...site,owner:{...site.owner,website:"javascript:alert(1)",github:"",linkedin:"",email:""},launcher:{...site.launcher,chessComProfileUrl:"https://www.chess.com",lichessProfileUrl:"https://lichess.org"}});
  expect(links.map(x=>x.label)).toEqual(["Portfolio"]);
 });
});
