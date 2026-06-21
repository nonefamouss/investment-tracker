import { useState, useEffect } from "react";

// ── Supabase config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://zlityxyxjbdlcrwsfohm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsaXR5eHl4amJkbGNyd3Nmb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTUxNTAsImV4cCI6MjA5NzUzMTE1MH0._u8ns7fuJ5y7nxspha9M6TWCxn2cZZDSDiZ9i85IvRI";

async function dbLoad() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/investments?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const rows = await res.json();
  const data = {};
  if (Array.isArray(rows)) rows.forEach(r => { data[r.month_key] = r.data; });
  return data;
}

async function dbSave(monthKey, entries) {
  await fetch(`${SUPABASE_URL}/rest/v1/investments`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: monthKey, month_key: monthKey, data: entries, updated_at: new Date().toISOString() }),
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DESTINATIONS = ["Kenya","Congo"];

function monthKey(year, month) { return `${year}-${String(month+1).padStart(2,"0")}`; }

function allMonths() {
  const list = [];
  for (let y = 2026; y <= 2032; y++) {
    const start = y === 2026 ? 5 : 0;
    for (let m = start; m < 12; m++) list.push({ year: y, month: m });
  }
  return list;
}

const ALL_MONTHS = allMonths();
const emptyEntry = () => ({
  id: Date.now() + Math.random(),
  date: "", amountInvested: "", expectedCharges: "", actualCharges: "",
  expectedProfit: "", actualProfit: "", destination: "Kenya",
});

function calcFields(e) {
  const inv = parseFloat(e.amountInvested) || 0;
  const actCh = parseFloat(e.actualCharges) || 0;
  const expPr = parseFloat(e.expectedProfit) || 0;
  const actPr = parseFloat(e.actualProfit) || 0;
  return {
    pctCharges: inv ? ((actCh / inv) * 100).toFixed(2) : "—",
    pctExpProfit: inv ? ((expPr / inv) * 100).toFixed(2) : "—",
    pctActProfit: inv ? ((actPr / inv) * 100).toFixed(2) : "—",
    totalRevenue: (inv + actPr).toFixed(0),
    realisedProfit: (actPr - actCh).toFixed(0),
  };
}

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
  orange:"#FF6B00", amber:"#FF9A00", gold:"#FFD000", dark:"#1A0A00",
  card:"rgba(255,255,255,0.10)", text:"#FFF8F0", muted:"rgba(255,248,240,0.65)",
  accent:"#00E5CC", green:"#00C97A", red:"#FF4655", border:"rgba(255,154,0,0.35)",
};

const glassCard = {
  background: C.card, backdropFilter: "blur(12px)",
  border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px",
};

