export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',system-ui,sans-serif",textAlign:'center',padding:24,background:'#fafafa'}}>
      <div>
        <div style={{fontSize:64,marginBottom:16}}>✂</div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:26,fontWeight:700,marginBottom:8}}>CoiffPro</h1>
        <p style={{fontSize:15,color:'#666',marginBottom:6}}>Vous êtes hors ligne</p>
        <p style={{fontSize:13,color:'#aaa',marginBottom:24}}>Reconnectez-vous pour accéder à votre dashboard.</p>
        <button onClick={()=>window.location.reload()} style={{background:'#1a1a1a',color:'#fff',border:'none',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          Réessayer
        </button>
      </div>
    </div>
  )
}
