export function megabitsPerSecond(bytes:number,milliseconds:number){
 return milliseconds>0 ? bytes*8/1000/milliseconds : 0;
}
export function medianLatency(samples:number[]){
 const sorted=[...samples].sort((a,b)=>a-b);
 if(!sorted.length)return 0;
 const i=Math.floor(sorted.length/2);
 return sorted.length%2 ? sorted[i] : (sorted[i-1]+sorted[i])/2;
}
