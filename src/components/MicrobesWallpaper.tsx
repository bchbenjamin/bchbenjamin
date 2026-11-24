"use client";

import { useEffect, useMemo, useState } from "react";
type MicrobeStyle = React.CSSProperties & { "--microbe-hue": number; "--microbe-drift-x": string; "--microbe-drift-y": string; "--microbe-attract-x": string; "--microbe-attract-y": string };
type FoodDot={id:number;x:number;y:number};
type SplitMicrobe={id:number;x:number;y:number;hue:number;size:number};
type Attraction={x:string;y:string;until:number};
const HUES = [194, 207, 218, 135, 151, 168, 286, 326, 42, 18];

/** Browser recreation of the interactive Nexus S Microbes live wallpaper. */
export default function MicrobesWallpaper({ count = 28, speed = 0.65 }: { count?: number; speed?: number }) {
  const amount = Math.max(12, Math.min(38, count));
  const base = useMemo(()=>Array.from({length:amount},(_,index)=>({
    index,hue:HUES[(index*7+2)%HUES.length],left:(index*37+11)%96,top:(index*53+7)%94,size:12+((index*13)%25),
    driftX:`${((index*19)%90)-45}px`,driftY:`${((index*23)%84)-42}px`
  })),[amount]);
  const [food,setFood]=useState<FoodDot[]>([]);
  const [splits,setSplits]=useState<SplitMicrobe[]>([]);
  const [growth,setGrowth]=useState<Record<number,number>>({});
  const [attraction,setAttraction]=useState<Record<number,Attraction>>({});

  useEffect(()=>{
    const onPointer=(event:PointerEvent)=>{
      const target=event.target;
      if(target instanceof Element && target.closest("button,a,input,textarea,.jb-search-widget,.jb-gallery-widget,.jb-analog-clock,.jb-overlay,.jb-dock,.jb-navigation-bar,.jb-status-bar"))return;
      const device=document.querySelector(".jb-device")?.getBoundingClientRect();
      if(!device||!device.width||!device.height)return;
      const x=Math.max(0,Math.min(100,(event.clientX-device.left)/device.width*100));
      const y=Math.max(0,Math.min(100,(event.clientY-device.top)/device.height*100));
      const id=Date.now()+Math.floor(Math.random()*1000);
      setFood(items=>[...items.slice(-9),{id,x,y}]);
      let nearest=base[0],distance=Infinity;
      for(const microbe of base){const d=Math.hypot((microbe.left-x)*device.width/100,(microbe.top-y)*device.height/100);if(d<distance){distance=d;nearest=microbe;}}
      setAttraction(items=>({...items,[nearest.index]:{x:`${(x-nearest.left)*device.width/100}px`,y:`${(y-nearest.top)*device.height/100}px`,until:Date.now()+1700}}));
      const nextGrowth=(growth[nearest.index]??0)+1;
      if(nextGrowth>=3){
        setSplits(children=>children.length>=10?children:[...children,{id,x:nearest.left+((children.length%2)?2.2:-2.2),y:nearest.top+((children.length%3)-1)*2.2,hue:nearest.hue,size:Math.max(8,nearest.size*.65)}]);
        setGrowth(items=>({...items,[nearest.index]:0}));
      }else setGrowth(items=>({...items,[nearest.index]:nextGrowth}));
    };
    window.addEventListener("pointerdown",onPointer,{passive:true});
    return()=>window.removeEventListener("pointerdown",onPointer);
  },[base,growth]);

  useEffect(()=>{
    if(!food.length&&!Object.keys(attraction).length)return;
    const timeout=window.setTimeout(()=>{setFood(items=>items.filter(item=>Date.now()-item.id<1450));setAttraction(items=>Object.fromEntries(Object.entries(items).filter(([,value])=>value.until>Date.now())));},250);
    return()=>window.clearTimeout(timeout);
  },[food,attraction]);

  const renderMicrobe=(item:{index:number;hue:number;left:number;top:number;size:number;driftX:string;driftY:string},key:string)=>{
    const attracted=attraction[item.index];
    const style:MicrobeStyle={left:`${item.left}%`,top:`${item.top}%`,width:`${item.size}px`,height:`${item.size}px`,animationDelay:`-${(item.index*3)%29}s`,animationDuration:`${(18+(item.index%7)*4)/Math.max(.2,speed)}s`,transform:`scale(${1+(growth[item.index]??0)*.12})`,"--microbe-hue":item.hue,"--microbe-drift-x":attracted?.x??item.driftX,"--microbe-drift-y":attracted?.y??item.driftY,"--microbe-attract-x":attracted?.x??item.driftX,"--microbe-attract-y":attracted?.y??item.driftY};
    return <span className="jb-microbe" style={style} key={key}><i/><b/></span>;
  };

  return <div className="jb-microbes" aria-hidden="true">
    {base.map(item=>renderMicrobe(item,`base-${item.index}`))}
    {splits.map((item,index)=>renderMicrobe({index:amount+index,hue:item.hue,left:item.x,top:item.y,size:item.size,driftX:"28px",driftY:"-24px"},`split-${item.id}`))}
    {food.map(item=><span className="jb-microbe-food" key={item.id} style={{left:`${item.x}%`,top:`${item.y}%`}}/>)}
  </div>;
}
