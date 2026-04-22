// Mesh Rider Fleet NMS — Radio detail, OTA, Spectrum, Alerts, Audit, Access

// ============ RADIO DETAIL ============
function RadioDetail({ id, onBack }) {
  const r = RADIOS[id] || RADIOS[4];
  const [tab, setTab] = useState('overview');

  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      {/* Header */}
      <div className="vstack" style={{ padding:'14px 20px', borderBottom:'1px solid var(--line)', gap:8 }}>
        <div className="hstack gap-2">
          <button className="btn btn-ghost btn-sm" onClick={onBack}><I.chevL size={11}/> Fleet</button>
          <I.chevR size={10} style={{ color:'var(--ink-3)' }}/>
          <span className="t-micro" style={{ color:'var(--ink-2)' }}>Radio</span>
          <I.chevR size={10} style={{ color:'var(--ink-3)' }}/>
          <span className="t-mono" style={{ fontSize:11.5, color:'var(--ink-0)' }}>{r.cs}</span>
        </div>
        <div className="hstack" style={{ gap:14 }}>
          <div className="hstack gap-2">
            <div style={{ width:40, height:40, borderRadius:6, background:'var(--bg-3)', border:'1px solid var(--line)', display:'grid', placeItems:'center', color:'var(--amber)' }}>
              <I.radio size={20}/>
            </div>
            <div className="vstack" style={{ gap:2 }}>
              <div className="hstack gap-2">
                <h1 className="t-mono" style={{ fontSize:17, fontWeight:500 }}>{r.cs}</h1>
                <Chip tone={r.state==='online'?'ok':r.state==='degraded'?'warn':'err'}><Dot state={r.state} size={5}/> {r.state.toUpperCase()}</Chip>
                <Chip>{r.formName} · {r.band}</Chip>
              </div>
              <div className="hstack gap-4" style={{ fontSize:11, color:'var(--ink-2)' }}>
                <span className="t-mono">{r.mac}</span>
                <span>·</span>
                <span className="t-mono">{r.ip}</span>
                <span>·</span>
                <span>{r.siteName}</span>
                <span>·</span>
                <span className="t-mono">{r.fw}</span>
              </div>
            </div>
          </div>
          <div className="flex1"/>
          <button className="btn btn-ghost"><I.terminal size={12}/>SSH</button>
          <button className="btn btn-ghost"><I.refresh size={12}/>Reboot</button>
          <button className="btn btn-ghost"><I.ota size={12}/>Push firmware</button>
          <button className="btn btn-primary"><I.settings size={12}/>Apply template</button>
        </div>
        <div className="hstack gap-2" style={{ marginTop:4 }}>
          {['overview','telemetry','config','events','security'].map(t => (
            <button key={t} onClick={()=>setTab(t)} className="hstack" style={{
              padding:'6px 12px', fontSize:11.5, textTransform:'capitalize',
              borderBottom: tab===t ? '2px solid var(--amber)' : '2px solid transparent',
              color: tab===t ? 'var(--ink-0)' : 'var(--ink-2)',
              fontWeight: tab===t ? 500 : 400, marginBottom:-1,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex1" style={{ overflow:'auto', padding:20, minHeight:0 }}>
        {/* KPI strip */}
        <div className="hstack gap-3" style={{ marginBottom:14 }}>
          <div className="panel vstack" style={{ padding:'14px 16px', flex:1, gap:8 }}>
            <div className="hstack" style={{ justifyContent:'space-between' }}>
              <div className="t-label">SNR · Rx</div>
              <SigBars snr={r.snr}/>
            </div>
            <div className="hstack" style={{ alignItems:'baseline', gap:2 }}>
              <span className="kpi-val">{r.snr}</span><span className="kpi-unit">dB</span>
            </div>
            <Spark data={series(id*3+1, r.snr, 5)} width={200} height={28} stroke="var(--ok)"/>
          </div>
          <div className="panel vstack" style={{ padding:'14px 16px', flex:1, gap:8 }}>
            <div className="t-label">Throughput</div>
            <div className="hstack" style={{ alignItems:'baseline', gap:2 }}>
              <span className="kpi-val">{r.mbps}</span><span className="kpi-unit">Mbps</span>
            </div>
            <Spark data={series(id*3+2, r.mbps, 15)} width={200} height={28} stroke="var(--amber)"/>
          </div>
          <div className="panel vstack" style={{ padding:'14px 16px', flex:1, gap:8 }}>
            <div className="t-label">Tx power</div>
            <div className="hstack" style={{ alignItems:'baseline', gap:2 }}>
              <span className="kpi-val">{r.tx}</span><span className="kpi-unit">dBm</span>
            </div>
            <Spark data={series(id*3+3, r.tx, 2)} width={200} height={28} stroke="var(--cyan)"/>
          </div>
          <div className="panel vstack" style={{ padding:'14px 16px', flex:1, gap:8 }}>
            <div className="t-label">CPU · Temp</div>
            <div className="hstack" style={{ alignItems:'baseline', gap:6 }}>
              <span className="kpi-val">{r.cpu}<span className="kpi-unit">%</span></span>
              <span style={{ color:'var(--ink-3)' }}>·</span>
              <span className="kpi-val">{r.temp}<span className="kpi-unit">°C</span></span>
            </div>
            <Progress value={r.temp} max={80} tone={r.temp>60?'err':r.temp>50?'warn':'ok'}/>
          </div>
          <div className="panel vstack" style={{ padding:'14px 16px', flex:1, gap:8 }}>
            <div className="t-label">Battery</div>
            <div className="hstack" style={{ alignItems:'baseline', gap:2 }}>
              <span className="kpi-val">{r.bat}</span><span className="kpi-unit">%</span>
            </div>
            <Progress value={r.bat} tone={r.bat<30?'err':r.bat<55?'warn':'ok'}/>
          </div>
        </div>

        {/* Two-column */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:14 }}>
          {/* Main */}
          <div className="vstack gap-3">
            <div className="panel">
              <PanelHead title="Link quality · 6 h" subtitle="SNR · PER · retries · per-neighbor"
                right={<Seg value="6h" onChange={()=>{}} items={[{value:'1h',label:'1H'},{value:'6h',label:'6H'},{value:'24h',label:'24H'},{value:'7d',label:'7D'}]}/>} />
              <div style={{ padding:16, height:220, position:'relative' }}>
                <svg viewBox="0 0 800 200" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                  {/* grid */}
                  {[0,0.25,0.5,0.75,1].map(y=>(
                    <line key={y} x1="0" x2="800" y1={y*200} y2={y*200} stroke="var(--line-faint)" strokeWidth="1"/>
                  ))}
                  {/* SNR */}
                  {(() => {
                    const s = series(id*7, 22, 6, 80);
                    const pts = s.map((v,i)=>[i*(800/79), 200-(v/35)*200]);
                    const dd = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
                    const fillD = dd + ` L 800 200 L 0 200 Z`;
                    return (<>
                      <path d={fillD} fill="var(--ok)" opacity="0.08"/>
                      <path d={dd} fill="none" stroke="var(--ok)" strokeWidth="1.5"/>
                    </>);
                  })()}
                  {/* PER overlay */}
                  {(() => {
                    const s = series(id*7+11, 10, 5, 80);
                    const pts = s.map((v,i)=>[i*(800/79), 200-(v/35)*200]);
                    const dd = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
                    return <path d={dd} fill="none" stroke="var(--warn)" strokeWidth="1.2" strokeDasharray="3 3"/>;
                  })()}
                </svg>
                <div className="hstack gap-3" style={{ position:'absolute', bottom:8, right:16, fontSize:10.5, color:'var(--ink-2)' }}>
                  <span className="hstack gap-2"><span style={{ width:10, height:2, background:'var(--ok)' }}/>SNR</span>
                  <span className="hstack gap-2"><span style={{ width:10, height:2, background:'var(--warn)' }}/>PER</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <PanelHead title="Neighbors" subtitle={`${LINKS.filter(l=>l.a===id||l.b===id).length} direct links`}/>
              <table className="data">
                <thead><tr><th></th><th>Neighbor</th><th>SNR</th><th>Rx rate</th><th>Tx rate</th><th>Retries</th><th>Status</th></tr></thead>
                <tbody>
                  {LINKS.filter(l=>l.a===id||l.b===id).slice(0,6).map((l,i)=>{
                    const n = RADIOS[l.a===id?l.b:l.a];
                    return (
                      <tr key={i}>
                        <td><Dot state={l.q==='ok'?'ok':l.q==='warn'?'warn':'err'}/></td>
                        <td className="t-mono" style={{ fontWeight:500 }}>{n.cs}</td>
                        <td><div className="hstack gap-2"><SigBars snr={l.snr} size={10}/><span className="t-mono" style={{ fontSize:11 }}>{l.snr} dB</span></div></td>
                        <td className="t-mono">{(20+l.snr*1.8).toFixed(1)} Mbps</td>
                        <td className="t-mono">{(18+l.snr*1.4).toFixed(1)} Mbps</td>
                        <td className="t-mono">{l.q==='err'?'12.4%':l.q==='warn'?'3.1%':'0.4%'}</td>
                        <td>{l.q==='ok'?<Chip tone="ok">stable</Chip>:l.q==='warn'?<Chip tone="warn">watch</Chip>:<Chip tone="err">degrading</Chip>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side */}
          <div className="vstack gap-3">
            <div className="panel">
              <PanelHead title="Identity"/>
              <div className="vstack" style={{ padding:'10px 14px', gap:8 }}>
                {[
                  ['Callsign', r.cs, true],
                  ['MAC', r.mac, true],
                  ['IPv4', r.ip, true],
                  ['Form factor', r.formName],
                  ['Firmware', r.fw, true],
                  ['Agent', 'fleet-agent 0.9.4', true],
                  ['Enrolled', '2026-02-14', true],
                  ['Cert expires', '2027-02-14', true],
                ].map(([k,v,mono])=>(
                  <div key={k} className="hstack" style={{ justifyContent:'space-between', gap:12 }}>
                    <span className="t-micro" style={{ color:'var(--ink-3)' }}>{k}</span>
                    <span className={mono?'t-mono':''} style={{ fontSize:11.5, color:'var(--ink-0)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <PanelHead title="Config" right={r.cfg==='drift' ? <Chip tone="warn">drift</Chip> : <Chip tone="ok">in-sync</Chip>}/>
              <div className="vstack" style={{ padding:'10px 14px', gap:8 }}>
                <div className="hstack" style={{ justifyContent:'space-between' }}>
                  <span className="t-micro" style={{ color:'var(--ink-3)' }}>Template</span>
                  <span style={{ fontSize:11.5 }}>alpha-default-v7</span>
                </div>
                <div className="hstack" style={{ justifyContent:'space-between' }}>
                  <span className="t-micro" style={{ color:'var(--ink-3)' }}>Channel</span>
                  <span className="t-mono" style={{ fontSize:11 }}>36 · 80 MHz</span>
                </div>
                <div className="hstack" style={{ justifyContent:'space-between' }}>
                  <span className="t-micro" style={{ color:'var(--ink-3)' }}>Mesh ID</span>
                  <span className="t-mono" style={{ fontSize:11 }}>acme-alpha-01</span>
                </div>
                <div className="hstack" style={{ justifyContent:'space-between' }}>
                  <span className="t-micro" style={{ color:'var(--ink-3)' }}>Sense profile</span>
                  <span style={{ fontSize:11.5 }}>Tactical v2</span>
                </div>
                <div className="hstack" style={{ justifyContent:'space-between' }}>
                  <span className="t-micro" style={{ color:'var(--ink-3)' }}>Last apply</span>
                  <span className="t-mono" style={{ fontSize:11, color:'var(--ink-2)' }}>12:42 UTC</span>
                </div>
              </div>
            </div>

            <div className="panel">
              <PanelHead title="Location" subtitle="GPS · ±3m"/>
              <div style={{ position:'relative', height:140, background:'var(--bg-1)', borderRadius:0, overflow:'hidden' }} className="topo-bg">
                <div className="topo-grid"/>
                <div style={{ position:'absolute', left:'42%', top:'48%', width:10, height:10, borderRadius:'50%', background:'var(--amber)', boxShadow:'0 0 16px var(--amber)', transform:'translate(-50%,-50%)' }}/>
                <div style={{ position:'absolute', left:'42%', top:'48%', width:50, height:50, borderRadius:'50%', border:'1px solid var(--amber-line)', transform:'translate(-50%,-50%)' }}/>
              </div>
              <div className="hstack" style={{ padding:'8px 14px', justifyContent:'space-between', borderTop:'1px solid var(--line)' }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>Coord</span>
                <span className="t-mono" style={{ fontSize:10.5 }}>34.1219° N · 117.3051° W</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ OTA CAMPAIGNS ============
function OTAView() {
  const [sel, setSel] = useState('01');
  const camp = OTA.find(o => o.id===sel) || OTA[0];
  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      <div className="hstack" style={{ padding:'18px 20px 10px', gap:14, flexWrap:'nowrap' }}>
        <div className="vstack" style={{ gap:3 }}>
          <div className="hstack gap-2"><h1 style={{ fontSize:18, fontWeight:500, whiteSpace:"nowrap" }}>OTA Campaigns</h1><Chip tone="amber">{OTA.length} total</Chip></div>
          <div className="t-micro" style={{ color:'var(--ink-3)' }}>Delta updates · signed artifacts · A/B slot · auto rollback on health failure</div>
        </div>
        <div className="flex1"/>
        <button className="btn btn-ghost"><I.download size={12}/>Firmware library</button>
        <button className="btn btn-primary"><I.plus size={12}/>New campaign</button>
      </div>

      <div className="flex1 hstack" style={{ padding:'0 20px 20px', gap:14, minHeight:0 }}>
        {/* Campaign list */}
        <div className="panel vstack" style={{ width:420, minHeight:0 }}>
          <PanelHead title="Campaigns" right={<Chip tone="ok">{OTA.filter(o=>o.status==='active').length} active</Chip>}/>
          <div style={{ overflow:'auto', flex:1, minHeight:0 }}>
            {OTA.map(o => {
              const tone = o.status==='active'?'ok':o.status==='scheduled'?'info':o.status==='paused'?'warn':o.status==='done'?'neutral':'neutral';
              const pct = (o.done/o.total)*100;
              const isSel = o.id === sel;
              return (
                <button key={o.id} onClick={()=>setSel(o.id)} className="vstack" style={{
                  padding:'12px 14px', borderBottom:'1px solid var(--line-faint)',
                  background: isSel ? 'rgba(244,164,23,0.06)' : 'transparent',
                  borderLeft: isSel ? '2px solid var(--amber)' : '2px solid transparent',
                  textAlign:'left', gap:8, width:'100%',
                }}>
                  <div className="hstack" style={{ justifyContent:'space-between', width:'100%' }}>
                    <div className="hstack gap-2">
                      <Chip tone={tone}>{o.status.toUpperCase()}</Chip>
                      <span className="t-mono" style={{ fontSize:10.5, color:'var(--ink-2)' }}>#{o.id}</span>
                    </div>
                    <span className="t-mono" style={{ fontSize:10.5, color:'var(--ink-3)' }}>{o.fw}</span>
                  </div>
                  <div style={{ fontSize:12, fontWeight:500, width:'100%' }}>{o.name}</div>
                  <div className="hstack gap-2" style={{ width:'100%' }}>
                    <Progress value={o.done} max={o.total} tone={o.failed>0?'warn':'amber'}/>
                    <span className="t-mono" style={{ fontSize:10.5, color:'var(--ink-2)', minWidth:72, textAlign:'right' }}>{o.done}/{o.total}{o.failed>0?` · ${o.failed}✕`:''}</span>
                  </div>
                  <div className="hstack" style={{ justifyContent:'space-between', width:'100%' }}>
                    <span className="t-micro" style={{ color:'var(--ink-3)' }}>{o.owner}</span>
                    <span className="t-mono" style={{ fontSize:10.5, color:'var(--ink-3)' }}>{o.when}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="panel flex1 vstack" style={{ minHeight:0 }}>
          <PanelHead
            title={camp.name}
            subtitle={`${camp.fw} · ${camp.status.toUpperCase()} · owner ${camp.owner}`}
            right={<>
              <button className="btn btn-ghost btn-sm"><I.pause size={11}/>Pause</button>
              <button className="btn btn-ghost btn-sm"><I.refresh size={11}/>Retry failed</button>
              <button className="btn btn-ghost btn-sm"><I.download size={11}/>Export</button>
            </>}
          />
          {/* Stage bar */}
          <div className="hstack" style={{ padding:'14px 18px', gap:10, borderBottom:'1px solid var(--line)' }}>
            {['Canary 10%','Stage 25%','Stage 50%','Full rollout'].map((s,i)=>{
              const done = i < 2;
              const current = i === 2;
              return (
                <div key={i} className="hstack gap-2 flex1" style={{
                  padding:'10px 12px', background: done?'var(--ok-soft)':current?'rgba(244,164,23,0.08)':'var(--bg-3)',
                  border: `1px solid ${done?'rgba(61,220,151,0.3)':current?'var(--amber-line)':'var(--line)'}`,
                  borderRadius:4
                }}>
                  <div style={{
                    width:22, height:22, borderRadius:'50%',
                    background: done?'var(--ok)':current?'var(--amber)':'var(--bg-3)',
                    color: done||current?'#0b0f16':'var(--ink-2)',
                    display:'grid', placeItems:'center', fontSize:10.5, fontWeight:600,
                    border: `1px solid ${done?'var(--ok)':current?'var(--amber)':'var(--line-strong)'}`,
                  }}>{done?'✓':i+1}</div>
                  <div className="vstack" style={{ gap:1 }}>
                    <div style={{ fontSize:11.5, fontWeight:500 }}>{s}</div>
                    <div className="t-micro" style={{ color:'var(--ink-3)' }}>
                      {done?'Complete':current?'In progress · 18 min':'Queued'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Per-radio table */}
          <div style={{ flex:1, overflow:'auto', minHeight:0 }}>
            <table className="data">
              <thead>
                <tr>
                  <th></th><th>Radio</th><th>Site</th><th>Stage</th><th>Progress</th><th>Started</th><th>Finished</th><th>Result</th>
                </tr>
              </thead>
              <tbody>
                {RADIOS.slice(0,18).map((r,i)=>{
                  const done = i < 10;
                  const failed = i === 11;
                  const inProg = !done && !failed;
                  const stage = i < 3 ? 'Canary 10%' : i < 8 ? 'Stage 25%' : 'Stage 50%';
                  const prog = done?100:failed?62:(20 + (i*8)%70);
                  return (
                    <tr key={r.id}>
                      <td><Dot state={done?'ok':failed?'err':'warn'}/></td>
                      <td className="t-mono" style={{ fontWeight:500 }}>{r.cs}</td>
                      <td>{r.siteName.split(' · ')[0]}</td>
                      <td><Chip>{stage}</Chip></td>
                      <td>
                        <div className="hstack gap-2" style={{ width:180 }}>
                          <Progress value={prog} tone={done?'ok':failed?'err':'amber'}/>
                          <span className="t-mono" style={{ fontSize:10.5, color:'var(--ink-2)' }}>{prog}%</span>
                        </div>
                      </td>
                      <td className="t-mono" style={{ fontSize:11, color:'var(--ink-2)' }}>09:{14+i}</td>
                      <td className="t-mono" style={{ fontSize:11, color:'var(--ink-2)' }}>{done?`09:${22+i}`:'—'}</td>
                      <td>{done?<Chip tone="ok">installed</Chip>:failed?<Chip tone="err">rollback</Chip>:<Chip tone="warn">flashing…</Chip>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ SPECTRUM ============
function SpectrumView() {
  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      <div className="hstack" style={{ padding:'18px 20px 10px', gap:14, flexWrap:'nowrap' }}>
        <div className="vstack" style={{ gap:3 }}>
          <div className="hstack gap-2"><h1 style={{ fontSize:18, fontWeight:500, whiteSpace:"nowrap" }}>Spectrum Intelligence</h1><Chip tone="cyan"><Dot state="ok" size={5}/> SENSE v2</Chip></div>
          <div className="t-micro" style={{ color:'var(--ink-3)' }}>Aggregate Sense band-scan across 247 radios · 2412–2484 MHz</div>
        </div>
        <div className="flex1"/>
        <Seg value="24h" onChange={()=>{}} items={[{value:'1h',label:'1H'},{value:'6h',label:'6H'},{value:'24h',label:'24H'},{value:'7d',label:'7D'}]}/>
        <button className="btn btn-ghost"><I.download size={12}/>Export PCAP</button>
      </div>

      <div className="flex1" style={{ padding:'0 20px 20px', overflow:'auto', minHeight:0 }}>
        {/* Spectrum waterfall */}
        <div className="panel" style={{ marginBottom:14 }}>
          <PanelHead title="Band occupancy · 2.4 GHz ISM"
            subtitle="Noise floor average · peaks indicate active carriers or jammers"
            right={<>
              <Chip tone="err">2 jammers detected</Chip>
              <Chip tone="warn">Ch 6 congested</Chip>
            </>}/>
          <div style={{ padding:'18px 20px', position:'relative' }}>
            {/* Spectrum chart */}
            <div style={{ position:'relative', height:220 }}>
              <svg viewBox="0 0 860 220" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                <defs>
                  <linearGradient id="specGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f4a417" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#f4a417" stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                {/* grid */}
                {[0,0.25,0.5,0.75,1].map((y,i)=>(
                  <g key={i}>
                    <line x1="0" x2="860" y1={y*220} y2={y*220} stroke="var(--line-faint)" strokeWidth="1"/>
                    <text x="4" y={y*220-3} fill="var(--ink-3)" fontSize="9" fontFamily="var(--font-mono)">{-40 - i*15} dBm</text>
                  </g>
                ))}
                {(() => {
                  const max = Math.max(...SPECTRUM.map(p=>p.v));
                  const min = -100;
                  const pts = SPECTRUM.map((p,i)=>[
                    (i/(SPECTRUM.length-1))*860,
                    220 - ((p.v - min)/(max - min))*200 - 10
                  ]);
                  const dd = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
                  const fillD = dd + ` L 860 220 L 0 220 Z`;
                  return (<>
                    <path d={fillD} fill="url(#specGrad)"/>
                    <path d={dd} fill="none" stroke="#f4a417" strokeWidth="1.3"/>
                  </>);
                })()}
                {/* Channel markers */}
                {[1,6,11].map(ch => {
                  const f = 2412 + (ch-1)*5;
                  const x = ((f-2400)/(2485-2400))*860;
                  return (
                    <g key={ch}>
                      <line x1={x} x2={x} y1="0" y2="220" stroke="var(--cyan)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4"/>
                      <text x={x+3} y="12" fill="var(--cyan)" fontSize="10" fontFamily="var(--font-mono)">ch {ch}</text>
                    </g>
                  );
                })}
                {/* Jammer markers */}
                <g>
                  <circle cx="130" cy="40" r="5" fill="none" stroke="var(--err)" strokeWidth="1.5"/>
                  <text x="140" y="44" fill="var(--err)" fontSize="9" fontFamily="var(--font-mono)">JAMMER · 2412</text>
                </g>
                <g>
                  <circle cx="620" cy="60" r="5" fill="none" stroke="var(--err)" strokeWidth="1.5"/>
                  <text x="630" y="64" fill="var(--err)" fontSize="9" fontFamily="var(--font-mono)">JAMMER · 2462</text>
                </g>
              </svg>
            </div>
            <div className="hstack" style={{ justifyContent:'space-between', marginTop:6 }}>
              {[2400,2412,2437,2462,2484].map(f=>(
                <span key={f} className="t-mono" style={{ fontSize:10, color:'var(--ink-3)' }}>{f} MHz</span>
              ))}
            </div>
          </div>
        </div>

        {/* Waterfall + channels */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:14 }}>
          <div className="panel">
            <PanelHead title="Waterfall · last 60 minutes" subtitle="Noise floor evolution across band"/>
            <div style={{ padding:14 }}>
              <div style={{
                height:280, position:'relative', overflow:'hidden', borderRadius:4,
                background:'linear-gradient(180deg, #050810, #0b0f16)',
              }}>
                <svg viewBox="0 0 860 280" preserveAspectRatio="none" style={{ width:'100%', height:'100%' }}>
                  {Array.from({length:60}).map((_,row)=>{
                    return SPECTRUM.map((p,i)=>{
                      const v = p.v + (Math.sin((row*0.3 + i*0.2)) * 6);
                      const intensity = Math.max(0, Math.min(1, (v + 95) / 50));
                      const color = intensity > 0.7 ? '#ff5470' : intensity > 0.5 ? '#f4a417' : intensity > 0.3 ? '#3ddc97' : '#1a2b4a';
                      return <rect key={row+'-'+i} x={(i/(SPECTRUM.length-1))*860} y={row*(280/60)} width={860/SPECTRUM.length+1} height={280/60+1} fill={color} opacity={intensity*0.9}/>;
                    });
                  })}
                </svg>
              </div>
              <div className="hstack" style={{ justifyContent:'space-between', marginTop:6 }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>−95 dBm</span>
                <div className="hstack gap-2">
                  <div style={{ width:120, height:10, background:'linear-gradient(90deg, #1a2b4a, #3ddc97, #f4a417, #ff5470)', borderRadius:2 }}/>
                </div>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>−40 dBm</span>
              </div>
            </div>
          </div>

          <div className="vstack gap-3">
            <div className="panel">
              <PanelHead title="Channel utilization"/>
              <div className="vstack" style={{ padding:'10px 14px', gap:10 }}>
                {[{ch:1,use:78,tone:'err'},{ch:6,use:62,tone:'warn'},{ch:11,use:24,tone:'ok'},{ch:36,use:12,tone:'ok'},{ch:149,use:8,tone:'ok'}].map(c=>(
                  <div key={c.ch} className="hstack gap-3">
                    <span className="t-mono" style={{ fontSize:11.5, minWidth:36 }}>ch {c.ch}</span>
                    <div className="flex1"><Progress value={c.use} tone={c.tone}/></div>
                    <span className="t-mono" style={{ fontSize:11, color:'var(--ink-2)', minWidth:36, textAlign:'right' }}>{c.use}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel">
              <PanelHead title="Detected events" right={<Chip tone="err">5</Chip>}/>
              <div className="vstack" style={{ fontSize:11.5 }}>
                {[
                  { t:'err', f:'2412 MHz', desc:'CW jammer · 8 min', site:'Bravo'},
                  { t:'err', f:'2462 MHz', desc:'Sweep jammer', site:'Charlie'},
                  { t:'warn',f:'2437 MHz', desc:'Wi-Fi AP · ch 6 beacon', site:'Alpha'},
                  { t:'warn',f:'2422 MHz', desc:'Bluetooth FHSS burst', site:'Alpha'},
                  { t:'info',f:'5180 MHz', desc:'Ch 36 clear · migrated', site:'Delta'},
                ].map((e,i)=>(
                  <div key={i} className="vstack" style={{ padding:'9px 14px', borderBottom:'1px solid var(--line-faint)', gap:3 }}>
                    <div className="hstack gap-2">
                      <Dot state={e.t==='err'?'err':e.t==='warn'?'warn':'ok'} size={5}/>
                      <span className="t-mono" style={{ fontSize:11, color:e.t==='err'?'var(--err)':e.t==='warn'?'var(--warn)':'var(--info)' }}>{e.f}</span>
                      <span className="t-micro" style={{ color:'var(--ink-3)' }}>· {e.site}</span>
                    </div>
                    <span style={{ color:'var(--ink-1)' }}>{e.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ALERTS ============
function AlertsView() {
  const [sel, setSel] = useState(0);
  const a = ALERTS[sel];
  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      <div className="hstack" style={{ padding:'18px 20px 10px', gap:14, flexWrap:'nowrap' }}>
        <div className="vstack" style={{ gap:3 }}>
          <div className="hstack gap-2"><h1 style={{ fontSize:18, fontWeight:500, whiteSpace:"nowrap" }}>Alerts</h1><Chip tone="err">4 critical</Chip><Chip tone="warn">3 warning</Chip></div>
          <div className="t-micro" style={{ color:'var(--ink-3)' }}>Real-time · routed via Slack · Teams · webhook · email</div>
        </div>
        <div className="flex1"/>
        <button className="btn btn-ghost"><I.filter size={12}/>All severities</button>
        <button className="btn btn-ghost"><I.settings size={12}/>Rules</button>
        <button className="btn btn-primary"><I.check size={12}/>Acknowledge all</button>
      </div>

      <div className="flex1 hstack" style={{ padding:'0 20px 20px', gap:14, minHeight:0 }}>
        <div className="panel flex1 vstack" style={{ minHeight:0 }}>
          <PanelHead title="Alert timeline"/>
          <div style={{ overflow:'auto', flex:1, minHeight:0 }}>
            {ALERTS.map((al,i)=>(
              <button key={i} onClick={()=>setSel(i)} className="hstack" style={{
                padding:'12px 16px', borderBottom:'1px solid var(--line-faint)',
                width:'100%', textAlign:'left', gap:12,
                background: i===sel ? 'rgba(244,164,23,0.06)' : 'transparent',
                borderLeft: i===sel ? '2px solid var(--amber)' : '2px solid transparent',
              }}>
                <Dot state={al.sev==='err'?'err':al.sev==='warn'?'warn':'ok'}/>
                <div className="vstack flex1" style={{ gap:4, minWidth:0 }}>
                  <div className="hstack gap-2">
                    <span className="t-micro" style={{ color:al.sev==='err'?'var(--err)':al.sev==='warn'?'var(--warn)':'var(--info)' }}>{al.sev.toUpperCase()}</span>
                    <span className="t-micro" style={{ color:'var(--ink-3)' }}>· {al.site} · {al.t}</span>
                  </div>
                  <div style={{ fontSize:12.5, fontWeight:500 }}>{al.title}</div>
                  <div style={{ fontSize:11.5, color:'var(--ink-2)' }}>{al.desc}</div>
                </div>
                <I.chevR size={13} style={{ color:'var(--ink-3)' }}/>
              </button>
            ))}
          </div>
        </div>

        <div className="panel vstack" style={{ width:380, minHeight:0 }}>
          <PanelHead title="Alert detail" right={<Chip tone={a.sev==='err'?'err':a.sev==='warn'?'warn':'info'}>{a.sev.toUpperCase()}</Chip>}/>
          <div style={{ overflow:'auto', flex:1, minHeight:0 }}>
            <div className="vstack" style={{ padding:'14px 16px', gap:12 }}>
              <div style={{ fontSize:14, fontWeight:500, lineHeight:1.35 }}>{a.title}</div>
              <div style={{ fontSize:12, color:'var(--ink-1)', lineHeight:1.5 }}>{a.desc}</div>
              <Hairline/>
              <div className="vstack" style={{ gap:8 }}>
                {[
                  ['Triggered', '12:44:18 UTC · 2m ago'],
                  ['Rule', 'link-degradation-v2'],
                  ['Site', a.site],
                  ['Scope', 'MR-008-C · MR-017-C'],
                  ['Predicted', 'Outage in ~12 min'],
                  ['Model', 'forecast-v1 · confidence 0.82'],
                ].map(([k,v])=>(
                  <div key={k} className="hstack" style={{ justifyContent:'space-between' }}>
                    <span className="t-micro" style={{ color:'var(--ink-3)' }}>{k}</span>
                    <span style={{ fontSize:11.5 }}>{v}</span>
                  </div>
                ))}
              </div>
              <Hairline/>
              <div className="t-label">Suggested action</div>
              <div style={{ fontSize:11.5, color:'var(--ink-1)', padding:'10px 12px', background:'var(--bg-3)', border:'1px solid var(--amber-line)', borderRadius:4 }}>
                Increase Tx power on MR-008-C to 30 dBm or failover MR-017-C to mesh parent MR-019-A to regain SNR margin.
              </div>
              <div className="hstack gap-2">
                <button className="btn btn-primary flex1"><I.check size={12}/>Apply fix</button>
                <button className="btn btn-ghost"><I.x size={12}/>Snooze</button>
              </div>
              <Hairline/>
              <div className="t-label">Related telemetry</div>
              <Spark data={series(44, 14, 7)} width={330} height={60} stroke="var(--err)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ AUDIT ============
function AuditView() {
  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      <div className="hstack" style={{ padding:'18px 20px 10px', gap:14, flexWrap:'nowrap' }}>
        <div className="vstack" style={{ gap:3 }}>
          <div className="hstack gap-2"><h1 style={{ fontSize:18, fontWeight:500, whiteSpace:"nowrap" }}>Audit Log</h1><Chip>Append-only · SOC 2</Chip></div>
          <div className="t-micro" style={{ color:'var(--ink-3)' }}>Every write · operator ID · IP · before/after diff · exportable</div>
        </div>
        <div className="flex1"/>
        <div className="hstack gap-2" style={{ padding:'5px 10px', border:'1px solid var(--line)', borderRadius:5, background:'var(--bg-2)' }}>
          <I.search size={12} style={{ color:'var(--ink-2)' }}/>
          <input placeholder="Filter by user, action, object…" style={{ flex:1, background:'transparent', border:0, outline:0, fontSize:12, color:'var(--ink-0)', width:260 }}/>
        </div>
        <button className="btn btn-ghost"><I.download size={12}/>Export CSV</button>
      </div>

      <div className="flex1" style={{ padding:'0 20px 20px', minHeight:0 }}>
        <div className="panel vstack" style={{ height:'100%', minHeight:0 }}>
          <PanelHead title="Events · last 24 h" right={<Chip tone="cyan">247 events</Chip>}/>
          <div style={{ overflow:'auto', flex:1, minHeight:0 }}>
            <table className="data">
              <thead><tr><th style={{ width:92 }}>Time</th><th>Operator</th><th>Action</th><th>Object</th><th>Source IP</th><th style={{ width:24 }}></th></tr></thead>
              <tbody>
                {[...AUDIT, ...AUDIT, ...AUDIT].map((a,i)=>(
                  <tr key={i}>
                    <td className="t-mono" style={{ fontSize:11, color:'var(--ink-2)' }}>{a.t}</td>
                    <td className="hstack gap-2">
                      <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--bg-3)', border:'1px solid var(--line)', fontSize:9, fontWeight:600, display:'grid', placeItems:'center', color:'var(--amber)' }}>
                        {a.who === 'system' ? 'SY' : a.who.slice(0,2).toUpperCase()}
                      </div>
                      <span className="t-mono" style={{ fontSize:11.5 }}>{a.who}</span>
                    </td>
                    <td><Chip tone={a.act.startsWith('OTA')?'amber':a.act.startsWith('Config')?'info':a.act.startsWith('Alert')?'err':a.act.startsWith('Agent')?'cyan':'neutral'}>{a.act}</Chip></td>
                    <td style={{ color:'var(--ink-1)' }}>{a.obj}</td>
                    <td className="t-mono" style={{ fontSize:11, color:'var(--ink-2)' }}>{a.ip}</td>
                    <td><I.chevR size={13} style={{ color:'var(--ink-3)' }}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ ACCESS (Tenants / RBAC) ============
function AccessView() {
  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      <div className="hstack" style={{ padding:'18px 20px 10px', gap:14, flexWrap:'nowrap' }}>
        <div className="vstack" style={{ gap:3 }}>
          <div className="hstack gap-2"><h1 style={{ fontSize:18, fontWeight:500, whiteSpace:"nowrap" }}>Access & Security</h1><Chip tone="ok"><I.shield size={10}/> SOC 2 · 98%</Chip></div>
          <div className="t-micro" style={{ color:'var(--ink-3)' }}>Tenants · RBAC · mTLS certs · OIDC federation · WebAuthn MFA</div>
        </div>
        <div className="flex1"/>
        <button className="btn btn-primary"><I.plus size={12}/>Invite operator</button>
      </div>

      <div className="flex1" style={{ padding:'0 20px 20px', overflow:'auto', minHeight:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div className="panel">
            <PanelHead title="Tenants" subtitle="3 active · multi-tenant RLS enforced"/>
            <table className="data">
              <thead><tr><th>Tenant</th><th>Type</th><th>Radios</th><th>Operators</th><th>Isolation</th></tr></thead>
              <tbody>
                {TENANTS.map(t=>(
                  <tr key={t.id}>
                    <td><div className="hstack gap-2"><I.building size={13} style={{ color:'var(--amber)' }}/><span style={{ fontWeight:500 }}>{t.name}</span></div></td>
                    <td>{t.role}</td>
                    <td className="t-mono">{t.radios}</td>
                    <td className="t-mono">{3+(t.radios%5)}</td>
                    <td><Chip tone="ok"><I.lock size={9}/> RLS · ACL</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <PanelHead title="Operators · Acme Industrial" subtitle="12 members"/>
            <table className="data">
              <thead><tr><th>Operator</th><th>Role</th><th>Scope</th><th>MFA</th><th>Last</th></tr></thead>
              <tbody>
                {[
                  { n:'Jabbir Parlapati', e:'j.parlapati@doodle', r:'Tenant Admin', s:'All sites', mfa:'WebAuthn', t:'now' },
                  { n:'Sei Tamura',       e:'s.tamura@acme',     r:'Site Operator', s:'Alpha · Bravo', mfa:'WebAuthn', t:'3m' },
                  { n:'Maria Ibrahim',    e:'m.ibrahim@acme',    r:'Site Operator', s:'Charlie',        mfa:'TOTP',     t:'12m' },
                  { n:'Umar Tran',        e:'u.tran@acme.co',    r:'Read Only',     s:'All sites',      mfa:'TOTP',     t:'2h' },
                  { n:'Sec Ops Bot',      e:'secops@acme.co',    r:'Automation',    s:'All sites',      mfa:'mTLS',     t:'32s' },
                ].map((o,i)=>(
                  <tr key={i}>
                    <td>
                      <div className="hstack gap-2">
                        <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--bg-3)', border:'1px solid var(--line)', fontSize:10, fontWeight:600, display:'grid', placeItems:'center', color:'var(--amber)' }}>{o.n.split(' ').map(x=>x[0]).slice(0,2).join('')}</div>
                        <div className="vstack" style={{ gap:0 }}>
                          <span style={{ fontSize:11.5, fontWeight:500 }}>{o.n}</span>
                          <span className="t-micro" style={{ color:'var(--ink-3)' }}>{o.e}</span>
                        </div>
                      </div>
                    </td>
                    <td><Chip tone={o.r==='Tenant Admin'?'amber':o.r==='Read Only'?'neutral':o.r==='Automation'?'cyan':'info'}>{o.r}</Chip></td>
                    <td style={{ fontSize:11, color:'var(--ink-1)' }}>{o.s}</td>
                    <td><Chip tone="ok"><I.key size={9}/> {o.mfa}</Chip></td>
                    <td className="t-mono" style={{ fontSize:11, color:'var(--ink-2)' }}>{o.t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <PanelHead title="Certificate Authority" subtitle="Per-tenant intermediate · X.509 · mTLS"/>
            <div className="vstack" style={{ padding:'14px 16px', gap:12 }}>
              <div className="hstack" style={{ justifyContent:'space-between' }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>Root CA</span>
                <span className="t-mono" style={{ fontSize:11 }}>DoodleLabs-Root-G2</span>
              </div>
              <div className="hstack" style={{ justifyContent:'space-between' }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>Tenant intermediate</span>
                <span className="t-mono" style={{ fontSize:11 }}>acme-int-2026-02</span>
              </div>
              <div className="hstack" style={{ justifyContent:'space-between' }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>Expires</span>
                <span className="t-mono" style={{ fontSize:11, color:'var(--ok)' }}>2027-02-14 · 303 days</span>
              </div>
              <div className="hstack" style={{ justifyContent:'space-between' }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>Issued certs</span>
                <span className="t-mono" style={{ fontSize:11 }}>247 / 247 radios</span>
              </div>
              <div className="hstack" style={{ justifyContent:'space-between' }}>
                <span className="t-micro" style={{ color:'var(--ink-3)' }}>Revoked (CRL)</span>
                <span className="t-mono" style={{ fontSize:11 }}>2</span>
              </div>
              <Hairline/>
              <div className="hstack gap-2">
                <button className="btn btn-ghost flex1"><I.refresh size={11}/>Rotate</button>
                <button className="btn btn-ghost flex1"><I.download size={11}/>Export CRL</button>
              </div>
            </div>
          </div>

          <div className="panel">
            <PanelHead title="Compliance posture" subtitle="Continuous control evidence"/>
            <div className="vstack" style={{ padding:'14px 16px', gap:10 }}>
              {[
                { k:'SOC 2 Type I controls',    v:98, tone:'ok' },
                { k:'SLSA Level 3 build provenance', v:100, tone:'ok' },
                { k:'CVE SLA (critical ≤14 d)', v:100, tone:'ok' },
                { k:'mTLS coverage (radios)',   v:100, tone:'ok' },
                { k:'MFA coverage (operators)', v:92,  tone:'warn' },
                { k:'FIPS 140-3 (deferred Y2)', v:0,   tone:'neutral' },
              ].map(c=>(
                <div key={c.k} className="hstack gap-3">
                  <span style={{ fontSize:11.5, flex:1 }}>{c.k}</span>
                  <div style={{ width:140 }}><Progress value={c.v} tone={c.tone}/></div>
                  <span className="t-mono" style={{ fontSize:11, color:'var(--ink-2)', minWidth:32, textAlign:'right' }}>{c.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ TOPOLOGY (FULL-SCREEN VARIANT) ============
function TopologyView({ onOpenRadio }) {
  return (
    <div className="vstack flex1" style={{ minHeight:0, overflow:'hidden' }}>
      <div className="hstack" style={{ padding:'18px 20px 10px', gap:14, flexWrap:'nowrap' }}>
        <div className="vstack" style={{ gap:3 }}>
          <div className="hstack gap-2"><h1 style={{ fontSize:18, fontWeight:500, whiteSpace:"nowrap" }}>Topology</h1><Chip tone="cyan"><Dot state="ok" size={5}/>LIVE · MQTT v5</Chip></div>
          <div className="t-micro" style={{ color:'var(--ink-3)' }}>MapLibre GL · 500-node envelope · link-quality shaded · batman-adv neighbor graph</div>
        </div>
        <div className="flex1"/>
        <Seg value="link" onChange={()=>{}} items={[{value:'link',label:'Link SNR'},{value:'freq',label:'Band'},{value:'fw',label:'Firmware'},{value:'load',label:'Load'}]}/>
        <button className="btn btn-ghost"><I.layers size={12}/>Layers</button>
        <button className="btn btn-ghost"><I.download size={12}/>Export</button>
      </div>
      <div className="flex1" style={{ padding:'0 20px 20px', minHeight:0 }}>
        <div className="panel flex1 vstack" style={{ height:'100%', minHeight:0 }}>
          <TopoCanvas onOpenRadio={onOpenRadio}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RadioDetail, OTAView, SpectrumView, AlertsView, AuditView, AccessView, TopologyView });
