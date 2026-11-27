import {expect,it} from "vitest";
import {mediaRange} from "../src/lib/server/media-range";
it("supports normal, open-ended and suffix HTTP ranges",()=>{
 expect(mediaRange(null,100)).toEqual({start:0,end:99,partial:false});
 expect(mediaRange("bytes=20-39",100)).toEqual({start:20,end:39,partial:true});
 expect(mediaRange("bytes=-10",100)).toEqual({start:90,end:99,partial:true});
 expect(mediaRange("bytes=90-",100)).toEqual({start:90,end:99,partial:true});
});
it("rejects invalid, multiple and unsatisfiable ranges",()=>{
 for(const v of ["bytes=100-","bytes=10-2","bytes=0-1,3-4","bytes=-0","bytes=-"])expect(mediaRange(v,100)).toBeNull();
});
