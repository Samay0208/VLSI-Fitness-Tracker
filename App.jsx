import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";

// ══ PERSONALIZATION ENGINE ════════════════════════════════════
const PE = {
  weightTrend(m){if(m.length<2)return'insufficient';const s=[...m].sort((a,b)=>new Date(a.date)-new Date(b.date));const r=s.slice(-Math.min(s.length,4));const wk=(r[r.length-1].weight-r[0].weight)/Math.max(0.5,(new Date(r[r.length-1].date)-new Date(r[0].date))/(7*864e5));if(wk>0.25)return'gaining';if(wk<-0.8)return'losing_fast';if(wk<-0.1)return'losing';return'plateau';},
  weeklyRate(m){if(m.length<2)return 0;const s=[...m].sort((a,b)=>new Date(a.date)-new Date(b.date));return+((s[0].weight-s[s.length-1].weight)/Math.max(0.5,(new Date(s[s.length-1].date)-new Date(s[0].date))/(7*864e5))).toFixed(2);},
  stubbornAreas(m){if(m.length<2)return[];const s=[...m].sort((a,b)=>new Date(a.date)-new Date(b.date));const[f,l]=[s[0],s[s.length-1]];const wk=Math.max(0.5,(new Date(l.date)-new Date(f.date))/(7*864e5));if((f.weight-l.weight)/wk<0.08)return[];const a=[];if(l.waist&&f.waist&&(f.waist-l.waist)/wk<0.3)a.push('waist');if(l.thighs&&f.thighs&&(f.thighs-l.thighs)/wk<0.2)a.push('thighs');if(l.hips&&f.hips&&(f.hips-l.hips)/wk<0.2)a.push('hips');return a;},
  diet(wt,ph,trend){const BMR=Math.round(10*wt+6.25*183-5*23+5);const TDEE=Math.round(BMR*[1.375,1.55,1.65][ph||0]);const def={gaining:550,plateau:450,losing:300,losing_fast:-150,insufficient:350}[trend]??350;const kcal=Math.max(1500,TDEE-def);const protein=Math.round(wt*1.9);const fat=Math.round(kcal*0.25/9);const carbs=Math.round((kcal-protein*4-fat*9)/4);return{kcal,protein,fat,carbs,TDEE,def,BMR};},
  vlsiLevel(scores){if(!scores?.length)return{level:'beginner',style:'detailed with analogies',avgPct:0};const r=scores.slice(-5);const avg=r.reduce((a,s)=>a+s.score/s.total,0)/r.length;const pct=Math.round(avg*100);return{level:pct>=80?'advanced':pct>=60?'intermediate':'beginner',style:pct<50?'simple + real-world analogies':pct<65?'detailed + worked examples':pct<80?'standard':'concise + edge cases',avgPct:pct};},
  adaptations(m,ph){const trend=this.weightTrend(m);const sub=this.stubbornAreas(m);const r=[];if(trend==='plateau')r.push({icon:'🔄',col:'#BA7517',text:'Plateau: +5kg to all lifts, HIIT → 40s ON/20s OFF'});if(trend==='gaining')r.push({icon:'⚠️',col:'#E24B4A',text:'Gaining: add 15min LISS, reduce rest to 60s'});if(trend==='losing_fast')r.push({icon:'🛡️',col:'#BA7517',text:'Losing too fast: eat +150kcal, HIIT → 8 rounds'});if(trend==='losing')r.push({icon:'✅',col:'#1D9E75',text:'Perfect pace — keep everything the same'});if(sub.includes('waist'))r.push({icon:'🎯',col:'#7F77DD',text:'Waist: +3×20 weighted Russian twists + 5min ab circuit'});if(sub.includes('thighs'))r.push({icon:'🎯',col:'#D4537E',text:'Thighs: +sumo squat 3×15 + bike HIIT 10min'});return r;},
  fitCtx(m,p){const s=[...m].sort((a,b)=>new Date(a.date)-new Date(b.date));const f=s[0]||p.firstMeasurement||{};const l=s[s.length-1]||f;const d=this.diet(l.weight||90,p.fitPhase||0,this.weightTrend(m));return`FITNESS PROFILE:\nWeight: ${f.weight||90}→${l.weight||90}kg | Trend: ${this.weightTrend(m)} | Rate: ${this.weeklyRate(m)}kg/wk\nWaist: ${f.waist||'?'}→${l.waist||'?'}cm | Thighs: ${f.thighs||'?'}→${l.thighs||'?'}cm | Hips: ${f.hips||'?'}→${l.hips||'?'}cm\nStubborn: ${this.stubbornAreas(m).join(', ')||'none'} | TDEE: ${d.TDEE} | Target: ${d.kcal}kcal | Protein: ${d.protein}g\nPhase: ${['Habit 3x/wk','Upper-Lower 4x/wk','PPL 5x/wk'][p.fitPhase||0]} | Vegetarian`;},
  vlsiCtx(vp,p){const scores=vp?.testScores||[];const lv=this.vlsiLevel(scores);return`VLSI PROFILE:\nLevel: ${lv.level} (${lv.avgPct}%) | Style: ${lv.style} | Lessons done: ${vp?.completedDays?.length||0}\nPhase: ${VLSI_PHASES[p.vlsiPhase]?.name}, Day ${p.vlsiDay}\n${lv.avgPct<50?'⚠️ Struggling — use analogies, extra examples':''}${lv.avgPct>=80?'⭐ Excelling — industry depth, edge cases':''}`;}
};

// ══ DATA ══════════════════════════════════════════════════════
const VLSI_PHASES=[{id:0,name:"Digital Logic",weeks:2,days:14,color:"#1D9E75"},{id:1,name:"Verilog HDL",weeks:4,days:28,color:"#378ADD"},{id:2,name:"RTL Design",weeks:6,days:42,color:"#7F77DD"},{id:3,name:"SV + UVM",weeks:6,days:42,color:"#D4537E"},{id:4,name:"Physical Design",weeks:8,days:56,color:"#BA7517"},{id:5,name:"Advanced Topics",weeks:4,days:28,color:"#639922"},{id:6,name:"Portfolio & Jobs",weeks:4,days:28,color:"#E24B4A"}];
const FIT_PHASES=[{id:0,name:"Build the Habit",weeks:8,gymDays:["Mon","Wed","Fri"],color:"#1D9E75"},{id:1,name:"Upper–Lower",weeks:12,gymDays:["Mon","Tue","Thu","Fri"],color:"#378ADD"},{id:2,name:"PPL Recomp",weeks:17,gymDays:["Mon","Tue","Wed","Thu","Fri"],color:"#7F77DD"}];
const SEED={"0-1":{day:1,phase:0,title:"Boolean Algebra Foundations",videoId:"gI-qXk7XojA",notes:`# Boolean Algebra\n\nVariables are ONLY 0 or 1. The foundation of every chip.\n\n## Operations\n\n**AND (·)** — Output 1 ONLY when ALL inputs are 1\n**OR (+)** — Output 1 when at least ONE input is 1\n**NOT (')** — Inverts: 0→1, 1→0\n\n## Key Identities\n\n| Name | AND | OR |\n|------|-----|----|\n| Identity | A·1=A | A+0=A |\n| Null | A·0=0 | A+1=1 |\n| Complement | A·A'=0 | A+A'=1 |\n| Involution | (A')'=A | — |\n| Distributive | A(B+C)=AB+AC | A+(BC)=(A+B)(A+C) |\n| Absorption | A+AB=A | — |`,exercise:`Evaluate F = AB + A'C when A=1, B=0, C=1\nStep 1: A'=0, AB=0, A'C=0, F=0+0=0\nTry: A=0, B=1, C=1 → ?`,assignment:`Complete truth tables (8 rows each):\n1. F = AB + BC\n2. F = A·(B + C')\n3. F = (A+B)·(A'+C)`,resources:[{title:"Neso Academy — Boolean Algebra",url:"https://www.youtube.com/playlist?list=PLBlnK6fEyqRjMH3mWf6kwqiTbT798eAOm"}],flashcards:[{q:"What does AND gate output?",a:"1 only when ALL inputs are 1"},{q:"What does OR gate output?",a:"1 when at least ONE input is 1"},{q:"What is De Morgan's Theorem 1?",a:"(AB)' = A' + B'"},{q:"What is absorption law?",a:"A + AB = A"},{q:"What is (A')' equal to?",a:"A (double negation)"}]},"0-2":{day:2,phase:0,title:"De Morgan's & Simplification",videoId:"7nNVMzJBqsE",notes:`# De Morgan's Theorems\n\n**Theorem 1:** (A·B)' = A' + B'\n**Theorem 2:** (A + B)' = A'·B'\n\n## Golden Rule: "Break the bar, change the sign"\n\n## Key Simplifications\n\n- Absorption: A + AB = A\n- XOR pattern: A'B + AB' = A⊕B\n- XNOR: A'B' + AB = A⊙B`,exercise:`Simplify (A'B + AB')' → A'B' + AB (XNOR)`,assignment:`1. Simplify ((A+B)(C+D))'\n2. Prove A + A'B = A + B\n3. Minimize A'B'C + A'BC + AB'C + ABC`,resources:[{title:"De Morgan's — Neso Academy",url:"https://www.youtube.com/watch?v=7nNVMzJBqsE"}],flashcards:[{q:"State De Morgan's Theorem 1",a:"(AB)' = A' + B'"},{q:"State De Morgan's Theorem 2",a:"(A+B)' = A'·B'"},{q:"Simplify (ABC)'",a:"A' + B' + C'"},{q:"What is the golden rule for De Morgan's?",a:"Break the bar, change the sign (AND↔OR)"},{q:"A'B + AB' equals what?",a:"A ⊕ B (XOR)"}]}};
const WORKOUTS={A:{name:"Full Body A",tag:"Strength + Core",duration:"70 min",color:"#1D9E75",warmup:"5 min treadmill + arm/hip circles",exercises:[{name:"Goblet Squat",defaultSets:3,defaultReps:10,rest:"90s",tip:"Chest up, to parallel"},{name:"DB Bench Press",defaultSets:3,defaultReps:10,rest:"90s",tip:"3-sec down, elbows 45°"},{name:"Seated Cable Row",defaultSets:3,defaultReps:10,rest:"90s",tip:"Full squeeze every rep"},{name:"DB Overhead Press",defaultSets:3,defaultReps:10,rest:"90s",tip:"Core braced, press vertical"},{name:"Weighted Russian Twists",defaultSets:3,defaultReps:20,rest:"60s",tip:"Feet off floor — love handles"},{name:"Hanging Leg Raise",defaultSets:3,defaultReps:10,rest:"60s",tip:"Slow — lower belly"},{name:"HIIT Finisher",defaultSets:0,defaultReps:0,rest:"—",tip:"10×30s sprint/30s walk",isHiit:true}],cooldown:"5 min — hip flexors, chest, lats"},B:{name:"Full Body B",tag:"Power + Pull",duration:"70 min",color:"#378ADD",warmup:"5 min bike + leg swings",exercises:[{name:"Romanian Deadlift",defaultSets:3,defaultReps:8,rest:"90s",tip:"Hip hinge, flat back"},{name:"Incline DB Press",defaultSets:3,defaultReps:10,rest:"90s",tip:"30° incline, controlled"},{name:"Lat Pulldown",defaultSets:3,defaultReps:10,rest:"90s",tip:"Pull to upper chest"},{name:"Walking Lunges",defaultSets:3,defaultReps:10,rest:"90s",tip:"Torso upright — thighs"},{name:"Bicycle Crunches",defaultSets:3,defaultReps:20,rest:"60s",tip:"Slow — both obliques"},{name:"Mountain Climbers",defaultSets:3,defaultReps:0,rest:"60s",tip:"30s fast cadence"},{name:"HIIT Finisher",defaultSets:0,defaultReps:0,rest:"—",tip:"10×20s max/40s easy",isHiit:true}],cooldown:"5 min — quad, pigeon, shoulder"},REST:{name:"Active Recovery",tag:"Rest Day",duration:"30–40 min",color:"#888",warmup:"—",exercises:[{name:"Brisk Walk",defaultSets:0,defaultReps:0,rest:"—",tip:"30 min LISS — fat burn, no muscle loss"},{name:"Full Body Stretch",defaultSets:0,defaultReps:0,rest:"—",tip:"Hip flexors + quads"}],cooldown:"—"}};

