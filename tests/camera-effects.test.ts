import {expect,it} from "vitest";
import {invertPhotoPixels} from "../src/lib/camera-effects";
it("inverts actual saved RGB pixels without changing transparency",()=>{
 const pixels=new Uint8ClampedArray([0,127,255,200,40,50,60,255]);
 expect([...invertPhotoPixels(pixels)]).toEqual([255,128,0,200,215,205,195,255]);
});
