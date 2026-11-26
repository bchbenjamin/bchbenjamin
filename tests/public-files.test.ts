import {describe,expect,it} from "vitest";
import {ANDROID_FOLDERS,categoryOf,filesInFolder,fileSize,type PublicFile} from "../src/lib/public-files";
describe("read-only portfolio file system",()=>{
 it("has one virtual storage root with a portfolio directory",()=>{expect(ANDROID_FOLDERS).toContain("Portfolio");expect(ANDROID_FOLDERS).toContain("DCIM");});
 it("sorts naturally and keeps categories separate",()=>{
  const files=[["Certificate 10.pdf","Certificates"],["Certificate 2.pdf","Certificates"],["Report.pdf","Documents"]].map(([original_filename,category],i):PublicFile=>({id:String(i),original_filename,category,content_type:"application/pdf",byte_size:12,caption:"",url:""}));
  expect(filesInFolder(files,"Certificates").map(x=>x.original_filename)).toEqual(["Certificate 2.pdf","Certificate 10.pdf"]);
  expect(categoryOf({category:"unknown",content_type:"application/pdf"})).toBe("Documents");
  expect(fileSize(2048)).toBe("2.0 KB");
 });
});
