"use client";
import {useEffect,useState} from "react";
type Report={visits:number;minutes:number;daily:Record<string,string|number>[];countries:Record<string,string|number>[];devices:Record<string,string|number>[];sources:Record<string,string|number>[]};
export default function AdminAnalytics(){
 const [data,setData]=useState<Report|null>(null);const [error,setError]=useState(false);
 useEffect(()=>{fetch("/api/v1/admin/analytics",{credentials:"include",cache:"no-store"}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(setData).catch(()=>setError(true));},[]);
 if(error)return <p>Analytics unavailable. Check your session and backend deployment.</p>;
 if(!data)return <p>Loading analytics…</p>;
 return <section><h2>Traffic analytics</h2><p>Last seven days · Anonymous aggregate data</p><div className="admin-metrics"><article><small>Page visits</small><strong>{data.visits}</strong></article><article><small>Observed viewing minutes</small><strong>{data.minutes}</strong></article><article><small>Countries</small><strong>{data.countries.length}</strong></article></div>{(["daily","countries","devices","sources"] as const).map(key=><section className="admin-report" key={key}><h3>{key}</h3>{data[key].length?<div className="admin-table-scroll"><table><thead><tr>{Object.keys(data[key][0]).map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{data[key].map((row,i)=><tr key={i}>{Object.values(row).map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table></div>:<p>No data yet.</p>}</section>)}</section>
}
