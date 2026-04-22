// Mesh Rider Fleet NMS — shared UI atoms
// React hooks destructured once in data.jsx

// ---------- Small atoms ----------
const Dot = ({ state, size = 7 }) => {
  const color = state === 'online' || state === 'ok' ? 'var(--ok)'
              : state === 'degraded' || state === 'warn' ? 'var(--warn)'
              : state === 'offline' || state === 'err' ? 'var(--err)'
              : 'var(--ink-3)';
  return <span className={state==='online'||state==='ok' ? 'pulse' : ''}
    style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color, boxShadow:`0 0 ${size}px ${color}` }} />;
};

const Chip = ({ tone='neutral', children, style }) => {
  const cls = tone==='ok'?'chip chip-ok':tone==='warn'?'chip chip-warn':tone==='err'?'chip chip-err':tone==='info'?'chip chip-info':tone==='amber'?'chip chip-amber':tone==='cyan'?'chip chip-cyan':'chip';
  return <span className={cls} style={style}>{children}</span>;
};

const Hairline = ({ v, style }) => <div className={v?'vhairline':'hairline'} style={style} />;

// Sparkline
const Spark = ({ data, width=120, height=28, stroke='var(--amber)', fill=true }) => {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const r = max-min || 1;
  const step = width / (data.length-1);
  const pts = data.map((v,i) => [i*step, height - ((v-min)/r)*(height-3) - 1]);
  const d = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const df = d + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <path d={df} fill={stroke} opacity="0.12"/>}
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.3"/>
    </svg>
  );
};

// Signal bars
const SigBars = ({ snr, size=12 }) => {
  const lvl = snr >= 22 ? 4 : snr >= 16 ? 3 : snr >= 10 ? 2 : snr > 0 ? 1 : 0;
  return (
    <span style={{ display:'inline-flex', alignItems:'flex-end', gap:1.5, height:size }}>
      {[1,2,3,4].map(n => (
        <span key={n} style={{
          width:3, height: size*(0.3 + n*0.175),
          background: n <= lvl ? (lvl>=3?'var(--ok)':lvl>=2?'var(--warn)':'var(--err)') : 'var(--line-strong)',
          borderRadius: 1,
        }}/>
      ))}
    </span>
  );
};

// KPI tile
const KPI = ({ label, value, unit, delta, spark, sparkColor, hint }) => (
  <div className="vstack" style={{ padding:'14px 16px', flex:1, minWidth:0, gap:10 }}>
    <div className="hstack" style={{ justifyContent:'space-between' }}>
      <div className="t-label">{label}</div>
      {delta!=null && (
        <div className="hstack t-mono" style={{ fontSize:10.5, color: delta>=0?'var(--ok)':'var(--err)', gap:2 }}>
          {delta>=0?'▲':'▼'} {Math.abs(delta)}%
        </div>
      )}
    </div>
    <div className="hstack" style={{ alignItems:'baseline', gap:2 }}>
      <span className="kpi-val">{value}</span>
      {unit && <span className="kpi-unit">{unit}</span>}
    </div>
    {spark && <Spark data={spark} width={160} height={22} stroke={sparkColor||'var(--amber)'} />}
    {hint && <div className="t-micro" style={{ color:'var(--ink-3)' }}>{hint}</div>}
  </div>
);

// Progress bar
const Progress = ({ value, max=100, tone='amber', height=4 }) => {
  const pct = Math.min(100, (value/max)*100);
  const col = tone==='ok'?'var(--ok)':tone==='warn'?'var(--warn)':tone==='err'?'var(--err)':'var(--amber)';
  return (
    <div style={{ width:'100%', height, background:'var(--bg-3)', borderRadius:2, overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:col, transition:'width .3s' }}/>
    </div>
  );
};

// Button helpers
const Btn = ({ kind='default', size='md', icon, children, active, onClick, style, title }) => {
  const cls = ['btn', kind==='primary'&&'btn-primary', kind==='ghost'&&'btn-ghost', size==='sm'&&'btn-sm', !children&&icon&&'btn-icon'].filter(Boolean).join(' ');
  const activeStyle = active ? { background:'var(--bg-4)', borderColor:'var(--amber-line)', color:'var(--amber)' } : null;
  return (
    <button className={cls} onClick={onClick} title={title} style={{...style, ...activeStyle}}>
      {icon && <I.Icon.__unused/>}
      {icon}
      {children}
    </button>
  );
};

// Section header used inside panels
const PanelHead = ({ title, subtitle, right }) => (
  <div className="hstack" style={{ padding:'11px 14px', borderBottom:'1px solid var(--line)', justifyContent:'space-between', gap:12, minHeight:44 }}>
    <div className="vstack" style={{ gap:2, minWidth:0, flex:'1 1 auto' }}>
      <div style={{ fontSize:12.5, fontWeight:500, color:'var(--ink-0)', letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
      {subtitle && <div className="t-micro" style={{ color:'var(--ink-3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{subtitle}</div>}
    </div>
    {right && <div className="hstack gap-2" style={{ flexShrink:0 }}>{right}</div>}
  </div>
);

// Segmented control
const Seg = ({ items, value, onChange }) => (
  <div className="hstack" style={{ background:'var(--bg-3)', border:'1px solid var(--line)', borderRadius:6, padding:2, gap:2 }}>
    {items.map(it => (
      <button key={it.value} onClick={()=>onChange(it.value)} className="hstack gap-2"
        style={{
          padding:'4px 10px', borderRadius:4, fontSize:11.5, fontWeight:500,
          background: value===it.value ? 'var(--bg-1)' : 'transparent',
          color: value===it.value ? 'var(--ink-0)' : 'var(--ink-2)',
          border: value===it.value ? '1px solid var(--line-strong)' : '1px solid transparent',
        }}>
        {it.icon}{it.label}
      </button>
    ))}
  </div>
);

Object.assign(window, { Dot, Chip, Hairline, Spark, SigBars, KPI, Progress, PanelHead, Seg });
