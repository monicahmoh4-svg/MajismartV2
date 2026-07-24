import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, MapPin, ShieldCheck, AlertTriangle, Wallet, Plus, Navigation, ChevronRight, Waves, ThumbsUp, ThumbsDown } from 'lucide-react'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useApiData } from '../../hooks/useApiData'
import { Loading, ErrorState } from '../ui/StateViews'

function BigStatusCard({ availability, safety, onReport }) {
  const [reported, setReported] = useState(false)
  const [reporting, setReporting] = useState(false)
  const report = async (isAvailable) => {
    setReporting(true)
    try { await onReport(isAvailable); setReported(true) } catch(_) {}
    finally { setReporting(false) }
  }
  return (
    <div style={{background:`linear-gradient(135deg,${availability.color}18,${availability.color}08)`,border:`2px solid ${availability.color}30`,borderRadius:16,padding:'24px 20px',marginBottom:16}}>
      <div style={{fontSize:32,marginBottom:6}}>{availability.emoji}</div>
      <div style={{fontSize:22,fontWeight:900,color:availability.color,marginBottom:4}}>{availability.label}</div>
      <div style={{fontSize:13,color:'#5f6368',marginBottom:16,lineHeight:1.5}}>{availability.detail}</div>
      <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',background:`${safety.color}15`,borderRadius:99,marginBottom:16}}>
        <ShieldCheck size={14} color={safety.color}/>
        <span style={{fontSize:12,fontWeight:700,color:safety.color}}>Quality: {safety.label}</span>
      </div>
      {!reported ? (
        <div>
          <div style={{fontSize:12,color:'#9aa0a6',marginBottom:8}}>Is water available at your tap right now?</div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>report(true)} disabled={reporting} style={{flex:1,padding:'9px',background:'#e1f5ee',color:'#0d9e75',border:'1.5px solid #0d9e7540',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><ThumbsUp size={14}/> Yes, it's on</button>
            <button onClick={()=>report(false)} disabled={reporting} style={{flex:1,padding:'9px',background:'#fce8e6',color:'#d93025',border:'1.5px solid #d9302540',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><ThumbsDown size={14}/> No, it's off</button>
          </div>
        </div>
      ) : <div style={{fontSize:13,color:'#0d9e75',fontWeight:600}}>✓ Thanks! Your report helps your neighbours.</div>}
    </div>
  )
}

export default function CommunityDashboard() {
  const { user } = useAuth()
  const county = user?.county || 'Nairobi'
  const { data: statusData, loading: statusLoading, error: statusError, refetch: refetchStatus } =
    useApiData(()=>api.get(`/citizen/area-status?county=${encodeURIComponent(county)}`), { pollMs:120000 })
  const { data: points } = useApiData(()=>api.get(`/citizen/water-points?county=${encodeURIComponent(county)}`), { pollMs:120000 })
  const { data: spending } = useApiData(()=>api.get('/citizen/my-spending'))
  const handleReport = async (isAvailable) => {
    await api.post('/citizen/availability-report', { county, is_available: isAvailable })
    refetchStatus()
  }
  const hour = new Date().getHours()
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const best = points?.find(p=>p.status==='active'&&p.water_level>20)||points?.[0]
  const tm = spending?.this_month

  return (
    <div style={{maxWidth:520,margin:'0 auto'}}>
      <div style={{marginBottom:18}}>
        <h1 style={{fontSize:20,fontWeight:800,marginBottom:2}}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <div style={{display:'flex',alignItems:'center',gap:4,fontSize:13,color:'#5f6368'}}><MapPin size={13}/>{county} County</div>
      </div>
      {statusLoading?<Loading rows={2}/>:statusError?<ErrorState message={statusError} onRetry={refetchStatus}/>:
        statusData?<BigStatusCard availability={statusData.availability} safety={statusData.safety} onReport={handleReport}/>:null}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
        {[{to:'/app/find-water',icon:Navigation,label:'Find Water',color:'#1a7fd4',bg:'#e8f4fd'},
          {to:'/app/report',icon:Plus,label:'Report Issue',color:'#d93025',bg:'#fce8e6'},
          {to:'/app/my-water',icon:Wallet,label:'My Spending',color:'#0d9e75',bg:'#e1f5ee'},
          {to:'/app/community',icon:Waves,label:'Area Reports',color:'#7a3fb5',bg:'#f0e8fc'}].map(a=>(
          <Link key={a.to} to={a.to} style={{textDecoration:'none'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,padding:'14px 8px',background:'white',borderRadius:12,border:'1px solid var(--gray-200)'}}>
              <div style={{width:40,height:40,borderRadius:11,background:a.bg,display:'flex',alignItems:'center',justifyContent:'center'}}><a.icon size={19} color={a.color}/></div>
              <span style={{fontSize:11,fontWeight:600,color:'#3c4043',textAlign:'center',lineHeight:1.3}}>{a.label}</span>
            </div>
          </Link>
        ))}
      </div>
      {best && (
        <div className="card fade-in" style={{padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:'#5f6368',textTransform:'uppercase',letterSpacing:.4}}>Nearest Water Point</span>
            <Link to="/app/find-water" style={{fontSize:12,color:'#1a7fd4',display:'flex',alignItems:'center',gap:3}}>See all<ChevronRight size={12}/></Link>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:12,background:'#e8f4fd',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Droplets size={22} color="#1a7fd4"/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{best.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#9aa0a6',marginBottom:6}}><MapPin size={11}/>{best.location||best.county}{best.distance_km&&` · ${best.distance_km} km`}</div>
              <div style={{height:6,background:'#f1f3f4',borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${best.water_level||0}%`,borderRadius:99,background:(best.water_level||0)>50?'#0d9e75':(best.water_level||0)>20?'#e8a020':'#d93025',transition:'width 1s'}}/>
              </div>
              <div style={{fontSize:11,color:best.level_color||'#5f6368',marginTop:3,fontWeight:600}}>{best.level_label}</div>
            </div>
            {best.latitude&&best.longitude&&<a href={`https://maps.google.com/?q=${best.latitude},${best.longitude}`} target="_blank" rel="noreferrer" style={{background:'#1a7fd4',color:'white',padding:'8px 12px',borderRadius:8,fontSize:12,fontWeight:600,textDecoration:'none',flexShrink:0,display:'flex',alignItems:'center',gap:4}}><Navigation size={13}/> Go</a>}
          </div>
        </div>
      )}
      {spending && (
        <div className="card fade-in" style={{padding:16,marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:'#5f6368',textTransform:'uppercase',letterSpacing:.4}}>My Water This Month</span>
            <Link to="/app/my-water" style={{fontSize:12,color:'#1a7fd4',display:'flex',alignItems:'center',gap:3}}>Details<ChevronRight size={12}/></Link>
          </div>
          {!spending.has_data ? (
            <Link to="/app/settings" style={{fontSize:13,color:'#1a7fd4',fontWeight:600}}>Add phone number to track spending →</Link>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              {[{label:'Spent',val:`Ksh ${Number(tm?.total_ksh||0).toLocaleString()}`,color:'#d93025'},{label:'Litres',val:`${Number(tm?.total_litres||0).toLocaleString()}L`,color:'#1a7fd4'},{label:'Cost/L',val:tm?.cost_per_litre?`Ksh ${tm.cost_per_litre}`:'—',color:'#0d9e75'}].map(s=>(
                <div key={s.label} style={{textAlign:'center',padding:'10px 6px',background:'var(--gray-50)',borderRadius:10}}>
                  <div style={{fontSize:17,fontWeight:800,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,color:'#9aa0a6',marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {statusData?.safety && (
        <div className="card fade-in" style={{padding:14,marginBottom:16,background:`${statusData.safety.color}08`,border:`1px solid ${statusData.safety.color}25`}}>
          <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <ShieldCheck size={16} color={statusData.safety.color} style={{flexShrink:0,marginTop:1}}/>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:statusData.safety.color,marginBottom:2}}>Water Quality Advice</div>
              <div style={{fontSize:12,color:'#5f6368',lineHeight:1.5}}>{statusData.safety.advice}</div>
            </div>
          </div>
        </div>
      )}
      {statusData?.alerts?.length>0 && (
        <div className="card fade-in" style={{padding:16,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#5f6368',textTransform:'uppercase',letterSpacing:.4,marginBottom:10}}>⚠ Area Alerts ({statusData.alerts.length})</div>
          {statusData.alerts.map((a,i)=>(
            <div key={i} style={{display:'flex',gap:8,padding:'7px 0',borderBottom:i<statusData.alerts.length-1?'1px solid var(--gray-100)':'none'}}>
              <AlertTriangle size={13} color={a.severity==='critical'?'#d93025':'#e8a020'} style={{marginTop:2,flexShrink:0}}/>
              <div><div style={{fontSize:12,fontWeight:600}}>{a.node_name}</div><div style={{fontSize:11,color:'#5f6368'}}>{a.message}</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
