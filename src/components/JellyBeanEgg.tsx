"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
const dir="/jellybean/easter-egg/";
const colors=["#00cc00","#cc0000","#0000cc","#ffff00","#ff8000","#00ccff","#ff0080","#8000ff","#ff8080","#8080ff","#b0c0d0","#dddddd","#333333"];
type Bean={x:number;y:number;vx:number;vy:number;a:number;va:number;size:number;asset:number;color:number};
export default function JellyBeanEgg({game,onGame}:{game:boolean;onGame:()=>void}){
 const [face,setFace]=useState(false),[toast,setToast]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null),held=useRef(false);
 const board=useRef<HTMLCanvasElement>(null),beans=useRef<Bean[]>([]),drag=useRef<{i:number;x:number;y:number;t:number;dx:number;dy:number}|null>(null);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);if(toastTimer.current)clearTimeout(toastTimer.current)},[]);
 useEffect(()=>{
  if(!game||!board.current)return;
  const canvas=board.current,ctx=canvas.getContext("2d");if(!ctx)return;
  const assets=["redbean0","redbean0","redbean0","redbean0","redbean1","redbean1","redbean2","redbean2","redbeandroid","jandycane"];
  const sprites:HTMLCanvasElement[][]=assets.map(()=>[]);
  let frame=0,last=0,w=0,h=0,stopped=false;
  const random=(a:number,b:number)=>a+Math.random()*(b-a);
  const resize=()=>{w=canvas.clientWidth;h=canvas.clientHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);};
  resize();const observer=new ResizeObserver(resize);observer.observe(canvas);
  beans.current=Array.from({length:40},(_,i)=>{const z=(i/40)**2;return {x:random(0,w),y:random(0,h),vx:random(-40,40)*z,vy:random(-40,40)*z,a:random(0,360),va:random(-30,30),size:256*(.2+.8*z),asset:Math.random()<.01?9:Math.floor(random(0,9)),color:Math.floor(random(0,colors.length))}});
  assets.forEach((name,i)=>{const img=new window.Image();img.onload=()=>{if(stopped)return;colors.forEach((color,j)=>{const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const g=c.getContext("2d");if(!g)return;g.drawImage(img,0,0);if(i!==9){const p=g.getImageData(0,0,c.width,c.height);const rgb=[1,3,5].map(k=>parseInt(color.slice(k,k+2),16)/255);for(let n=0;n<p.data.length;n+=4){p.data[n]*=rgb[0];p.data[n+1]*=rgb[1];p.data[n+2]*=rgb[2];}g.putImageData(p,0,0);}sprites[i][j]=c;});};img.src=dir+name+".png";});
  function draw(t:number){if(!ctx||stopped)return;const dt=Math.min(.05,(t-(last||t))/1000);last=t;ctx.clearRect(0,0,w,h);
   beans.current.forEach((b,i)=>{if(drag.current?.i!==i){b.x+=b.vx*dt;b.y+=b.vy*dt;b.a+=b.va*dt;}
    if(b.x < -b.size||b.x>w+b.size||b.y < -b.size||b.y>h+b.size){b.x=random(0,w);b.y=random(0,h);b.vx=random(-40,40);b.vy=random(-40,40);}
    const sprite=sprites[b.asset]?.[b.color];if(!sprite)return;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a*Math.PI/180);ctx.drawImage(sprite,-b.size/2,-b.size/2,b.size,b.size);ctx.restore();});frame=requestAnimationFrame(draw);}
  frame=requestAnimationFrame(draw);return()=>{stopped=true;observer.disconnect();cancelAnimationFrame(frame);drag.current=null;};
 },[game]);
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
 return <div className="jb-original-egg" aria-label="Android Jelly Bean Easter egg">{game?<canvas ref={board} aria-label="Interactive BeanBag" onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.x,y=e.clientY-r.y;for(let i=beans.current.length-1;i>=0;i--){const b=beans.current[i];if(Math.hypot(x-b.x,y-b.y)<b.size*.42){drag.current={i,x,y,t:performance.now(),dx:x-b.x,dy:y-b.y};e.currentTarget.setPointerCapture(e.pointerId);break;}}}} onPointerMove={e=>{const d=drag.current;if(!d)return;const r=e.currentTarget.getBoundingClientRect(),x=e.clientX-r.x,y=e.clientY-r.y,t=performance.now(),dt=Math.max(.016,(t-d.t)/1000),b=beans.current[d.i];b.vx=Math.max(-1000,Math.min(1000,(x-d.x)/dt));b.vy=Math.max(-1000,Math.min(1000,(y-d.y)/dt));b.x=x-d.dx;b.y=y-d.dy;d.x=x;d.y=y;d.t=t;}} onPointerUp={()=>{const d=drag.current;if(d)beans.current[d.i].va=Math.max(-1080,Math.min(1080,beans.current[d.i].vx*.33));drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>:<><button type="button" aria-label="Jelly Bean Easter egg" className="jb-original-logo" onPointerDown={e=>{held.current=false;e.currentTarget.setPointerCapture(e.pointerId);clear();timer.current=setTimeout(()=>{held.current=true;onGame();},500);}} onPointerUp={clear} onPointerCancel={clear} onContextMenu={e=>e.preventDefault()} onClick={()=>{if(held.current)return;setFace(true);setToast(true);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(false),3500);}}><Image src={dir+(face?"platlogo":"platlogo_alt")+".png"} alt="" width={768} height={768} unoptimized draggable={false}/></button>{toast&&<div className="jb-egg-toast">Android 4.1.1<b>JELLY BEAN</b></div>}</>}</div>;
}