// ══ DB + API ══════════════════════════════════════════════════
const db={get:async(k)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}},set:async(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){console.error(e);return false;}}};
async function ai(msg,sys="",hist=[],mcpServers=[]){const body={model:"claude-sonnet-4-20250514",max_tokens:1200,messages:[...hist.map(m=>({role:m.role,content:m.content})),{role:"user",content:msg}]};if(sys)body.system=sys;if(mcpServers.length)body.mcp_servers=mcpServers;const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();return d.content?.find(c=>c.type==='text')?.text||"No response.";}
async function aiVision(imageB64,mediaType,promptText,sys=""){const body={model:"claude-sonnet-4-20250514",max_tokens:1200,system:sys,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:mediaType,data:imageB64}},{type:"text",text:promptText}]}]};const r=await fetch("/api/claude",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();return d.content?.[0]?.text||"Could not analyze image.";}
const getDOW=()=>['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
const todayKey=()=>new Date().toISOString().split('T')[0];

// ══ STYLE TOKENS ══════════════════════════════════════════════
const C={vlsi:"#378ADD",fit:"#1D9E75",ai:"#7F77DD",track:"#BA7517",home:"#E24B4A"};
const T={card:{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:'var(--border-radius-lg)',padding:'1rem 1.1rem',marginBottom:10},sub:{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-lg)',padding:'1rem 1.1rem',marginBottom:10},input:{width:'100%',padding:'10px 12px',border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-md)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',fontSize:14,outline:'none'},ta:{width:'100%',padding:'10px 12px',border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-md)',background:'var(--color-background-secondary)',color:'var(--color-text-primary)',fontSize:13,fontFamily:'var(--font-mono)',resize:'vertical',outline:'none'},btnP:(col)=>({padding:'12px 20px',border:'none',borderRadius:'var(--border-radius-md)',background:col||'var(--color-text-primary)',color:'#fff',fontSize:14,fontWeight:500,cursor:'pointer',width:'100%'}),btnS:{padding:'9px 14px',border:'0.5px solid var(--color-border-secondary)',borderRadius:'var(--border-radius-md)',background:'var(--color-background-primary)',color:'var(--color-text-primary)',fontSize:13,cursor:'pointer'},lbl:{fontSize:12,fontWeight:500,color:'var(--color-text-secondary)',display:'block',marginBottom:4},chip:(on,col)=>({padding:'7px 14px',border:`0.5px solid ${on?(col||'var(--color-text-primary)'):'var(--color-border-secondary)'}`,borderRadius:20,fontSize:12,fontWeight:on?500:400,background:on?(col||'var(--color-text-primary)'):'var(--color-background-primary)',color:on?'#fff':'var(--color-text-secondary)',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0})};

// ══ SHARED UI COMPONENTS ══════════════════════════════════════
function Pill({children,col,size='sm'}){return <span style={{fontSize:size==='lg'?13:11,padding:size==='lg'?'5px 13px':'3px 9px',borderRadius:20,background:`${col}18`,color:col,fontWeight:500,display:'inline-block'}}>{children}</span>;}
function PhaseBar({phases,current,currentDay}){const pct=Math.min(100,Math.round(((currentDay-1)/phases[current].days)*100));return<div style={{marginBottom:12}}><div style={{display:'flex',gap:2,height:5,borderRadius:3,overflow:'hidden',marginBottom:5}}>{phases.map((ph,i)=>{const fill=i<current?100:i===current?pct:0;return<div key={i} style={{flex:ph.days,background:'var(--color-border-tertiary)',position:'relative',borderRadius:i===0?'3px 0 0 3px':i===phases.length-1?'0 3px 3px 0':'0'}}><div style={{position:'absolute',inset:0,width:`${fill}%`,background:ph.color,transition:'width .3s'}}/></div>;})}</div><div style={{display:'flex',justifyContent:'space-between'}}><p style={{fontSize:11,color:'var(--color-text-secondary)'}}>{phases[current].name} · Day {currentDay}/{phases[current].days}</p><p style={{fontSize:11,color:phases[current].color,fontWeight:500}}>{pct}%</p></div></div>;}
function Ring({score,total,size=64}){const pct=total?score/total:0;const col=pct>=0.8?'#1D9E75':pct>=0.6?'#378ADD':'#E24B4A';const r=size/2-5,cx=size/2,cy=size/2,circ=2*Math.PI*r,dash=circ*pct;return<svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}><circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={4}/><circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={4} strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}/><text x={cx} y={cy-3} textAnchor="middle" fontSize="13" fontWeight="600" fill={col}>{score}/{total}</text><text x={cx} y={cy+9} textAnchor="middle" fontSize="8" fill="var(--color-text-tertiary)">{Math.round(pct*100)}%</text></svg>;}
function MacroBar({protein,carbs,fat}){const t=protein*4+carbs*4+fat*9||1;const pp=Math.round(protein*4/t*100),cp=Math.round(carbs*4/t*100),fp=100-pp-cp;return<div><div style={{display:'flex',height:7,borderRadius:4,overflow:'hidden',marginBottom:5}}><div style={{width:`${pp}%`,background:'#1D9E75'}}/><div style={{width:`${cp}%`,background:'#378ADD'}}/><div style={{width:`${fp}%`,background:'#BA7517'}}/></div><div style={{display:'flex',gap:10}}>{[['#1D9E75','Protein',`${protein}g`],['#378ADD','Carbs',`${carbs}g`],['#BA7517','Fat',`${fat}g`]].map(([col,l,v])=><div key={l} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:7,height:7,borderRadius:1,background:col}}/><span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{l} <strong>{v}</strong></span></div>)}</div></div>;}
function MdText({text}){if(!text)return null;return<div style={{fontSize:13,lineHeight:1.75,color:'var(--color-text-primary)'}}>{text.split('\n').map((line,i)=>{if(line.startsWith('# '))return<h2 key={i} style={{fontSize:16,fontWeight:500,margin:'14px 0 6px'}}>{line.slice(2)}</h2>;if(line.startsWith('## '))return<h3 key={i} style={{fontSize:13,fontWeight:500,margin:'10px 0 4px',color:'var(--color-text-secondary)',borderBottom:'0.5px solid var(--color-border-tertiary)',paddingBottom:3}}>{line.slice(3)}</h3>;if(line.startsWith('| ')){const cells=line.split('|').filter(c=>c.trim());if(cells.every(c=>/^[-:\s]+$/.test(c)))return null;const isH=i<text.split('\n').length-1&&text.split('\n')[i+1]?.startsWith('|---');return<div key={i} style={{display:'grid',gridTemplateColumns:`repeat(${cells.length},1fr)`,gap:1,marginBottom:1}}>{cells.map((c,j)=><div key={j} style={{padding:'5px 8px',background:isH?'var(--color-background-secondary)':'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',fontSize:11,fontWeight:isH?500:400}}>{c.trim()}</div>)}</div>;}if(line.trim()==='')return<div key={i} style={{height:6}}/>;const parts=line.split(/\*\*(.*?)\*\*/g);return<p key={i} style={{margin:'1px 0'}}>{parts.map((p,j)=>j%2?<strong key={j}>{p}</strong>:p)}</p>;})}</div>;}
function Tabs({tabs,active,setActive,col}){return<div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:12}}>{tabs.map(([id,label])=><button key={id} onClick={()=>setActive(id)} style={T.chip(active===id,col)}>{label}</button>)}</div>;}