// ── sub-components ────────────────────────────────────────────────────────────
function Tag({ children, color = C.amber }) {
  return (
    <span style={{ background: color+"22", color, border:`1px solid ${color}55`, borderRadius:6, padding:"2px 10px", fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase" }}>{children}</span>
  );
}

function StatPill({ label, value, color = C.gold }) {
  return (
    <div style={{ background:color+"18", border:`1px solid ${color}44`, borderRadius:12, padding:"10px 16px", textAlign:"center", minWidth:110 }}>
      <div style={{ color, fontSize:20, fontWeight:800 }}>{value}</div>
      <div style={{ color:C.muted, fontSize:10, marginTop:2, textTransform:"uppercase", letterSpacing:0.8 }}>{label}</div>
    </div>
  );
}

function Input({ label, value, onChange, type="text", placeholder="" }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1, minWidth:130 }}>
      <label style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:0.6, textTransform:"uppercase" }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}
        style={{ background:"rgba(0,0,0,0.30)", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", width:"100%", boxSizing:"border-box" }}
        onFocus={e=>e.target.style.borderColor=C.amber} onBlur={e=>e.target.style.borderColor=C.border} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1, minWidth:130 }}>
      <label style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:0.6, textTransform:"uppercase" }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ background:"#1A0900", border:`1.5px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.text, fontSize:14, outline:"none", cursor:"pointer" }}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ReadonlyField({ label, value, color=C.gold }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4, flex:1, minWidth:120 }}>
      <label style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:0.6, textTransform:"uppercase" }}>{label}</label>
      <div style={{ background:"rgba(0,0,0,0.20)", border:`1.5px solid ${color}44`, borderRadius:8, padding:"9px 12px", color, fontSize:14, fontWeight:700, minHeight:38 }}>{value}</div>
    </div>
  );
}

function EntryRow({ entry, onChange, onRemove, index }) {
  const calc = calcFields(entry);
  const inv = parseFloat(entry.amountInvested) || 0;
  return (
    <div style={{ ...glassCard, marginBottom:16, borderLeft:`4px solid ${C.amber}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <Tag color={C.amber}>Entry #{index+1}</Tag>
        <div style={{ display:"flex", gap:8 }}>
          <Tag color={entry.destination==="Kenya"?C.green:C.accent}>{entry.destination}</Tag>
          <button onClick={onRemove} style={{ background:C.red+"22", border:`1px solid ${C.red}55`, color:C.red, borderRadius:6, padding:"4px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>✕ Remove</button>
        </div>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:12 }}>
        <Input label="Date" type="date" value={entry.date} onChange={v=>onChange("date",v)} />
        <Input label="Amount Invested (UGX)" type="number" placeholder="e.g. 5000000" value={entry.amountInvested} onChange={v=>onChange("amountInvested",v)} />
        <Select label="Destination" value={entry.destination} onChange={v=>onChange("destination",v)} options={DESTINATIONS} />
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:12 }}>
        <Input label="Expected Charges (UGX)" type="number" value={entry.expectedCharges} onChange={v=>onChange("expectedCharges",v)} />
        <Input label="Actual Charges (UGX)" type="number" value={entry.actualCharges} onChange={v=>onChange("actualCharges",v)} />
        <Input label="Expected Profit (UGX)" type="number" value={entry.expectedProfit} onChange={v=>onChange("expectedProfit",v)} />
        <Input label="Actual Profit (UGX)" type="number" value={entry.actualProfit} onChange={v=>onChange("actualProfit",v)} />
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:8 }}>
        <ReadonlyField label="% Charges" value={calc.pctCharges!=="—"?calc.pctCharges+"%":"—"} color={C.red} />
        <ReadonlyField label="% Expected Profit" value={calc.pctExpProfit!=="—"?calc.pctExpProfit+"%":"—"} color={C.amber} />
        <ReadonlyField label="% Actual Profit" value={calc.pctActProfit!=="—"?calc.pctActProfit+"%":"—"} color={C.green} />
        <ReadonlyField label="Realised Profit (UGX)" value={inv ? Number(calc.realisedProfit).toLocaleString() : "—"} color={C.green} />
        <ReadonlyField label="Total Revenue (UGX)" value={inv?Number(calc.totalRevenue).toLocaleString():"—"} color={C.gold} />
      </div>
    </div>
  );
}

