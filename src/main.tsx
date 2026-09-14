import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LockKeyhole, Utensils } from 'lucide-react';
import Journal from '@/app/journal';
import '@/app/globals.css';
function Login({ done }: { done: () => void }) {
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})}); const d=await r.json(); if(!r.ok) throw new Error(d.error); done(); } catch(e) { setError(e instanceof Error?e.message:'تعذّر تسجيل الدخول.'); setBusy(false); } }
  return <main className="login-shell"><section className="login-card" aria-labelledby="login-title"><span className="login-mark"><Utensils size={28}/></span><p className="login-eyebrow">ذائقتي</p><h1 id="login-title">سجّل دخولك</h1><p className="login-copy">ادخل لدفتر مطاعمك وتقييماتك المحفوظة.</p><form onSubmit={submit} className="login-form"><label><span>اسم المستخدم</span><input required autoComplete="username" autoCapitalize="none" value={username} onChange={e=>setUsername(e.target.value)}/></label><label><span>كلمة المرور</span><input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p className="login-error" role="alert">{error}</p>}<button className="primary-button login-submit" disabled={busy}><LockKeyhole size={18}/>{busy?'جارٍ تسجيل الدخول…':'تسجيل الدخول'}</button></form></section></main>
}
function Root() { const [ready,setReady]=useState(false),[signed,setSigned]=useState(false); useEffect(()=>{fetch('/api/auth/me').then(r=>setSigned(r.ok)).finally(()=>setReady(true))},[]); if(!ready)return <main className="login-shell"/>; return signed?<Journal/>:<Login done={()=>setSigned(true)}/>; }
createRoot(document.getElementById('root')!).render(<StrictMode><Root/></StrictMode>);