// ══ LOADING / SETUP ══════════════════════════════════════════
function Loading(){return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',gap:12}}><i className="ti ti-loader-2" style={{fontSize:40,color:'var(--color-text-secondary)'}}/><p style={{fontSize:14,color:'var(--color-text-secondary)'}}>Loading your tracker...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>;}
function Setup({onDone}){const[name,setName]=useState('');const[weight,setWeight]=useState('90');const[waist,setWaist]=useState('');const[hips,setHips]=useState('');const[thighs,setThighs]=useState('');return<div style={{padding:'2rem 1.25rem',maxWidth:420,margin:'0 auto'}}><div style={{textAlign:'center',marginBottom:'2rem'}}><div style={{width:64,height:64,borderRadius:16,background:'var(--color-background-secondary)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><i className="ti ti-rocket" style={{fontSize:32,color:'var(--color-text-primary)'}}/></div><h1 style={{fontSize:22,fontWeight:500,marginBottom:6}}>Set up your profile</h1><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Everything personalizes to you.</p></div><div style={{marginBottom:12}}><label style={T.lbl}>Your name</label><input style={T.input} placeholder="e.g. Arjun" value={name} onChange={e=>setName(e.target.value)}/></div><div style={{marginBottom:12}}><label style={T.lbl}>Current weight (kg)</label><input style={T.input} type="number" value={weight} onChange={e=>setWeight(e.target.value)}/></div><p style={{fontSize:12,color:'var(--color-text-secondary)',marginBottom:8}}>Starting measurements (cm) — tracks stubborn fat zones</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:24}}><div><label style={T.lbl}>Waist</label><input style={T.input} type="number" placeholder="e.g. 90" value={waist} onChange={e=>setWaist(e.target.value)}/></div><div><label style={T.lbl}>Hips</label><input style={T.input} type="number" placeholder="e.g. 100" value={hips} onChange={e=>setHips(e.target.value)}/></div><div><label style={T.lbl}>Left thigh</label><input style={T.input} type="number" placeholder="e.g. 58" value={thighs} onChange={e=>setThighs(e.target.value)}/></div></div><button onClick={()=>{if(!name.trim())return;onDone({name:name.trim(),startDate:new Date().toISOString(),vlsiPhase:0,vlsiDay:1,fitPhase:0,firstMeasurement:{date:new Date().toISOString(),weight:+weight,waist:waist?+waist:null,hips:hips?+hips:null,thighs:thighs?+thighs:null}});}} style={{...T.btnP(),opacity:name.trim()?1:0.5}} disabled={!name.trim()}>Start my journey →</button></div>;}

// ══ WORKOUT LOGGER ════════════════════════════════════════════
function WorkoutLogger({workout,profile,measurements,onSave}){
  const[log,setLog]=useState({});const[saving,setSaving]=useState(false);const[saved,setSaved]=useState(false);
  const m=measurements.length?measurements:[profile.firstMeasurement].filter(Boolean);
  const updateSet=(exName,si,field,val)=>setLog(l=>{const s=[...(l[exName]||[])];s[si]={...(s[si]||{}),done:false,[field]:val};return{...l,[exName]:s};});
  const toggleDone=(exName,si)=>setLog(l=>{const s=[...(l[exName]||[])];s[si]={...(s[si]||{}),done:!s[si]?.done};return{...l,[exName]:s};});
  const addSet=exName=>setLog(l=>({...l,[exName]:[...(l[exName]||[]),{reps:'',weight:'',done:false}]}));
  const totalSets=Object.values(log).reduce((a,sets)=>a+sets.filter(s=>s.done).length,0);
  const totalEx=workout.exercises.filter(e=>e.defaultSets>0).length;

  const save=async()=>{
    setSaving(true);
    const entry={date:todayKey(),workout:workout.name,log,isExtra:false};
    const existing=await db.get('workoutLogs')||[];
    await db.set('workoutLogs',[...existing,entry]);
    onSave&&onSave(entry);setSaved(true);setSaving(false);
  };

  return<div>
    <div style={{...T.sub,display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div><p style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>SETS COMPLETED</p><p style={{fontSize:20,fontWeight:500,color:workout.color||'#888'}}>{totalSets} sets done</p></div>
      <div style={{textAlign:'right'}}><p style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>EXERCISES</p><p style={{fontSize:20,fontWeight:500,color:'var(--color-text-primary)'}}>{Object.keys(log).filter(k=>log[k].some(s=>s.done)).length}/{totalEx}</p></div>
    </div>

    {workout.exercises.filter(e=>e.defaultSets>0).map((ex,ei)=>{
      const sets=log[ex.name]||Array.from({length:ex.defaultSets},()=>({reps:String(ex.defaultReps||0),weight:'',done:false}));
      if(!log[ex.name]&&sets.length>0)setTimeout(()=>setLog(l=>({...l,[ex.name]:sets})),0);
      const allDone=sets.every(s=>s.done);
      return<div key={ei} style={{...T.card,borderLeft:`3px solid ${allDone?workout.color||'#888':'var(--color-border-tertiary)'}`,borderRadius:'0 12px 12px 0',transition:'border-color .2s'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <p style={{fontSize:14,fontWeight:500,color:allDone?'var(--color-text-secondary)':'var(--color-text-primary)',textDecoration:allDone?'line-through':'none'}}>{ex.name}</p>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--color-text-tertiary)'}}>rest {ex.rest}</span>
            {allDone&&<i className="ti ti-check" style={{fontSize:14,color:workout.color||'#888'}}/>}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {sets.map((s,si)=>(
            <div key={si} style={{display:'flex',gap:6,alignItems:'center'}}>
              <div style={{width:22,height:22,borderRadius:6,border:`1.5px solid ${s.done?(workout.color||'#888'):'var(--color-border-secondary)'}`,background:s.done?`${workout.color||'#888'}22`:'var(--color-background-primary)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,fontSize:10,fontWeight:600,color:s.done?(workout.color||'#888'):'var(--color-text-tertiary)'}} onClick={()=>toggleDone(ex.name,si)}>{s.done?'✓':si+1}</div>
              <input value={s.reps} onChange={e=>updateSet(ex.name,si,'reps',e.target.value)} style={{...T.input,width:60,padding:'6px 8px',fontSize:13,textAlign:'center'}} placeholder="reps" type="number"/>
              <input value={s.weight} onChange={e=>updateSet(ex.name,si,'weight',e.target.value)} style={{...T.input,width:70,padding:'6px 8px',fontSize:13,textAlign:'center'}} placeholder="kg" type="number"/>
              <span style={{fontSize:11,color:'var(--color-text-tertiary)',flexShrink:0}}>kg</span>
            </div>
          ))}
        </div>
        <button onClick={()=>addSet(ex.name)} style={{fontSize:11,color:'var(--color-text-secondary)',background:'none',border:'none',cursor:'pointer',marginTop:6,padding:'2px 0'}}>+ Add set</button>
      </div>;
    })}

    {saved?<div style={{...T.sub,textAlign:'center',border:'0.5px solid var(--color-border-success)'}}><i className="ti ti-circle-check" style={{fontSize:24,color:'var(--color-text-success)',display:'block',marginBottom:4}}/><p style={{fontSize:13,color:'var(--color-text-success)',fontWeight:500}}>Workout logged! AI will use this for better recommendations.</p></div>
    :<button onClick={save} disabled={saving||totalSets===0} style={{...T.btnP(workout.color),opacity:totalSets>0?1:0.45}}>{saving?'Saving...':'Save workout log →'}</button>}
  </div>;
}

// ══ PHOTO ANALYZER ════════════════════════════════════════════
function PhotoAnalyzer({profile,measurements}){
  const[analyzing,setAnalyzing]=useState(false);const[result,setResult]=useState('');const[history,setHistory]=useState([]);const[tab,setTab]=useState('analyze');
  const fileRef=useRef(null);const m=measurements.length?measurements:[profile.firstMeasurement].filter(Boolean);

  useEffect(()=>{db.get('photoHistory').then(h=>h&&setHistory(h));},[]);

  const analyze=async(file)=>{
    setAnalyzing(true);setResult('');
    const reader=new FileReader();
    reader.onload=async(e)=>{
      const b64=e.target.result.split(',')[1];const mt=file.type;
      const ctx=PE.fitCtx(m,profile);
      const r=await aiVision(b64,mt,`${ctx}\n\nAnalyze this fitness progress photo:\n1. Overall physique assessment\n2. Visible fat in love handles, stomach, thighs (key areas)\n3. Muscle definition visible\n4. Top 3 areas to prioritize in training\n5. Estimated body fat % range (visual estimate)\n6. Specific exercise focus recommendations\n7. Positive progress noted\n\nBe honest, encouraging, and specific.`,"Fitness coach analyzing progress photo. Be professional, accurate, and encouraging.");
      setResult(r);
      const newH=[...history,{date:new Date().toISOString(),dateLabel:new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}),analysis:r}];
      setHistory(newH);await db.set('photoHistory',newH);setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  return<div>
    <Tabs tabs={[['analyze','📸 Analyze'],['history','📋 History']]} active={tab} setActive={setTab} col={C.fit}/>
    {tab==='analyze'&&<div>
      <div style={{...T.sub,borderLeft:`3px solid ${C.fit}`,borderRadius:'0 12px 12px 0',marginBottom:12}}>
        <p style={{fontSize:13,color:'var(--color-text-primary)',lineHeight:1.5}}>🔒 <strong>Privacy:</strong> Your photo is sent directly to Claude AI for analysis and immediately discarded. Only the text analysis is saved locally — never the image.</p>
      </div>
      <div style={{...T.card,textAlign:'center',padding:'2rem'}}>
        <i className="ti ti-camera" style={{fontSize:44,color:C.fit,display:'block',marginBottom:12}}/>
        <p style={{fontSize:15,fontWeight:500,marginBottom:6}}>Body Progress Analysis</p>
        <p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:20}}>Claude will identify visible fat zones, muscle development, and give personalized training focus areas based on your photo + current measurements.</p>
        <input ref={fileRef} type="file" accept="image/*" capture="user" style={{display:'none'}} onChange={e=>e.target.files[0]&&analyze(e.target.files[0])}/>
        <button onClick={()=>fileRef.current?.click()} disabled={analyzing} style={{...T.btnP(C.fit),marginBottom:8}}>
          {analyzing?'⏳ Analyzing with Claude...':'📷 Take or upload photo'}
        </button>
        <p style={{fontSize:11,color:'var(--color-text-tertiary)'}}>Works with front/back/side photos. Better lighting = better analysis.</p>
      </div>
      {analyzing&&<div style={{...T.sub,textAlign:'center',padding:'1.5rem'}}><i className="ti ti-loader-2" style={{fontSize:32,color:C.fit,display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Claude is analyzing your photo...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>}
      {result&&<div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>AI ANALYSIS — {new Date().toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p><pre style={{fontSize:13,color:'var(--color-text-primary)',whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.7}}>{result}</pre></div>}
    </div>}
    {tab==='history'&&<div>
      {history.length===0&&<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-photo-off" style={{fontSize:32,color:'var(--color-text-tertiary)',display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>No analyses yet. Upload your first progress photo!</p></div>}
      {[...history].reverse().map((h,i)=><div key={i} style={T.card}><p style={{fontSize:11,fontWeight:500,color:C.fit,marginBottom:6}}>{h.dateLabel}</p><pre style={{fontSize:13,color:'var(--color-text-primary)',whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.65}}>{h.analysis}</pre></div>)}
    </div>}
  </div>;
}

// ══ VLSI GAMES ════════════════════════════════════════════════
function FlashcardGame({lesson,vlsiProgress,profile}){
  const[cards,setCards]=useState([]);const[idx,setIdx]=useState(0);const[flipped,setFlipped]=useState(false);const[score,setScore]=useState({know:0,skip:0});const[done,setDone]=useState(false);const[genCards,setGenCards]=useState(false);

  useEffect(()=>{if(lesson?.flashcards?.length){setCards(lesson.flashcards);return;}generateCards();},[lesson]);

  async function generateCards(){
    setGenCards(true);
    const ctx=PE.vlsiCtx(vlsiProgress,profile);
    const r=await ai(`${ctx}\nGenerate 8 flashcards for: "${lesson?.title||'VLSI concepts'}"\nReturn ONLY valid JSON: {"cards":[{"q":"question/concept","a":"answer/definition"}]}`,"Return only valid JSON.");
    try{const p=JSON.parse(r.replace(/```json|```/g,'').trim());setCards(p.cards||[]);}catch{setCards([{q:"What is boolean algebra?",a:"Mathematical system with variables that are only 0 or 1"},{q:"What are universal gates?",a:"NAND and NOR — can implement any boolean function"}]);}
    setGenCards(false);
  }

  const next=(knows)=>{
    setScore(s=>({...s,[knows?'know':'skip']:s[knows?'know':'skip']+1}));
    setFlipped(false);
    if(idx>=cards.length-1){setDone(true);}else{setIdx(i=>i+1);}
  };

  const restart=()=>{setIdx(0);setFlipped(false);setScore({know:0,skip:0});setDone(false);};

  if(genCards)return<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-loader-2" style={{fontSize:32,color:C.vlsi,display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Generating flashcards...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>;

  if(done)return<div style={{...T.card,textAlign:'center',padding:'2rem'}}><Ring score={score.know} total={score.know+score.skip}/><p style={{fontSize:16,fontWeight:500,marginTop:12,marginBottom:4}}>{score.know}/{cards.length} cards known</p><p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:16}}>{score.know===cards.length?'Perfect! All cards mastered.':score.know>=cards.length*0.7?'Great recall! Review the ones you skipped.':'Keep practicing — repetition builds memory.'}</p><button onClick={restart} style={T.btnS}>Restart deck</button></div>;

  if(!cards.length)return null;
  const card=cards[idx]||cards[0];

  return<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <p style={{fontSize:12,color:'var(--color-text-secondary)'}}>{idx+1} of {cards.length}</p>
      <div style={{display:'flex',gap:8}}>
        <span style={{fontSize:12,color:'#1D9E75'}}>✓ {score.know}</span>
        <span style={{fontSize:12,color:'var(--color-text-tertiary)'}}>✕ {score.skip}</span>
      </div>
    </div>
    <div onClick={()=>setFlipped(f=>!f)} style={{...T.card,minHeight:160,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'1.5rem',borderTop:`4px solid ${C.vlsi}`,transition:'all .2s'}}>
      <p style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.05em'}}>{flipped?'Answer':'Question — tap to flip'}</p>
      <p style={{fontSize:16,fontWeight:flipped?400:500,color:'var(--color-text-primary)',lineHeight:1.5}}>{flipped?card.a:card.q}</p>
      {!flipped&&<p style={{fontSize:11,color:'var(--color-text-tertiary)',marginTop:12}}>Tap card to see answer</p>}
    </div>
    {flipped&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
      <button onClick={()=>next(false)} style={{padding:'12px',border:'0.5px solid var(--color-border-danger)',borderRadius:'var(--border-radius-md)',background:'var(--color-background-danger)',color:'var(--color-text-danger)',fontSize:14,cursor:'pointer',fontWeight:500}}>✕ Still learning</button>
      <button onClick={()=>next(true)} style={{padding:'12px',border:'none',borderRadius:'var(--border-radius-md)',background:'#1D9E75',color:'#fff',fontSize:14,cursor:'pointer',fontWeight:500}}>✓ I know this</button>
    </div>}
  </div>;
}

function QuickQuiz({vlsiProgress,profile}){
  const[questions,setQuestions]=useState([]);const[current,setCurrent]=useState(0);const[chosen,setChosen]=useState(null);const[score,setScore]=useState(0);const[done,setDone]=useState(false);const[generating,setGenerating]=useState(false);const[timeLeft,setTimeLeft]=useState(15);
  const timerRef=useRef(null);

  async function start(){
    setGenerating(true);setScore(0);setCurrent(0);setChosen(null);setDone(false);
    const ctx=PE.vlsiCtx(vlsiProgress,profile);
    const r=await ai(`${ctx}\nGenerate 8 fast VLSI MCQs for ${PE.vlsiLevel(vlsiProgress?.testScores).level} level.\nReturn ONLY valid JSON: {"questions":[{"q":"short question","options":["A","B","C","D"],"correct":0}]}`,"Return only valid JSON.");
    try{const p=JSON.parse(r.replace(/```json|```/g,'').trim());setQuestions(p.questions||[]);}catch{setQuestions([]);}
    setGenerating(false);setTimeLeft(15);
  }

  useEffect(()=>{
    if(questions.length>0&&!done&&chosen===null){
      timerRef.current=setInterval(()=>setTimeLeft(t=>{if(t<=1){clearInterval(timerRef.current);handleAnswer(-1);return 15;}return t-1;}),1000);
    }
    return()=>clearInterval(timerRef.current);
  },[current,questions,done,chosen]);

  const handleAnswer=(oi)=>{
    clearInterval(timerRef.current);setChosen(oi);
    if(oi===questions[current]?.correct)setScore(s=>s+1);
    setTimeout(()=>{
      if(current>=questions.length-1){setDone(true);}
      else{setCurrent(c=>c+1);setChosen(null);setTimeLeft(15);}
    },1200);
  };

  if(!questions.length&&!generating)return<div style={{...T.card,textAlign:'center',padding:'2rem'}}><i className="ti ti-bolt" style={{fontSize:44,color:C.vlsi,display:'block',marginBottom:12}}/><p style={{fontSize:15,fontWeight:500,marginBottom:6}}>Quick Quiz — 15s per question</p><p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:20}}>8 rapid-fire questions. 15 seconds each. Tests your instant recall.</p><button onClick={start} style={T.btnP(C.vlsi)}>Start quick quiz →</button></div>;

  if(generating)return<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-loader-2" style={{fontSize:32,color:C.vlsi,display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Generating adaptive questions...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>;

  if(done)return<div style={{...T.card,textAlign:'center',padding:'2rem'}}><Ring score={score} total={questions.length} size={80}/><p style={{fontSize:15,fontWeight:500,marginTop:12,marginBottom:16}}>{score>=7?'🎉 Lightning fast!':score>=5?'⚡ Good speed!':'⏱ Keep practicing for faster recall'}</p><button onClick={start} style={T.btnP(C.vlsi)}>Play again</button></div>;

  const q=questions[current];
  const timePct=timeLeft/15*100;
  const timerCol=timeLeft>8?'#1D9E75':timeLeft>4?'#BA7517':'#E24B4A';

  return<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
      <p style={{fontSize:12,color:'var(--color-text-secondary)'}}>Q{current+1}/{questions.length}</p>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:100,height:6,borderRadius:3,background:'var(--color-border-tertiary)',overflow:'hidden'}}><div style={{width:`${timePct}%`,height:'100%',background:timerCol,transition:'width .5s linear'}}/></div>
        <p style={{fontSize:13,fontWeight:600,color:timerCol,minWidth:20}}>{timeLeft}s</p>
      </div>
    </div>
    <div style={{...T.card,padding:'1.25rem'}}><p style={{fontSize:15,fontWeight:500,lineHeight:1.4,marginBottom:12}}>{q?.q}</p>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {q?.options?.map((opt,oi)=>{
          let bg='var(--color-background-primary)',bdr='0.5px solid var(--color-border-tertiary)';
          if(chosen!==null){if(oi===q.correct){bg='var(--color-background-success)';bdr='0.5px solid var(--color-border-success)';}else if(oi===chosen&&oi!==q.correct){bg='var(--color-background-danger)';bdr='0.5px solid var(--color-border-danger)';}}
          return<div key={oi} onClick={()=>chosen===null&&handleAnswer(oi)} style={{padding:'10px 12px',borderRadius:'var(--border-radius-md)',border:bdr,background:bg,cursor:chosen===null?'pointer':'default',fontSize:13,transition:'all .15s'}}>{['A','B','C','D'][oi]}. {opt}</div>;
        })}
      </div>
    </div>
    <p style={{fontSize:11,color:'var(--color-text-tertiary)',textAlign:'center'}}>Score: {score}/{current}</p>
  </div>;
}

// ══ WEEKEND PROJECT ══════════════════════════════════════════
function WeekendProject({profile,vlsiProgress}){
  const[project,setProject]=useState(null);const[generating,setGenerating]=useState(false);const[submission,setSubmission]=useState('');const[feedback,setFeedback]=useState('');const[submitting,setSubmitting]=useState(false);const[history,setHistory]=useState([]);

  useEffect(()=>{db.get('weeklyProjects').then(p=>p&&setHistory(p));},[]);

  async function generate(){
    setGenerating(true);setProject(null);setSubmission('');setFeedback('');
    const ctx=PE.vlsiCtx(vlsiProgress,profile);
    const done=vlsiProgress?.completedDays||[];
    const thisWeek=done.slice(-5).join(', ')||'basics';
    const r=await ai(`${ctx}\n\nCreate a weekend VLSI project.\nThis week's topics: ${thisWeek}\nAll previous topics: ${done.slice(0,-5).join(', ')||'none yet'}\n\nProject requirements:\n1. Primary focus: this week's topics\n2. Must integrate earlier topics (cumulative review)\n3. 2-4 hours to complete\n4. Clear deliverable (Verilog code, truth table, circuit design, etc.)\n\nReturn ONLY valid JSON:\n{"title":"...","goal":"one sentence goal","tasks":["step 1","step 2","step 3","step 4"],"expectedOutput":"what to submit","integrationNote":"how this connects to previous learning","hints":["hint1","hint2","hint3"]}`,"VLSI expert. Return only valid JSON.");
    try{const p=JSON.parse(r.replace(/```json|```/g,'').trim());setProject(p);}
    catch{setProject({title:"Design a 4-bit ALU",goal:"Combine boolean algebra, gates, and HDL concepts",tasks:["Write truth tables for ADD, SUB, AND, OR operations","Derive boolean expressions for each","Implement in Verilog with testbench","Simulate and verify results"],expectedOutput:"Working Verilog code with simulation screenshots",integrationNote:"Applies all Phase 0 topics + introduces Phase 1",hints:["Start with the 1-bit case first","Use case statement for operation select","Test with corner cases: 0+0, max+max"]});}
    setGenerating(false);
  }

  async function submitProject(){
    if(!submission.trim())return;setSubmitting(true);
    const ctx=PE.vlsiCtx(vlsiProgress,profile);
    const r=await ai(`${ctx}\n\nProject: "${project?.title}"\nExpected: ${project?.expectedOutput}\n\nSubmission:\n${submission}\n\nEvaluate: (1) Score /10 (2) Strengths (3) Areas to improve (4) What they learned (5) Preview of next project topic`,"VLSI professor. Give thorough, encouraging project feedback.");
    setFeedback(r);
    const entry={date:new Date().toISOString(),week:vlsiProgress?.completedDays?.length||0,project:project?.title,submission,feedback:r};
    const newH=[...history,entry];setHistory(newH);await db.set('weeklyProjects',newH);setSubmitting(false);
  }

  return<div>
    {!project&&!generating&&<div style={{...T.card,textAlign:'center',padding:'2rem'}}>
      <i className="ti ti-code" style={{fontSize:44,color:C.vlsi,display:'block',marginBottom:12}}/>
      <p style={{fontSize:15,fontWeight:500,marginBottom:6}}>Weekend Project</p>
      <p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:4}}>A 2–4 hour mini-project combining this week's topics + cumulative review.</p>
      <p style={{fontSize:12,color:'var(--color-text-tertiary)',marginBottom:20}}>Submit your work → AI evaluates and gives detailed feedback.</p>
      {history.length>0&&<p style={{fontSize:12,color:C.vlsi,marginBottom:12}}>{history.length} project{history.length>1?'s':''} completed so far 🎉</p>}
      <button onClick={generate} style={T.btnP(C.vlsi)}>Generate this week's project →</button>
    </div>}
    {generating&&<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-loader-2" style={{fontSize:32,color:C.vlsi,display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Generating cumulative project...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>}
    {project&&<div>
      <div style={{...T.card,borderTop:`4px solid ${C.vlsi}`}}>
        <div style={{marginBottom:8}}><Pill col={C.vlsi}>Weekend Project</Pill></div>
        <p style={{fontSize:18,fontWeight:500,color:'var(--color-text-primary)',marginBottom:4}}>{project.title}</p>
        <p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:12}}>{project.goal}</p>
        <div style={{...T.sub,marginBottom:0}}><p style={{fontSize:12,color:C.vlsi,marginBottom:4}}>🔗 {project.integrationNote}</p></div>
      </div>
      <div style={T.card}>
        <p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>TASKS</p>
        {project.tasks?.map((task,i)=><div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'7px 0',borderBottom:i<project.tasks.length-1?'0.5px solid var(--color-border-tertiary)':'none'}}>
          <div style={{width:22,height:22,borderRadius:'50%',background:`${C.vlsi}18`,color:C.vlsi,fontSize:11,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
          <p style={{fontSize:13,color:'var(--color-text-primary)',lineHeight:1.4}}>{task}</p>
        </div>)}
      </div>
      <div style={T.card}>
        <p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>💡 HINTS (read only if stuck)</p>
        {project.hints?.map((h,i)=><p key={i} style={{fontSize:13,color:'var(--color-text-secondary)',lineHeight:1.5,padding:'4px 0'}}>Hint {i+1}: {h}</p>)}
      </div>
      <div style={T.card}>
        <p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:4}}>SUBMIT YOUR WORK</p>
        <p style={{fontSize:12,color:'var(--color-text-tertiary)',marginBottom:8}}>Expected: {project.expectedOutput}</p>
        <textarea value={submission} onChange={e=>setSubmission(e.target.value)} rows={6} style={T.ta} placeholder="Paste your Verilog code, write your answers, or describe your solution..."/>
        <button onClick={submitProject} disabled={submitting||!submission.trim()} style={{...T.btnP(C.vlsi),marginTop:10,opacity:submitting||!submission.trim()?0.5:1}}>{submitting?'⏳ AI is evaluating...':'Submit for feedback →'}</button>
      </div>
      {feedback&&<div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>AI FEEDBACK</p><pre style={{fontSize:13,color:'var(--color-text-primary)',whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.7}}>{feedback}</pre></div>}
      <button onClick={()=>setProject(null)} style={{...T.btnS,width:'100%',marginTop:4}}>Generate new project</button>
    </div>}
  </div>;
}