function MonthSummary({ year, month, entries, globalTotal, onEdit }) {
  const isActive = entries.length > 0;
  const totalInv = entries.reduce((s,e)=>s+(parseFloat(e.amountInvested)||0),0);
  const totalActPr = entries.reduce((s,e)=>s+(parseFloat(e.actualProfit)||0),0);
  return (
    <div style={{ ...glassCard, marginBottom:18, opacity:isActive?1:0.45, borderLeft:`4px solid ${isActive?C.orange:C.border}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ color:C.gold, fontWeight:800, fontSize:18 }}>{MONTHS[month]} {year}</div>
          {isActive
            ? <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{entries.length} investment{entries.length>1?"s":""} · Total #{globalTotal}</div>
            : <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>No data entered yet</div>}
        </div>
        <button onClick={()=>onEdit(year,month)} style={{ background:`linear-gradient(135deg,${C.orange},${C.amber})`, border:"none", borderRadius:8, padding:"8px 18px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}>
          {isActive?"✏️ Edit":"+ Add Data"}
        </button>
      </div>
      {isActive && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:14 }}>
          <StatPill label="Invested" value={"UGX "+totalInv.toLocaleString()} color={C.amber} />
          <StatPill label="Actual Profit" value={"UGX "+totalActPr.toLocaleString()} color={C.green} />
          <StatPill label="Total Revenue" value={"UGX "+(totalInv+totalActPr).toLocaleString()} color={C.gold} />
          <StatPill label="Times Invested" value={entries.length} color={C.accent} />
          <StatPill label="Destinations" value={[...new Set(entries.map(e=>e.destination))].join(", ")} color={C.orange} />
        </div>
      )}
    </div>
  );
}

function DataEntryModal({ year, month, entries, onSave, onClose }) {
  const [localEntries, setLocalEntries] = useState(entries.length>0?entries.map(e=>({...e})):[emptyEntry()]);
  const [status, setStatus] = useState("idle"); // idle | saving | saved | error

  function update(id, field, value) { setLocalEntries(prev=>prev.map(e=>e.id===id?{...e,[field]:value}:e)); }
  function addEntry() { setLocalEntries(prev=>[...prev,emptyEntry()]); }
  function removeEntry(id) { setLocalEntries(prev=>prev.filter(e=>e.id!==id)); }

  async function handleSave() {
    setStatus("saving");
    try {
      await onSave(localEntries);
      setStatus("saved");
      setTimeout(()=>setStatus("idle"),2500);
    } catch {
      setStatus("error");
      setTimeout(()=>setStatus("idle"),3000);
    }
  }

  const totalInv = localEntries.reduce((s,e)=>s+(parseFloat(e.amountInvested)||0),0);
  const btnLabel = status==="saving"?"⏳ Saving to Cloud…":status==="saved"?"✅ Saved to Cloud!":status==="error"?"❌ Error — Try Again":"💾 Save to Cloud";
  const btnColor = status==="saved"?C.green:status==="error"?C.red:`linear-gradient(135deg,${C.orange},${C.amber})`;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(10,4,0,0.80)", backdropFilter:"blur(8px)", display:"flex", flexDirection:"column" }}>
      <div style={{ background:`linear-gradient(135deg,${C.dark},#2A1000)`, borderBottom:`2px solid ${C.orange}`, padding:"18px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ color:C.gold, fontWeight:800, fontSize:22 }}>📋 {MONTHS[month]} {year}</div>
          <div style={{ color:C.muted, fontSize:13 }}>Data saves to Supabase cloud — accessible from any device</div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {totalInv>0 && <div style={{ color:C.amber, fontWeight:700, fontSize:14 }}>Total: UGX {totalInv.toLocaleString()}</div>}
          <button onClick={handleSave} disabled={status==="saving"} style={{ background:btnColor, border:"none", borderRadius:10, padding:"10px 24px", color:"#fff", fontWeight:800, cursor:"pointer", fontSize:15 }}>{btnLabel}</button>
          <button onClick={onClose} style={{ background:"rgba(255,70,85,0.15)", border:`1px solid ${C.red}55`, color:C.red, borderRadius:10, padding:"10px 18px", fontWeight:700, cursor:"pointer", fontSize:15 }}>✕ Close</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"24px 28px" }}>
        {localEntries.map((entry,i)=>(
          <EntryRow key={entry.id} entry={entry} index={i} onChange={(field,value)=>update(entry.id,field,value)} onRemove={()=>removeEntry(entry.id)} />
        ))}
        <button onClick={addEntry} style={{ width:"100%", padding:"14px", marginTop:4, background:"rgba(255,154,0,0.10)", border:`2px dashed ${C.amber}`, borderRadius:12, color:C.amber, fontWeight:700, cursor:"pointer", fontSize:15 }}>+ Add Another Investment Entry</button>
      </div>
      <div style={{ background:`linear-gradient(135deg,${C.dark},#2A1000)`, borderTop:`2px solid ${C.orange}`, padding:"16px 28px", display:"flex", justifyContent:"flex-end", gap:12 }}>
        <div style={{ color:C.muted, fontSize:13, alignSelf:"center" }}>{localEntries.length} entr{localEntries.length===1?"y":"ies"} · {MONTHS[month]} {year}</div>
        <button onClick={handleSave} disabled={status==="saving"} style={{ background:btnColor, border:"none", borderRadius:10, padding:"12px 36px", color:"#fff", fontWeight:800, cursor:"pointer", fontSize:16, boxShadow:`0 4px 20px rgba(255,107,0,0.4)` }}>{btnLabel}</button>
      </div>
    </div>
  );
}

function HomePage({ data, onGoTracker, loading }) {
  const allEntries = Object.values(data).flat();
  const totalInv = allEntries.reduce((s,e)=>s+(parseFloat(e.amountInvested)||0),0);
  const totalPr  = allEntries.reduce((s,e)=>s+(parseFloat(e.actualProfit)||0),0);
  const totalTimes = allEntries.length;
  const activeMonths = Object.keys(data).filter(k=>data[k].length>0).length;

  return (
    <div style={{ minHeight:"100vh", padding:"0 0 80px" }}>
      <div style={{ textAlign:"center", padding:"60px 24px 40px", background:"linear-gradient(180deg,rgba(0,0,0,0.50) 0%,transparent 100%)" }}>
        <img src="https://i.ibb.co/Y4R3DTst/icon-512-png.jpg" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", marginBottom:20, boxShadow:`0 0 40px ${C.orange}66` }} />
        <h1 style={{ margin:0, fontSize:"clamp(26px,5vw,42px)", fontWeight:900, color:C.text, letterSpacing:-1, lineHeight:1.1 }}>
          Sylivester's Investment<br/>
          <span style={{ background:`linear-gradient(135deg,${C.orange},${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Strategy Tracker</span>
        </h1>
        <p style={{ color:C.muted, fontSize:16, marginTop:12, maxWidth:480, margin:"12px auto 0" }}>Track every shilling. Kenya · Congo. June 2026 → December 2032.</p>
        <div style={{ marginTop:8, color:C.green, fontSize:13, fontWeight:700 }}>☁️ Cloud Powered — Access from any device</div>
        <button onClick={onGoTracker} style={{ marginTop:28, background:`linear-gradient(135deg,${C.orange},${C.amber})`, border:"none", borderRadius:14, padding:"16px 44px", color:"#fff", fontWeight:800, cursor:"pointer", fontSize:18, boxShadow:`0 6px 28px ${C.orange}55` }}>
          🚀 Open Investment Tracker
        </button>
      </div>

      <div style={{ maxWidth:880, margin:"0 auto", padding:"0 20px" }}>
        {loading && <div style={{ ...glassCard, textAlign:"center", color:C.amber, padding:24, marginBottom:20 }}>⏳ Loading your data from cloud...</div>}
        <div style={{ ...glassCard, marginBottom:24 }}>
          <div style={{ color:C.muted, fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", marginBottom:16 }}>📊 Portfolio Overview</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:14, justifyContent:"center" }}>
            <StatPill label="Total Invested" value={"UGX "+(totalInv?totalInv.toLocaleString():"0")} color={C.amber} />
            <StatPill label="Total Profit" value={"UGX "+(totalPr?totalPr.toLocaleString():"0")} color={C.green} />
            <StatPill label="Total Revenue" value={"UGX "+((totalInv+totalPr)?( totalInv+totalPr).toLocaleString():"0")} color={C.gold} />
            <StatPill label="All Investments" value={totalTimes} color={C.accent} />
            <StatPill label="Active Months" value={activeMonths} color={C.orange} />
          </div>
        </div>

        <div style={{ color:C.gold, fontWeight:800, fontSize:18, marginBottom:14 }}>Recent Activity</div>
        {ALL_MONTHS.slice(0,12).map(({year,month})=>{
          const key = monthKey(year,month);
          const entries = data[key]||[];
          if(entries.length===0) return null;
          const inv = entries.reduce((s,e)=>s+(parseFloat(e.amountInvested)||0),0);
          const pr  = entries.reduce((s,e)=>s+(parseFloat(e.actualProfit)||0),0);
          return (
            <div key={key} style={{ ...glassCard, marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ color:C.text, fontWeight:700 }}>{MONTHS[month]} {year}</div>
                <div style={{ color:C.muted, fontSize:12 }}>{entries.length} investment{entries.length>1?"s":""}</div>
              </div>
              <div style={{ display:"flex", gap:12 }}>
                <span style={{ color:C.amber, fontWeight:700, fontSize:14 }}>In: UGX {inv.toLocaleString()}</span>
                <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>Profit: UGX {pr.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        {Object.values(data).every(v=>v.length===0) && !loading && (
          <div style={{ ...glassCard, textAlign:"center", color:C.muted, padding:36 }}>No investments recorded yet. Open the tracker to get started! 🚀</div>
        )}
      </div>
    </div>
  );
}

function TrackerPage({ data, onEdit }) {
  const allEntries = Object.values(data).flat();
  const globalTotal = allEntries.length;
  let runningTotal = 0;
  return (
    <div style={{ maxWidth:880, margin:"0 auto", padding:"24px 20px 80px" }}>
      <div style={{ color:C.gold, fontWeight:900, fontSize:24, marginBottom:6 }}>📅 All Months</div>
      <div style={{ color:C.muted, fontSize:13, marginBottom:24 }}>June 2026 → December 2032 · {globalTotal} total investment{globalTotal!==1?"s":""} recorded</div>
      {ALL_MONTHS.map(({year,month})=>{
        const key = monthKey(year,month);
        const entries = data[key]||[];
        runningTotal += entries.length;
        return <MonthSummary key={key} year={year} month={month} entries={entries} globalTotal={runningTotal} onEdit={onEdit} />;
      })}
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("home");
  const [editTarget, setEditTarget] = useState(null);

  useEffect(()=>{
    dbLoad().then(d=>{ setData(d); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  async function handleSaveEntries(entries) {
    const key = monthKey(editTarget.year, editTarget.month);
    const filtered = entries.filter(e=>e.amountInvested||e.actualProfit);
    await dbSave(key, filtered);
    setData(prev=>({ ...prev, [key]: filtered }));
  }

  const allEntries = Object.values(data).flat();
  const totalTimes = allEntries.length;

  return (
    <div style={{ minHeight:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:`linear-gradient(135deg,#1A0500 0%,#2D0E00 30%,#FF4500 70%,#FF8C00 100%)`, backgroundAttachment:"fixed", color:C.text }}>
      <nav style={{ position:"sticky", top:0, zIndex:500, background:"rgba(20,6,0,0.85)", backdropFilter:"blur(16px)", borderBottom:`2px solid ${C.orange}44`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 24px", height:58 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="https://i.ibb.co/Y4R3DTst/icon-512-png.jpg" style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover" }} />
          <span style={{ fontWeight:900, fontSize:16, color:C.gold }}>Sylivester IST</span>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["🏠 Home","home"],["📅 Tracker","tracker"]].map(([label,v])=>(
            <button key={v} onClick={()=>setView(v)} style={{ background:view===v?`linear-gradient(135deg,${C.orange},${C.amber})`:"transparent", border:view===v?"none":`1px solid ${C.border}`, borderRadius:8, padding:"7px 16px", color:view===v?"#fff":C.muted, fontWeight:700, cursor:"pointer", fontSize:13 }}>{label}</button>
          ))}
        </div>
        <div style={{ color:C.muted, fontSize:12, textAlign:"right" }}>
          <div style={{ color:C.amber, fontWeight:700 }}>{totalTimes} investments</div>
          <div style={{ color:C.green, fontSize:10 }}>☁️ Cloud Sync</div>
        </div>
      </nav>

      {view==="home"
        ? <HomePage data={data} onGoTracker={()=>setView("tracker")} loading={loading} />
        : <TrackerPage data={data} onEdit={(y,m)=>setEditTarget({year:y,month:m})} />
      }

      {editTarget && (
        <DataEntryModal
          year={editTarget.year} month={editTarget.month}
          entries={data[monthKey(editTarget.year,editTarget.month)]||[]}
          onSave={handleSaveEntries}
          onClose={()=>setEditTarget(null)}
        />
      )}

      <footer style={{ textAlign:"center", padding:"24px 20px", borderTop:`1px solid ${C.border}`, background:"rgba(10,2,0,0.70)", color:C.muted, fontSize:13 }}>
        <div style={{ fontWeight:800, color:C.amber, fontSize:15, marginBottom:4 }}>Sylivester's Investment Strategy Tracker</div>
        <div>© JoskFamily 2026+ · All rights reserved</div>
        <div style={{ marginTop:4, color:C.green, fontSize:11 }}>☁️ Powered by Supabase Cloud · Kenya · Congo</div>
      </footer>
    </div>
  );
}
