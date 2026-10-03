import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from '@/components/ui/dialog';
export type User={id:number;username:string;points:number};
let csrfToken='';
export async function request<T=Record<string,unknown>>(path:string,body?:object):Promise<T>{
 const res=await fetch(path,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},body:JSON.stringify(body)});
 const data=await res.json();if(!res.ok)throw new Error(data.error||'Request failed. Try again.');return data;
}
const Context=createContext<{user:User|null;loading:boolean;openAuth:()=>void;setUser:(u:User|null)=>void;logout:()=>Promise<void>}>({user:null,loading:true,openAuth:()=>{},setUser:()=>{},logout:async()=>{}});
export const useAuth=()=>useContext(Context);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[open,setOpen]=useState(false),[mode,setMode]=useState('login');
 const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{request<{user:User|null;csrfToken:string}>('/api/auth/me').then(d=>{setUser(d.user);csrfToken=d.csrfToken;}).catch(()=>setError('Could not reach the server. Refresh to reconnect.')).finally(()=>setLoading(false));},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');try{const d=await request<{user:User;csrfToken:string}>('/api/auth/'+mode,{username,password});setUser(d.user);csrfToken=d.csrfToken;setPassword('');setOpen(false);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function logout(){await request('/api/auth/logout',{});csrfToken='';setUser(null);}
 return <Context.Provider value={{user,loading,openAuth:()=>{setError('');setOpen(true);},setUser,logout}}>{children}<Dialog open={open} onOpenChange={setOpen}><DialogContent className="auth-dialog"><DialogTitle>{mode==='login'?'Welcome back':'Create your practice account'}</DialogTitle><DialogDescription>Save private drafts and progress. Contribute useful questions and earn points.</DialogDescription><div className="auth-switch"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');}}>Sign in</button><button className={mode==='register'?'active':''} onClick={()=>{setMode('register');setError('');}}>Create account</button></div><form onSubmit={submit} className="form-stack"><label>Username<input required autoComplete="username" pattern="[a-zA-Z0-9_]{3,24}" minLength={3} maxLength={24} value={username} onChange={e=>setUsername(e.target.value)}/></label><label>Password<input required type="password" autoComplete={mode==='register'?'new-password':'current-password'} minLength={mode==='register'?10:1} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>{mode==='register'&&<p className="muted-note">Use 3–24 letters, numbers, or underscores for your username and at least 10 characters for your password.</p>}{error&&<p className="form-error" role="alert">{error}</p>}<button disabled={busy} className="primary-action" type="submit">{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</button></form></DialogContent></Dialog></Context.Provider>;
}