// ══ HOME ══════════════════════════════════════════════════════
function Home({profile,measurements,vlsiProgress,workoutLogs,setScreen,onExtraSession}){
  const m=measurements.length?measurements:[profile.firstMeasurement].filter(Boolean);
  const trend=PE.weightTrend(m);const sub=PE.stubbornAreas(m);
  const vLv=PE.vlsiLevel(vlsiProgress?.testScores);const last=m[m.length-1]||profile.firstMeasurement;
  const diet=PE.diet(last?.weight||90,profile.fitPhase||0,trend);
  const adapts=PE.adaptations(m,profile.fitPhase||0);
  const vp=VLSI_PHASES[profile.vlsiPhase];const fp=FIT_PHASES[profile.fitPhase||0];
  const dow=getDOW();const isGym=fp.gymDays.includes(dow);
  const done=vlsiProgress?.completedDays?.length||0;
  const wt=last?.weight||90;
  const wDiff=measurements.length>=2?(measurements[0].weight-measurements[measurements.length-1].weight).toFixed(1):null;
  const todayLogged=workoutLogs?.some(l=>l.date===todayKey());
  const trendCols={gaining:'#E24B4A',plateau:'#BA7517',losing:'#1D9E75',losing_fast:'#BA7517',insufficient:'#888'};

  return<div style={{padding:'1.25rem'}}>
    <p style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
    <h1 style={{fontSize:21,fontWeight:500,marginBottom:'1.25rem'}}>Hey {profile.name.split(' ')[0]} 👋</h1>

    {/* 4-stat strip */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
      {[{icon:'ti-book-2',val:done,sub:'lessons',col:vp.color},{icon:'ti-weight',val:`${wt}kg`,sub:wDiff?`−${wDiff}kg`:'start',col:trendCols[trend]},{icon:'ti-trophy',val:`${vLv.avgPct}%`,sub:'VLSI avg',col:vLv.avgPct>=80?'#1D9E75':vLv.avgPct>=60?C.vlsi:'#E24B4A'},{icon:'ti-flame',val:isGym?'Gym':'Rest',sub:dow,col:isGym?fp.color:'#888'}].map((c,i)=>(
        <div key={i} style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:'10px 6px',textAlign:'center'}}>
          <i className={`ti ${c.icon}`} style={{fontSize:17,color:c.col,display:'block',marginBottom:3}}/>
          <p style={{fontSize:13,fontWeight:500,color:'var(--color-text-primary)',lineHeight:1}}>{c.val}</p>
          <p style={{fontSize:9,color:'var(--color-text-tertiary)',marginTop:2}}>{c.sub}</p>
        </div>
      ))}
    </div>

    {/* Phase progress bars */}
    <div style={T.card}>
      <PhaseBar phases={VLSI_PHASES} current={profile.vlsiPhase} currentDay={profile.vlsiDay}/>
      <PhaseBar phases={FIT_PHASES} current={profile.fitPhase||0} currentDay={Math.max(1,Math.round((new Date()-new Date(profile.startDate))/(7*864e5)))}/>
    </div>

    {/* AI Adaptations */}
    {adapts.length>0&&<div style={{...T.card,borderLeft:`3px solid ${adapts[0].col}`,borderRadius:'0 12px 12px 0'}}>
      <p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>🤖 AI ADJUSTMENTS TODAY</p>
      {adapts.map((a,i)=><div key={i} style={{display:'flex',gap:8,padding:i>0?'5px 0 0':0}}><span style={{flexShrink:0}}>{a.icon}</span><p style={{fontSize:13,color:'var(--color-text-primary)',lineHeight:1.4}}>{a.text}</p></div>)}
    </div>}

    {/* Today's action cards */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
      <div style={{...T.card,margin:0,cursor:'pointer',borderTop:`3px solid ${vp.color}`,minHeight:90}} onClick={()=>setScreen('study')}>
        <i className="ti ti-book-2" style={{fontSize:18,color:vp.color,display:'block',marginBottom:4}}/>
        <p style={{fontSize:13,fontWeight:500,lineHeight:1.3,marginBottom:2}}>Study</p>
        <p style={{fontSize:11,color:'var(--color-text-secondary)',lineHeight:1.3}}>{SEED[`${profile.vlsiPhase}-${profile.vlsiDay}`]?.title||`Day ${profile.vlsiDay}`}</p>
      </div>
      <div style={{...T.card,margin:0,cursor:'pointer',borderTop:`3px solid ${isGym?fp.color:'#888'}`,minHeight:90}} onClick={()=>setScreen('train')}>
        <i className={`ti ${isGym?'ti-barbell':'ti-walk'}`} style={{fontSize:18,color:isGym?fp.color:'#888',display:'block',marginBottom:4}}/>
        <p style={{fontSize:13,fontWeight:500,lineHeight:1.3,marginBottom:2}}>{isGym?'Gym day':'Rest day'}</p>
        <p style={{fontSize:11,color:'var(--color-text-secondary)',lineHeight:1.3}}>{todayLogged?'✓ Logged':isGym?'70 min + HIIT':'30 min walk'}</p>
      </div>
    </div>

    {/* Extra session on rest day */}
    {!isGym&&<div style={{...T.card,border:'0.5px dashed var(--color-border-secondary)'}}>
      <p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>💪 WANT TO TRAIN ANYWAY?</p>
      <p style={{fontSize:13,color:'var(--color-text-primary)',lineHeight:1.5,marginBottom:8}}>Rest days are important, but if you feel good — an extra session shows the AI your dedication level and improves recommendations.</p>
      <button onClick={onExtraSession} style={{...T.btnS,width:'100%',textAlign:'center'}}>Log extra workout or study session</button>
    </div>}

    {/* Diet strip */}
    <div style={T.sub}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <p style={{fontSize:12,fontWeight:500,color:'var(--color-text-secondary)'}}>TODAY'S TARGETS</p>
        <p style={{fontSize:14,fontWeight:500,color:'var(--color-text-primary)'}}>{diet.kcal} kcal</p>
      </div>
      <MacroBar protein={diet.protein} carbs={diet.carbs} fat={diet.fat}/>
    </div>
  </div>;
}

