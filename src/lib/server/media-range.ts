export function mediaRange(header:string|null,size:number):{start:number;end:number;partial:boolean}|null{
 if(!Number.isSafeInteger(size)||size<=0)return null;
 if(!header)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);
 if(!m||(!m[1]&&!m[2]))return null;
 if(!m[1]){const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<=0)return null;return {start:Math.max(0,size-suffix),end:size-1,partial:true};}
 const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return null;
 return {start,end,partial:true};
}
