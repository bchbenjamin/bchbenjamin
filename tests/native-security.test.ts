import {expect,it} from "vitest";
import {base32,totp,isAllowed} from "../src/lib/server/owner-auth";
import {sanitize} from "../src/lib/server/admin-content";
import {normalizePath,validSignature} from "../src/lib/server/admin-media";
import {validatedSelection} from "../src/lib/server/admin-resume";
it("uses standard RFC TOTP values and base32",()=>{
 expect(base32(Buffer.from("foo"))).toBe("MZXW6");
 expect(totp(Buffer.from("12345678901234567890"),1)).toBe("287082");
 expect(totp(Buffer.from("12345678901234567890"),Math.floor(1111111109/30))).toBe("081804");
});
it("denies unverified email and wrong issuer, and accepts explicit immutable subject",()=>{
 const issuer="https://accounts.google.com",allow=issuer+"|owner@example.com,"+issuer+"|123";
 expect(isAllowed(issuer,"other","owner@example.com",false,allow)).toBe(false);
 expect(isAllowed(issuer,"other","owner@example.com",true,allow)).toBe(true);
 expect(isAllowed("https://other.example","123","owner@example.com",true,allow)).toBe(false);
 expect(isAllowed(issuer,"123","",false,allow)).toBe(true);
});
it("accepts only registered content fields and validates visibility metadata",()=>{
 const {values}=sanitize("profile",{summary:"Updated",publicFields:{summary:false},id:"cannot overwrite",unknown:"ignore"},false);
 expect(values.map(x=>x.column)).toEqual(["summary","public_fields"]);
 expect(()=>sanitize("constructor",{summary:"x"},false)).toThrow();
 expect(()=>sanitize("profile",{publicFields:{summary:"yes"}},false)).toThrow();
 expect(()=>sanitize("profile",{profilePhotoId:"bad"},false)).toThrow();
});
it("rejects fake content types and directory traversal",()=>{
 expect(validSignature("application/pdf",Buffer.from("%PDF-1.7"))).toBe(true);
 expect(validSignature("image/jpeg",Buffer.from("%PDF-1.7"))).toBe(false);
 expect(normalizePath("Certificates/2026")).toBe("Certificates/2026");
 expect(()=>normalizePath("../Private")).toThrow();
});
it("AI cannot select invented evidence IDs",()=>{
 const result=validatedSelection({projects:["known","invented"],matchedRequirements:[{requirement:"Example",sourceIds:["known","invented"]}]},{profile:{},projects:[{id:"known"}],experience:[],education:[],skills:[],achievements:[]});
 expect(result.projects).toEqual(["known"]);expect(result.matchedRequirements).toEqual([{requirement:"Example",sourceIds:["known"]}]);
});