// ══ STUDY ════════════════════════════════════════════════════
function Study({profile,setProfile,vlsiProgress,setVlsiProgress}){
  const[tab,setTab]=useState('overview');const[lesson,setLesson]=useState(null);const[genL,setGenL]=useState(false);
  const[ans,setAns]=useState('');const[review,setReview]=useState('');const[reviewing,setReviewing]=useState(false);
  const[testQ,setTestQ]=useState(null);const[testA,setTestA]=useState([]);const[testDone,setTestDone]=useState(false);const[genTest,setGenTest]=useState(false);
  const vp=VLSI_PHASES[profile.vlsiPhase];const lkey=`${profile.vlsiPhase}-${profile.vlsiDay}`;const vLv=PE.vlsiLevel(vlsiProgress?.testScores);const done=vlsiProgress?.completedDays?.includes(lkey);

  useEffect(()=>{setLesson(null);setReview('');setAns('');if(SEED[lkey]){setLesson(SEED[lkey]);return;}(async()=>{const c=await db.get(`lesson:${lkey}`);if(c){setLesson(c);return;}setGenL(true);const ctx=PE.vlsiCtx(vlsiProgress,profile);const r=await ai(`${ctx}\nGenerate VLSI lesson. Phase: "${vp.name}", Day ${profile.vlsiDay}/${vp.days}.\nReturn ONLY valid JSON:\n{"title":"...","notes":"700-word markdown","videoId":"youtube id","videoTitle":"...","exercise":"worked example","assignment":"2-3 problems","resources":[{"title":"...","url":"..."}],"flashcards":[{"q":"concept","a":"definition"}]}`,"VLSI expert. Adapt to student profile. Return only valid JSON.");try{const p=JSON.parse(r.replace(/```json|```/g,'').trim());p.day=profile.vlsiDay;p.phase=profile.vlsiPhase;await db.set(`lesson:${lkey}`,p);setLesson(p);}catch{setLesson({title:`Day ${profile.vlsiDay}`,notes:r,exercise:'',assignment:'Summarize key concepts.',resources:[],flashcards:[],day:profile.vlsiDay,phase:profile.vlsiPhase});}setGenL(false);})();},[lkey]);

  async function submitAns(){if(!ans.trim())return;setReviewing(true);setReview('');const ctx=PE.vlsiCtx(vlsiProgress,profile);const r=await ai(`${ctx}\n\nAssignment: "${lesson?.assignment}"\n\nStudent answer:\n${ans}\n\nGive: (1) Score /10 (2) Correct parts (3) Errors with fixes (4) Topic advice for ${vLv.level} level (5) Encouragement`,"VLSI professor. Accurate, helpful, encouraging.");setReview(r);setReviewing(false);const upd={...vlsiProgress,completedDays:[...(vlsiProgress.completedDays||[]).filter(d=>d!==lkey),lkey]};setVlsiProgress(upd);await db.set('vlsiProgress',upd);}

  async function advance(){let nd=profile.vlsiDay+1,np=profile.vlsiPhase;if(nd>vp.days){nd=1;np=Math.min(np+1,VLSI_PHASES.length-1);}const upd={...profile,vlsiDay:nd,vlsiPhase:np};setProfile(upd);await db.set('profile',upd);setTab('overview');}

  async function startTest(){setGenTest(true);setTestQ(null);setTestA([]);setTestDone(false);const ctx=PE.vlsiCtx(vlsiProgress,profile);const allDone=vlsiProgress?.completedDays||[];const r=await ai(`${ctx}\n\nGenerate 5 CUMULATIVE MCQs for VLSI. Include:\n- 2 questions from THIS week's topics (recent days)\n- 2 questions from ALL previous topics (revision)\n- 1 challenge question mixing multiple topics\nLevel: ${vLv.level} (${vLv.avgPct}%).\nReturn ONLY valid JSON: {"questions":[{"q":"...","options":["A","B","C","D"],"correct":0,"explanation":"...","topic":"...","isRevision":false}]}`,"Return only valid JSON.");try{const p=JSON.parse(r.replace(/```json|```/g,'').trim());setTestQ(p.questions);setTestA(new Array(p.questions.length).fill(null));}catch{setTestQ([]);}setGenTest(false);}

  async function submitTest(){if(!testQ)return;const score=testQ.reduce((a,q,i)=>a+(testA[i]===q.correct?1:0),0);const wrongTopics=testQ.filter((q,i)=>testA[i]!==q.correct).map(q=>q.topic||'unknown');setTestDone(true);const upd={...vlsiProgress,testScores:[...(vlsiProgress.testScores||[]),{date:new Date().toISOString(),score,total:testQ.length,phase:profile.vlsiPhase,phaseName:vp.name,wrongTopics}]};setVlsiProgress(upd);await db.set('vlsiProgress',upd);}

  if(genL)return<div style={{padding:'2rem',textAlign:'center'}}><i className="ti ti-loader-2" style={{fontSize:40,color:vp.color,display:'block',marginBottom:12}}/><p style={{fontSize:14,color:'var(--color-text-secondary)'}}>Generating {vLv.level}-level lesson...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>;

  return<div style={{padding:'1.25rem'}}>
    <PhaseBar phases={VLSI_PHASES} current={profile.vlsiPhase} currentDay={profile.vlsiDay}/>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}><Pill col={vp.color}>{vp.name}</Pill><Pill col={vLv.avgPct>=80?'#1D9E75':vLv.avgPct>=60?C.vlsi:'#E24B4A'}>{vLv.level} · {vLv.avgPct}%</Pill>{done&&<Pill col='#1D9E75'>✓ Complete</Pill>}</div>
    <h2 style={{fontSize:17,fontWeight:500,marginBottom:12}}>{lesson?.title||'...'}</h2>
    {vLv.avgPct<50&&<div style={{...T.sub,borderLeft:'3px solid #E24B4A',borderRadius:'0 12px 12px 0',marginBottom:10}}><p style={{fontSize:13,lineHeight:1.5}}>📚 <strong>Review mode</strong> — extra examples and analogies added for you.</p></div>}
    {vLv.avgPct>=80&&<div style={{...T.sub,borderLeft:'3px solid #1D9E75',borderRadius:'0 12px 12px 0',marginBottom:10}}><p style={{fontSize:13,lineHeight:1.5}}>⭐ <strong>Challenge mode</strong> — industry depth and edge cases included.</p></div>}
    <Tabs tabs={[['overview','Overview'],['notes','📄 Notes'],['video','▶ Video'],['assignment','✏️ Task'],['test','📝 Test'],['games','🎮 Games'],['project','🏗 Project'],['roadmap','🗺 Map']]} active={tab} setActive={(t)=>{setTab(t);if(t==='test'&&!testQ&&!genTest)startTest();}} col={vp.color}/>

    {tab==='overview'&&lesson&&<div>
      <div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:10}}>TODAY'S PLAN</p>
        {[{i:'ti-book',l:'Read the notes',s:'~30 min'},{i:'ti-video',l:'Watch the video',s:'~20–40 min'},{i:'ti-pencil',l:'Work through the exercise',s:'~10 min'},{i:'ti-clipboard',l:'Complete the assignment',s:'~40 min'},{i:'ti-send',l:'Submit for AI grading',s:'instant'},{i:'ti-cards',l:'Play flashcard game',s:'~10 min'},{i:'ti-bolt',l:'Quick Quiz (15s/question)',s:'~5 min'}].map((x,i,arr)=>(
          <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'7px 0',borderBottom:i<arr.length-1?'0.5px solid var(--color-border-tertiary)':'none'}}>
            <div style={{width:30,height:30,borderRadius:8,background:`${vp.color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><i className={`ti ${x.i}`} style={{fontSize:14,color:vp.color}}/></div>
            <div><p style={{fontSize:13,fontWeight:500}}>{x.l}</p><p style={{fontSize:11,color:'var(--color-text-tertiary)'}}>{x.s}</p></div>
          </div>
        ))}
      </div>
      {(lesson.resources||[]).length>0&&<div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>FREE RESOURCES</p>{(lesson.resources||[]).map((r,i)=><div key={i} onClick={()=>openLink(r.url)} style={{display:'flex',gap:8,alignItems:'center',padding:'7px 0',borderBottom:i<lesson.resources.length-1?'0.5px solid var(--color-border-tertiary)':'none',cursor:'pointer'}}><i className="ti ti-external-link" style={{fontSize:13,color:'var(--color-text-info)'}}/><p style={{fontSize:13,color:'var(--color-text-info)'}}>{r.title}</p></div>)}</div>}
      {!done&&<button onClick={advance} style={T.btnP(vp.color)}>Mark complete & advance →</button>}
    </div>}
    {tab==='notes'&&<div style={T.card}><MdText text={lesson?.notes}/></div>}
    {tab==='video'&&<div>{lesson?.videoId?<div style={{borderRadius:'var(--border-radius-lg)',overflow:'hidden',aspectRatio:'16/9',marginBottom:10}}><iframe src={`https://www.youtube.com/embed/${lesson.videoId}`} style={{width:'100%',height:'100%',border:'none'}} allowFullScreen title={lesson.videoTitle||''}/></div>:<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-video-off" style={{fontSize:32,color:'var(--color-text-tertiary)',display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>No embedded video — check resources.</p></div>}<div style={T.sub}><p style={{fontSize:13,lineHeight:1.6}}>📌 Pause frequently. Try each example before the solution. Notes in your own words.</p></div></div>}
    {tab==='assignment'&&lesson&&<div><div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>WORKED EXAMPLE</p><MdText text={lesson.exercise}/></div><div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>ASSIGNMENT</p><pre style={{fontSize:13,whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.7,marginBottom:12}}>{lesson.assignment}</pre><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>YOUR SOLUTION</p><textarea value={ans} onChange={e=>setAns(e.target.value)} rows={7} style={T.ta} placeholder="Show all working. AI grades on your reasoning."/><button onClick={submitAns} disabled={reviewing||!ans.trim()} style={{...T.btnP(vp.color),marginTop:10,opacity:reviewing||!ans.trim()?0.5:1}}>{reviewing?'⏳ Claude is reviewing...':'✓ Submit for AI grading'}</button></div>{review&&<div style={T.sub}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>AI PROFESSOR FEEDBACK</p><pre style={{fontSize:13,whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.7}}>{review}</pre></div>}</div>}
    {tab==='test'&&<div>
      {genTest&&<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-loader-2" style={{fontSize:32,color:vp.color,display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Generating cumulative test (this week + revision)...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}.ti-loader-2{animation:spin 1s linear infinite}`}</style></div>}
      {!testQ&&!genTest&&<div style={{...T.card,textAlign:'center',padding:'2rem'}}><i className="ti ti-clipboard-check" style={{fontSize:44,color:vp.color,display:'block',marginBottom:12}}/><p style={{fontSize:15,fontWeight:500,marginBottom:6}}>Cumulative Weekly Test</p><p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:4}}>This week's topics + revision from all previous weeks.</p><p style={{fontSize:12,color:'var(--color-text-tertiary)',marginBottom:20}}>Wrong answers recorded → future lessons adapt.</p><button onClick={startTest} style={T.btnP(vp.color)}>Start test →</button></div>}
      {testQ&&testQ.length>0&&<div>
        <div style={{...T.sub,marginBottom:12,display:'flex',gap:8,flexWrap:'wrap'}}>
          <Pill col={vp.color}>Cumulative test</Pill>
          <Pill col='#888'>{testQ.filter(q=>q.isRevision).length} revision + {testQ.filter(q=>!q.isRevision).length} new</Pill>
          {testDone&&<Pill col={testQ.reduce((a,q,i)=>a+(testA[i]===q.correct?1:0),0)>=4?'#1D9E75':'#E24B4A'}>{testQ.reduce((a,q,i)=>a+(testA[i]===q.correct?1:0),0)}/{testQ.length} score</Pill>}
        </div>
        {testQ.map((q,qi)=>(
          <div key={qi} style={{...T.card,marginBottom:10}}>
            <div style={{display:'flex',gap:6,marginBottom:8}}><Pill col={q.isRevision?'#888':vp.color}>{q.isRevision?'🔁 Revision':'🆕 This week'}</Pill></div>
            <p style={{fontSize:14,fontWeight:500,lineHeight:1.4,marginBottom:10}}>Q{qi+1}. {q.q}</p>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {q.options?.map((opt,oi)=>{let bg='var(--color-background-primary)',bdr='0.5px solid var(--color-border-tertiary)';if(testDone){if(oi===q.correct){bg='var(--color-background-success)';bdr='0.5px solid var(--color-border-success)';}else if(oi===testA[qi]&&oi!==q.correct){bg='var(--color-background-danger)';bdr='0.5px solid var(--color-border-danger)';}}else if(testA[qi]===oi){bdr=`2px solid ${vp.color}`;}return<div key={oi} onClick={()=>{if(testDone)return;setTestA(a=>{const n=[...a];n[qi]=oi;return n;});}} style={{padding:'10px 12px',borderRadius:'var(--border-radius-md)',border:bdr,background:bg,cursor:testDone?'default':'pointer',fontSize:13,transition:'all .15s'}}>{['A','B','C','D'][oi]}. {opt}</div>;})}
            </div>
            {testDone&&<p style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:8}}>💡 {q.explanation}</p>}
          </div>
        ))}
        {!testDone?<button onClick={submitTest} disabled={testA.includes(null)} style={{...T.btnP(vp.color),opacity:testA.includes(null)?0.5:1}}>Submit</button>
        :<div style={{...T.sub,textAlign:'center'}}><div style={{display:'flex',justifyContent:'center',marginBottom:12}}><Ring score={testQ.reduce((a,q,i)=>a+(testA[i]===q.correct?1:0),0)} total={testQ.length} size={80}/></div><p style={{fontSize:14,fontWeight:500,marginBottom:12}}>{testQ.reduce((a,q,i)=>a+(testA[i]===q.correct?1:0),0)>=4?'Great work! Lessons advancing.':'Wrong topics noted — lessons will emphasize them.'}</p><button onClick={()=>{setTestQ(null);setTestA([]);setTestDone(false);}} style={T.btnS}>New test</button></div>}
      </div>}
    </div>}
    {tab==='games'&&<div>
      <p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:12}}>CHOOSE A GAME</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
        {[{icon:'ti-cards',title:'Flashcards',desc:'Flip to reveal',sub:'Tap card to flip',col:'#7F77DD'},{icon:'ti-bolt',title:'Quick Quiz',desc:'15s per question',sub:'Beat the clock',col:'#BA7517'}].map((g,i)=>(
          <div key={i} style={{...T.card,textAlign:'center',padding:'1.25rem',cursor:'pointer',borderTop:`3px solid ${g.col}`}}>
            <i className={`ti ${g.icon}`} style={{fontSize:28,color:g.col,display:'block',marginBottom:6}}/>
            <p style={{fontSize:13,fontWeight:500,marginBottom:2}}>{g.title}</p>
            <p style={{fontSize:11,color:'var(--color-text-secondary)'}}>{g.desc}</p>
          </div>
        ))}
      </div>
      <div style={{marginBottom:16}}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>🃏 FLASHCARDS</p><FlashcardGame lesson={lesson} vlsiProgress={vlsiProgress} profile={profile}/></div>
      <div><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>⚡ QUICK QUIZ</p><QuickQuiz vlsiProgress={vlsiProgress} profile={profile}/></div>
    </div>}
    {tab==='project'&&<WeekendProject profile={profile} vlsiProgress={vlsiProgress}/>}
    {tab==='roadmap'&&<div>{VLSI_PHASES.map((ph,i)=><div key={i} style={{...T.card,display:'flex',gap:10,alignItems:'center',opacity:i<profile.vlsiPhase?0.45:1}}><div style={{width:34,height:34,borderRadius:'50%',background:i<profile.vlsiPhase?'#1D9E751a':i===profile.vlsiPhase?`${ph.color}22`:'var(--color-background-secondary)',border:`1.5px solid ${i<=profile.vlsiPhase?ph.color:'var(--color-border-tertiary)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i<profile.vlsiPhase?<i className="ti ti-check" style={{fontSize:14,color:'#1D9E75'}}/>:<span style={{fontSize:11,fontWeight:600,color:i===profile.vlsiPhase?ph.color:'var(--color-text-tertiary)'}}>{i+1}</span>}</div><div style={{flex:1}}><p style={{fontSize:13,fontWeight:500}}>{ph.name}</p><p style={{fontSize:11,color:'var(--color-text-secondary)'}}>{ph.weeks}w · {ph.days}d</p></div>{i===profile.vlsiPhase&&<Pill col={ph.color}>Now</Pill>}</div>)}</div>}
  </div>;
}

// ══ TRAIN ═════════════════════════════════════════════════════
function Train({profile,measurements,workoutLogs,setWorkoutLogs}){
  const[tab,setTab]=useState('today');const[aiTip,setAiTip]=useState('');const[loading,setLoading]=useState(false);const[logged,setLogged]=useState(false);
  const m=measurements.length?measurements:[profile.firstMeasurement].filter(Boolean);
  const fp=FIT_PHASES[profile.fitPhase||0];const dow=getDOW();const isGym=fp.gymDays.includes(dow);
  const gymIdx=fp.gymDays.indexOf(dow);const wKey=!isGym?'REST':gymIdx%2===0?'A':'B';const workout=WORKOUTS[wKey];
  const adapts=PE.adaptations(m,profile.fitPhase||0);const last=m[m.length-1]||profile.firstMeasurement||{weight:90};const diet=PE.diet(last.weight||90,profile.fitPhase||0,PE.weightTrend(m));
  const MUSIC_PLAYLISTS=[{label:'Workout Pump',id:'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG'},{label:'Hip Hop Workout',id:'PLDIoUOhQQPlXr63I_vwF06Dq35oa9YnkI'},{label:'Lo-Fi Study',id:'PLOzDu-MXXLliO9gyCms7d_pi25M25Rvhz'},{label:'Focus Music',id:'PLcMnBYL2BT0vbgw2dG9o2tK_XQWlJSWep'}];
  const[musicIdx,setMusicIdx]=useState(isGym?0:2);

  async function getAiTip(){setLoading(true);const ctx=PE.fitCtx(m,profile);const r=await ai(`${ctx}\nToday: ${dow}, workout: ${workout.name}.\nGive 3 personalized tips for today targeting stubborn fat. Include one diet tip. Under 180 words.`,"Personal trainer. Concise, personalized.");setAiTip(r);setLoading(false);}

  const handleLogSave=async(entry)=>{const updated=[...(workoutLogs||[]),entry];setWorkoutLogs(updated);await db.set('workoutLogs',updated);};

  return<div style={{padding:'1.25rem'}}>
    <div style={{...T.card,borderTop:`4px solid ${workout.color||'#888'}`,marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div><div style={{display:'flex',gap:6,marginBottom:4}}><Pill col={fp.color}>{fp.name}</Pill><Pill col={workout.color||'#888'}>{workout.tag}</Pill></div><p style={{fontSize:17,fontWeight:500}}>{workout.name}</p><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>{workout.duration}</p></div>
        <i className={`ti ${isGym?'ti-barbell':'ti-walk'}`} style={{fontSize:28,color:workout.color||'#888',opacity:.4}}/>
      </div>
    </div>
    <Tabs tabs={[['today','Today'],['log','📊 Log Sets'],['diet','🥗 Diet'],['music','🎵 Music'],['schedule','📅 Plan']]} active={tab} setActive={setTab} col={workout.color||'#888'}/>

    {tab==='today'&&<div>
      {adapts.length>0&&<div style={{...T.sub,borderLeft:`3px solid ${adapts[0].col}`,borderRadius:'0 12px 12px 0',marginBottom:10}}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>🤖 AI ADJUSTMENTS</p>{adapts.map((a,i)=><div key={i} style={{display:'flex',gap:8,padding:i>0?'5px 0 0':0}}><span>{a.icon}</span><p style={{fontSize:13,lineHeight:1.4}}>{a.text}</p></div>)}</div>}
      {workout.warmup!=='—'&&<div style={T.sub}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:4}}>WARMUP</p><p style={{fontSize:13}}>{workout.warmup}</p></div>}
      <div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:10}}>EXERCISES</p>
        {workout.exercises.map((ex,i)=>(
          <div key={i} style={{padding:'10px 0',borderBottom:i<workout.exercises.length-1?'0.5px solid var(--color-border-tertiary)':'none'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:3}}>
              <p style={{fontSize:14,fontWeight:500}}>{ex.name}</p>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                {ex.defaultSets>0&&<span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{ex.defaultSets}×{ex.defaultReps}{ex.defaultReps>0?' reps':''}</span>}
                {ex.isHiit&&<Pill col={workout.color||'#888'}>HIIT</Pill>}
              </div>
            </div>
            <p style={{fontSize:12,color:'var(--color-text-secondary)',lineHeight:1.4}}>💡 {ex.tip}</p>
          </div>
        ))}
      </div>
      {workout.cooldown!=='—'&&<div style={T.sub}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:4}}>COOLDOWN</p><p style={{fontSize:13}}>{workout.cooldown}</p></div>}
      <div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>🤖 PERSONALIZED ADVICE</p>{!aiTip&&<button onClick={getAiTip} disabled={loading} style={T.btnS}>{loading?'Getting advice...':'Get AI tips for today →'}</button>}{aiTip&&<pre style={{fontSize:13,whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.6}}>{aiTip}</pre>}</div>
    </div>}

    {tab==='log'&&<div>
      <div style={{...T.sub,marginBottom:12}}><p style={{fontSize:13,lineHeight:1.5}}>📊 Log every set, rep, and weight. Claude uses this history to make better workout recommendations next time.</p></div>
      {isGym?<WorkoutLogger workout={workout} profile={profile} measurements={measurements} onSave={handleLogSave}/>
      :<div style={{...T.card,textAlign:'center',padding:'2rem'}}><i className="ti ti-walk" style={{fontSize:32,color:'#888',display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Rest day — log your brisk walk duration instead.</p></div>}
      {workoutLogs?.length>0&&<div style={{...T.card,marginTop:12}}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>RECENT SESSIONS</p>{[...workoutLogs].reverse().slice(0,5).map((l,i)=><div key={i} style={{padding:'7px 0',borderBottom:i<4?'0.5px solid var(--color-border-tertiary)':'none',display:'flex',justifyContent:'space-between'}}><p style={{fontSize:13}}>{l.workout}{l.isExtra?<span style={{fontSize:10,color:C.vlsi,marginLeft:6}}>extra</span>:''}</p><p style={{fontSize:11,color:'var(--color-text-secondary)'}}>{new Date(l.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p></div>)}</div>}
    </div>}

    {tab==='diet'&&<div>
      <div style={{...T.card,borderTop:'4px solid #1D9E75'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}><div><p style={{fontSize:12,color:'var(--color-text-secondary)'}}>Today's target</p><p style={{fontSize:28,fontWeight:500,color:'var(--color-text-primary)'}}>{diet.kcal} kcal</p></div><div style={{textAlign:'right',fontSize:11,color:'var(--color-text-secondary)'}}><p>TDEE: {diet.TDEE}</p><p>Deficit: {diet.def}</p></div></div>
        <MacroBar protein={diet.protein} carbs={diet.carbs} fat={diet.fat}/>
      </div>
      <div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:10}}>VEGETARIAN PROTEIN SOURCES</p>{[['Soya chunks (dry)','52g/100g'],['Whey protein','24g/scoop'],['Paneer','18g/100g'],['Tofu (firm)','17g/100g'],['Rajma cooked','9g/100g'],['Greek yogurt','10g/100g']].map(([f,p],i,arr)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<arr.length-1?'0.5px solid var(--color-border-tertiary)':'none'}}><p style={{fontSize:13}}>{f}</p><Pill col='#1D9E75'>{p}</Pill></div>)}</div>
    </div>}

    {tab==='music'&&<div>
      <div style={{...T.sub,marginBottom:12}}><p style={{fontSize:13,lineHeight:1.5}}>🎵 Pick a playlist — music improves workout performance by ~10% on average.</p></div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>{MUSIC_PLAYLISTS.map((p,i)=><button key={i} onClick={()=>setMusicIdx(i)} style={T.chip(musicIdx===i,workout.color||'#888')}>{p.label}</button>)}</div>
      <div style={{borderRadius:'var(--border-radius-lg)',overflow:'hidden',aspectRatio:'16/9',marginBottom:10}}>
        <iframe src={`https://www.youtube.com/embed/videoseries?list=${MUSIC_PLAYLISTS[musicIdx].id}&autoplay=0`} style={{width:'100%',height:'100%',border:'none'}} allowFullScreen title="Workout music"/>
      </div>
      <p style={{fontSize:11,color:'var(--color-text-tertiary)',textAlign:'center'}}>Open in YouTube app for background play on phone</p>
    </div>}

    {tab==='schedule'&&<div>{FIT_PHASES.map((ph,i)=><div key={i} style={{...T.card,opacity:i<(profile.fitPhase||0)?0.4:1}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><p style={{fontSize:13,fontWeight:500}}>{ph.name}</p>{i===(profile.fitPhase||0)&&<Pill col={ph.color}>Current</Pill>}</div><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><div key={d} style={{padding:'5px 10px',borderRadius:8,background:ph.gymDays.includes(d)?`${ph.color}18`:'var(--color-background-secondary)',border:`0.5px solid ${ph.gymDays.includes(d)?ph.color:'var(--color-border-tertiary)'}`,fontSize:11,color:ph.gymDays.includes(d)?ph.color:'var(--color-text-secondary)',fontWeight:ph.gymDays.includes(d)?500:400}}>{d} {ph.gymDays.includes(d)?'💪':'🚶'}</div>)}</div></div>)}</div>}
  </div>;
}

// ══ TRACK ═════════════════════════════════════════════════════
function Track({measurements,setMeasurements,profile}){
  const[tab,setTab]=useState('log');const[weight,setWeight]=useState('');const[waist,setWaist]=useState('');const[hips,setHips]=useState('');const[thighs,setThighs]=useState('');const[chest,setChest]=useState('');const[saved,setSaved]=useState(false);const[analysis,setAnalysis]=useState('');const[analyzing,setAnalyzing]=useState(false);
  const m=measurements.length?measurements:[profile.firstMeasurement].filter(Boolean);const first=m[0]||profile.firstMeasurement;const last=m[m.length-1];const trend=PE.weightTrend(m);const sub=PE.stubbornAreas(m);const tC={gaining:'#E24B4A',plateau:'#BA7517',losing:'#1D9E75',losing_fast:'#BA7517',insufficient:'#888'};

  async function save(){if(!weight)return;const e={date:new Date().toISOString(),weight:+weight,waist:waist?+waist:null,hips:hips?+hips:null,thighs:thighs?+thighs:null,chest:chest?+chest:null};const upd=[...measurements,e];setMeasurements(upd);await db.set('measurements',upd);setSaved(true);setWeight('');setWaist('');setHips('');setThighs('');setChest('');setTimeout(()=>setSaved(false),3000);}
  async function getAnalysis(){setAnalyzing(true);const ctx=PE.fitCtx(m,profile);const r=await ai(`${ctx}\n\nAnalysis: (1) What's improving (2) Stubborn areas root cause (3) 2 changes this week (4) 4-week outlook. Under 200 words.`,"Personal trainer + nutritionist.");setAnalysis(r);setAnalyzing(false);}
  const diff=(k)=>{if(!first?.[k]||!last?.[k])return null;return{val:+(last[k]-first[k]).toFixed(1),good:last[k]<first[k]};};
  const wDiff=first&&last?+(first.weight-last.weight).toFixed(1):null;

  return<div style={{padding:'1.25rem'}}>
    <h2 style={{fontSize:18,fontWeight:500,marginBottom:4}}>Progress tracker</h2>
    <p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:'1rem'}}>Log every Sunday morning — same time, after bathroom.</p>
    <Tabs tabs={[['log','📏 Log'],['progress','📈 Progress'],['photos','📸 Photos']]} active={tab} setActive={setTab} col={C.track}/>

    {tab==='log'&&<div>
      <div style={{...T.card,borderLeft:`4px solid ${tC[trend]||'#888'}`,borderRadius:'0 12px 12px 0',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div><p style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:2}}>WEIGHT TREND</p><p style={{fontSize:16,fontWeight:500,color:tC[trend]||'#888'}}>{({gaining:'Gaining ⚠️',plateau:'Plateau 🔄',losing:'On track ✅',losing_fast:'Too fast ⚠️',insufficient:'Need data'})[trend]}</p>{sub.length>0&&<p style={{fontSize:11,color:'var(--color-text-secondary)',marginTop:2}}>Stubborn: {sub.join(', ')}</p>}</div>
        <div style={{textAlign:'right'}}><p style={{fontSize:22,fontWeight:500,color:tC[trend]||'#888'}}>{PE.weeklyRate(m)>=0?`−${PE.weeklyRate(m)}`:`+${Math.abs(PE.weeklyRate(m))}`}kg/wk</p>{wDiff!==null&&<p style={{fontSize:11,color:'var(--color-text-secondary)'}}>{wDiff>0?`${wDiff}kg lost`:`${Math.abs(wDiff)}kg gained`}</p>}</div>
      </div>
      {m.length>=2&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>{[{l:'Weight',d:{val:wDiff?-wDiff:null,good:wDiff>0},u:'kg'},{l:'Waist',d:diff('waist'),u:'cm'},{l:'Thighs',d:diff('thighs'),u:'cm'},{l:'Hips',d:diff('hips'),u:'cm'}].map((c,i)=>{const good=c.d?.good;const val=c.d?.val;return<div key={i} style={{background:'var(--color-background-secondary)',borderRadius:'var(--border-radius-md)',padding:'11px 13px'}}><p style={{fontSize:11,color:'var(--color-text-secondary)',marginBottom:3}}>{c.l}</p><p style={{fontSize:19,fontWeight:500,color:val==null?'var(--color-text-tertiary)':good?'#1D9E75':'#E24B4A'}}>{val==null?'—':`${val>0?'+':''}${val}${c.u}`}</p></div>;})}</div>}
      <div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:10}}>LOG TODAY</p><div style={{display:'flex',flexDirection:'column',gap:10}}><div><label style={T.lbl}>Weight (kg) *</label><input style={T.input} type="number" step="0.1" placeholder="e.g. 88.5" value={weight} onChange={e=>setWeight(e.target.value)}/></div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><label style={T.lbl}>Waist</label><input style={T.input} type="number" placeholder="cm" value={waist} onChange={e=>setWaist(e.target.value)}/></div><div><label style={T.lbl}>Hips</label><input style={T.input} type="number" placeholder="cm" value={hips} onChange={e=>setHips(e.target.value)}/></div><div><label style={T.lbl}>Left thigh</label><input style={T.input} type="number" placeholder="cm" value={thighs} onChange={e=>setThighs(e.target.value)}/></div><div><label style={T.lbl}>Chest</label><input style={T.input} type="number" placeholder="cm" value={chest} onChange={e=>setChest(e.target.value)}/></div></div>{saved?<div style={{padding:'11px',background:'var(--color-background-success)',borderRadius:'var(--border-radius-md)',textAlign:'center',fontSize:13,color:'var(--color-text-success)',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><i className="ti ti-check" style={{fontSize:15}}/>Saved! AI plan updated.</div>:<button onClick={save} disabled={!weight} style={{...T.btnP('#1D9E75'),opacity:weight?1:0.5}}>Save measurements</button>}</div></div>
      {last&&<div style={T.card}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)'}}>AI ANALYSIS</p>{!analysis&&<button onClick={getAnalysis} disabled={analyzing} style={{...T.btnS,fontSize:11,padding:'5px 10px'}}>{analyzing?'Analyzing...':'Get analysis →'}</button>}</div>{analysis&&<pre style={{fontSize:13,whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)',lineHeight:1.6}}>{analysis}</pre>}</div>}
    </div>}

    {tab==='progress'&&<div>
      {measurements.length>=2&&<div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>WEIGHT HISTORY</p><div style={{display:'flex',alignItems:'flex-end',gap:3,height:56,marginBottom:6}}>{[...measurements].slice(-12).map((e,i,arr)=>{const all=arr.map(x=>x.weight);const mn=Math.min(...all),mx=Math.max(...all),rng=mx-mn||1;const h=Math.round(((e.weight-mn)/rng)*40)+16;const isLast=i===arr.length-1;return<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}><div style={{width:'100%',height:h,borderRadius:'3px 3px 0 0',background:isLast?C.track:'var(--color-border-tertiary)'}}/>{isLast&&<p style={{fontSize:9,color:C.track,fontWeight:600}}>{e.weight}</p>}</div>;})} </div><div style={{display:'flex',justifyContent:'space-between'}}><p style={{fontSize:10,color:'var(--color-text-tertiary)'}}>{new Date(measurements[Math.max(0,measurements.length-12)].date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p><p style={{fontSize:10,color:'var(--color-text-tertiary)'}}>{new Date(measurements[measurements.length-1].date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p></div></div>}
      {measurements.length>0&&<div style={T.card}><p style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:8}}>ALL ENTRIES</p>{[...measurements].reverse().slice(0,12).map((e,i)=><div key={i} style={{padding:'7px 0',borderBottom:i<Math.min(measurements.length,12)-1?'0.5px solid var(--color-border-tertiary)':'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}><p style={{fontSize:12,color:'var(--color-text-secondary)'}}>{new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p><div style={{display:'flex',gap:8}}><span style={{fontSize:13,fontWeight:500}}>{e.weight}kg</span>{e.waist&&<span style={{fontSize:11,color:'var(--color-text-secondary)'}}>W:{e.waist}</span>}{e.thighs&&<span style={{fontSize:11,color:'var(--color-text-secondary)'}}>T:{e.thighs}</span>}</div></div>)}</div>}
      {measurements.length===0&&<div style={{...T.sub,textAlign:'center',padding:'2rem'}}><i className="ti ti-chart-line" style={{fontSize:32,color:'var(--color-text-tertiary)',display:'block',marginBottom:8}}/><p style={{fontSize:13,color:'var(--color-text-secondary)'}}>Log your first measurements to see trends.</p></div>}
    </div>}

    {tab==='photos'&&<PhotoAnalyzer profile={profile} measurements={measurements}/>}
  </div>;
}

// ══ AI COACH ═════════════════════════════════════════════════
function AICoach({profile,measurements,vlsiProgress}){
  const[msgs,setMsgs]=useState([{role:'assistant',content:`Hi ${profile.name.split(' ')[0]}! I know your VLSI progress, test scores, measurements, and fitness trends. Ask me anything specific.`}]);
  const[input,setInput]=useState('');const[loading,setLoading]=useState(false);const[calLoading,setCalLoading]=useState(false);const[calResult,setCalResult]=useState('');
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[msgs]);
  const m=measurements.length?measurements:[profile.firstMeasurement].filter(Boolean);

  async function send(){if(!input.trim()||loading)return;const msg=input.trim();setInput('');setMsgs(p=>[...p,{role:'user',content:msg}]);setLoading(true);const r=await ai(msg,`AI coach for ${profile.name}.\n${PE.fitCtx(m,profile)}\n${PE.vlsiCtx(vlsiProgress,profile)}\nBe specific, encouraging, concise.`,msgs.slice(-10));setMsgs(p=>[...p,{role:'assistant',content:r}]);setLoading(false);}

  async function scheduleSession(type){
    setCalLoading(true);setCalResult('');
    const today=new Date().toISOString().split('T')[0];
    const r=await ai(
      `Schedule a ${type==='study'?'VLSI study session 7:00pm to 9:00pm':'gym workout session 6:00am to 7:30am'} today (${today}). Title: "${type==='study'?`VLSI Study — ${VLSI_PHASES[profile.vlsiPhase]?.name} Day ${profile.vlsiDay}`:'Gym Workout — '+FIT_PHASES[profile.fitPhase||0].name}". Add it to my Google Calendar.`,
      "You are a helpful assistant managing someone's Google Calendar.",
      [],
      [{type:"url",url:"https://calendarmcp.googleapis.com/mcp/v1",name:"google-calendar"}]
    );
    setCalResult(r);setCalLoading(false);
  }

  const suggestions=["Why are love handles last to go?","Explain flip-flop setup time","What's my calorie target today?","I scored 2/5 — what to review?","Best vegetarian pre-workout snack?","Explain K-map grouping rules"];

  return<div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 72px)'}}>
    <div style={{padding:'1rem 1.25rem .75rem',borderBottom:'0.5px solid var(--color-border-tertiary)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',gap:8,alignItems:'center'}}><div style={{width:32,height:32,borderRadius:'50%',background:C.ai+'22',display:'flex',alignItems:'center',justifyContent:'center'}}><i className="ti ti-robot" style={{fontSize:16,color:C.ai}}/></div><div><p style={{fontSize:14,fontWeight:500}}>AI Coach</p><p style={{fontSize:11,color:'var(--color-text-secondary)'}}>Knows your full progress</p></div></div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>scheduleSession('study')} disabled={calLoading} style={{...T.btnS,fontSize:11,padding:'6px 10px',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-calendar" style={{fontSize:12}}/>Schedule Study</button>
          <button onClick={()=>scheduleSession('gym')} disabled={calLoading} style={{...T.btnS,fontSize:11,padding:'6px 10px',display:'flex',alignItems:'center',gap:4}}><i className="ti ti-calendar" style={{fontSize:12}}/>Schedule Gym</button>
        </div>
      </div>
      {calLoading&&<p style={{fontSize:12,color:C.ai}}>Adding to Google Calendar...</p>}
      {calResult&&<div style={{...T.sub,padding:'8px 10px',marginBottom:0}}><pre style={{fontSize:12,color:'var(--color-text-primary)',whiteSpace:'pre-wrap',fontFamily:'var(--font-sans)'}}>{calResult}</pre></div>}
    </div>
    <div style={{flex:1,overflowY:'auto',padding:'1rem 1.25rem',display:'flex',flexDirection:'column',gap:10}}>
      {msgs.length===1&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>{suggestions.map((s,i)=><button key={i} onClick={()=>setInput(s)} style={{fontSize:12,padding:'7px 12px',border:'0.5px solid var(--color-border-secondary)',borderRadius:16,background:'var(--color-background-primary)',color:'var(--color-text-secondary)',cursor:'pointer',lineHeight:1.3}}>{s}</button>)}</div>}
      {msgs.map((m,i)=><div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',alignItems:'flex-end',gap:6}}>{m.role==='assistant'&&<div style={{width:24,height:24,borderRadius:'50%',background:C.ai+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginBottom:2}}><i className="ti ti-robot" style={{fontSize:11,color:C.ai}}/></div>}<div style={{maxWidth:'82%',padding:'10px 13px',borderRadius:m.role==='user'?'18px 18px 4px 18px':'18px 18px 18px 4px',background:m.role==='user'?'var(--color-text-primary)':'var(--color-background-secondary)',color:m.role==='user'?'var(--color-background-primary)':'var(--color-text-primary)',fontSize:13,lineHeight:1.65,whiteSpace:'pre-wrap'}}>{m.content}</div></div>)}
      {loading&&<div style={{display:'flex',gap:6,alignItems:'flex-end'}}><div style={{width:24,height:24,borderRadius:'50%',background:C.ai+'22',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><i className="ti ti-robot" style={{fontSize:11,color:C.ai}}/></div><div style={{padding:'10px 14px',borderRadius:'18px 18px 18px 4px',background:'var(--color-background-secondary)',fontSize:13,color:'var(--color-text-secondary)'}}>Thinking...</div></div>}
      <div ref={bottomRef}/>
    </div>
    <div style={{padding:'.75rem 1.25rem 1rem',borderTop:'0.5px solid var(--color-border-tertiary)',display:'flex',gap:8}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Ask anything..." style={{...T.input,flex:1,padding:'10px 14px'}}/>
      <button onClick={send} disabled={!input.trim()||loading} style={{width:44,height:44,borderRadius:'var(--border-radius-md)',border:'none',background:input.trim()&&!loading?C.ai:'var(--color-background-secondary)',color:'#fff',cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><i className="ti ti-send"/></button>
    </div>
  </div>;
}

// ══ EXTRA SESSION MODAL ══════════════════════════════════════
function ExtraSessionModal({profile,vlsiProgress,workoutLogs,onSave,onClose}){
  const[type,setType]=useState('workout');const[notes,setNotes]=useState('');const[saving,setSaving]=useState(false);
  async function save(){if(!notes.trim())return;setSaving(true);const entry={date:todayKey(),type,notes,isExtra:true,workout:type==='workout'?'Extra Session':'Extra Study'};await onSave(entry);setSaving(false);onClose();}
  return<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
    <div style={{background:'var(--color-background-primary)',borderRadius:'20px 20px 0 0',padding:'1.5rem',width:'100%',maxWidth:480,margin:'0 auto'}}>
      <p style={{fontSize:16,fontWeight:500,marginBottom:4}}>Log extra session</p>
      <p style={{fontSize:13,color:'var(--color-text-secondary)',marginBottom:16}}>The AI will note your dedication and factor this into recommendations.</p>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <button onClick={()=>setType('workout')} style={T.chip(type==='workout',C.fit)}>💪 Workout</button>
        <button onClick={()=>setType('study')} style={T.chip(type==='study',C.vlsi)}>📚 Study</button>
      </div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={T.ta} placeholder={type==='workout'?'What exercises did you do? Sets, reps, weights...':'What VLSI topics did you study? How long?'}/>
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={onClose} style={{...T.btnS,flex:1}}>Cancel</button>
        <button onClick={save} disabled={!notes.trim()||saving} style={{...T.btnP(type==='workout'?C.fit:C.vlsi),flex:2,opacity:notes.trim()?1:0.5}}>Save session</button>
      </div>
    </div>
  </div>;
}

// ══ BOTTOM NAV ════════════════════════════════════════════════
function Nav({screen,setScreen}){
  const tabs=[{id:'home',icon:'ti-home',l:'Home',col:C.home},{id:'study',icon:'ti-book-2',l:'Study',col:C.vlsi},{id:'train',icon:'ti-barbell',l:'Train',col:C.fit},{id:'track',icon:'ti-chart-line',l:'Track',col:C.track},{id:'ai',icon:'ti-robot',l:'AI',col:C.ai}];
  return<nav style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'var(--color-background-primary)',borderTop:'0.5px solid var(--color-border-tertiary)',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom,0px)'}}>
    {tabs.map(t=>{const on=screen===t.id;return<button key={t.id} onClick={()=>setScreen(t.id)} style={{flex:1,padding:'8px 4px 6px',border:'none',background:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:2,position:'relative'}}>
      {on&&<div style={{position:'absolute',top:0,left:'15%',right:'15%',height:2,borderRadius:'0 0 2px 2px',background:t.col}}/>}
      <i className={`ti ${t.icon}`} style={{fontSize:21,color:on?t.col:'var(--color-text-tertiary)',transition:'color .15s'}}/>
      <span style={{fontSize:9,color:on?t.col:'var(--color-text-tertiary)',fontWeight:on?600:400}}>{t.l}</span>
    </button>;})}
  </nav>;
}

// ══ ROOT ══════════════════════════════════════════════════════
export default function App(){
  const[screen,setScreen]=useState('home');const[profile,setProfile]=useState(null);const[measurements,setMeasurements]=useState([]);const[vlsiProgress,setVlsiProgress]=useState({completedDays:[],testScores:[]});const[workoutLogs,setWorkoutLogs]=useState([]);const[loading,setLoading]=useState(true);const[showExtra,setShowExtra]=useState(false);

  useEffect(()=>{(async()=>{const p=await db.get('profile');const m=await db.get('measurements')||[];const vp=await db.get('vlsiProgress')||{completedDays:[],testScores:[]};const wl=await db.get('workoutLogs')||[];setProfile(p);setMeasurements(m);setVlsiProgress(vp);setWorkoutLogs(wl);setLoading(false);})();},[]);

  const saveProfile=async p=>{await db.set('profile',p);setProfile(p);};
  const updateM=async m=>{setMeasurements(m);await db.set('measurements',m);};
  const updateVP=async vp=>{setVlsiProgress(vp);await db.set('vlsiProgress',vp);};
  const updateWL=async wl=>{setWorkoutLogs(wl);await db.set('workoutLogs',wl);};
  const handleExtraSave=async(entry)=>{const upd=[...workoutLogs,entry];await updateWL(upd);};

  if(loading)return<Loading/>;
  if(!profile)return<Setup onDone={saveProfile}/>;

  return<div style={{fontFamily:'var(--font-sans)',maxWidth:480,margin:'0 auto',minHeight:'100vh',background:'var(--color-background-primary)',display:'flex',flexDirection:'column'}}>
    <div style={{flex:1,overflowY:'auto',paddingBottom:72}}>
      {screen==='home'&&<Home profile={profile} measurements={measurements} vlsiProgress={vlsiProgress} workoutLogs={workoutLogs} setScreen={setScreen} onExtraSession={()=>setShowExtra(true)}/>}
      {screen==='study'&&<Study profile={profile} setProfile={async p=>{setProfile(p);await db.set('profile',p);}} vlsiProgress={vlsiProgress} setVlsiProgress={updateVP}/>}
      {screen==='train'&&<Train profile={profile} measurements={measurements} workoutLogs={workoutLogs} setWorkoutLogs={updateWL}/>}
      {screen==='track'&&<Track measurements={measurements} setMeasurements={updateM} profile={profile}/>}
      {screen==='ai'&&<AICoach profile={profile} measurements={measurements} vlsiProgress={vlsiProgress}/>}
    </div>
    <Nav screen={screen} setScreen={setScreen}/>
    {showExtra&&<ExtraSessionModal profile={profile} vlsiProgress={vlsiProgress} workoutLogs={workoutLogs} onSave={handleExtraSave} onClose={()=>setShowExtra(false)}/>}
  </div>;
}
