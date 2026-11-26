import {describe,expect,it} from "vitest";
import {site} from "../src/lib/content";
import {canonical,pageSeo,portfolioSchema,projectSchema,serializeJsonLd,summary} from "../src/lib/seo";
describe("public portfolio SEO",()=>{
 it("uses one canonical production hostname and distinct URLs",()=>{
  expect(canonical()).toBe("https://www.bchbenjamin.in/");
  expect(pageSeo(site,"/projects","Projects","Public projects").alternates?.canonical).toBe("https://www.bchbenjamin.in/projects");
  expect(pageSeo(site,"/experience","Experience","Public experience").openGraph?.url).toBe("https://www.bchbenjamin.in/experience");
 });
 it("uses current public projects and skills rather than private or stale records",()=>{
  const data=portfolioSchema({...site,projects:[],skillGroups:[{name:"Languages",skills:["Java","Python"]}]});
  expect(data["@graph"].some(node=>node["@type"]==="CreativeWork")).toBe(false);
  expect(data["@graph"].find(node=>node["@type"]==="Person")).toMatchObject({knowsAbout:["Java","Python"]});
  expect(JSON.stringify(data)).not.toContain(site.owner.email);
 });
 it("generates a project-specific schema and escapes script-breaking markup",()=>{
  expect(projectSchema(site.projects[0],site)).toMatchObject({name:site.projects[0].name,url:canonical("/projects/"+site.projects[0].slug)});
  expect(serializeJsonLd({name:"</script><script>"})).not.toContain("<");
  expect(JSON.parse(serializeJsonLd({name:"</script>"})).name).toBe("</script>");
 });
 it("normalizes and limits long descriptions",()=>{
  expect(summary("hello   world")).toBe("hello world");
  expect(summary("Portfolio project description ".repeat(20)).length).toBeLessThanOrEqual(155);
 });
});
