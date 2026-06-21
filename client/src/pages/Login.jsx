import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores';

const loginSchema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const inp = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all placeholder:text-[#a0adb8]";
const lbl = "block text-[11px] font-bold uppercase tracking-wide mb-1.5";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, isLoggedIn, user } = useAuthStore();
  const [serverError, setServerError] = useState('');
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isLoggedIn()) navigate(user?.role==='admin'?'/admin':from, { replace:true });
  }, []); // eslint-disable-line

  const { register, handleSubmit, formState:{ errors } } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      const data = await login(email, password);
      navigate(data.user?.role==='admin' ? '/admin' : from, { replace:true });
    } catch (err) { setServerError(err.message); }
  };

  const loginAs = async (email, password, dest) => {
    setServerError('');
    try { await login(email, password); navigate(dest, { replace:true }); }
    catch (err) { setServerError(err.message); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{background:'var(--bone)'}}>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
          className="bg-white rounded-2xl w-full max-w-md p-8"
          style={{boxShadow:'0 4px 24px rgba(33,40,54,.08)'}}>
        <div className="text-center mb-8">
          <Link to="/" className="flex-shrink-0 ml-5">
          <div className="font-semibold text-[22px] mb-1">
            <span style={{color:'#808080'}}>essentials</span>
            <span style={{color:'var(--teal)'}}>256</span>
            </div>
            </Link>
          <h1 className="text-xl font-semibold" style={{color:'var(--ink)'}}>Welcome back</h1>
          <p className="text-sm mt-1" style={{color:'var(--ink-soft)'}}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={lbl} style={{color:'var(--ink-soft)'}}>Email</label>
            <input {...register('email')} type="email" autoComplete="email"
                   placeholder="jane@example.com"
                   className={inp}
                   style={{border:`1px solid ${errors.email?'#e05252':'var(--border)'}`,color:'var(--ink)'}}
                   onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.boxShadow='0 0 0 3px rgba(30,128,95,.1)'}}
                   onBlur={e=>{e.target.style.borderColor=errors.email?'#e05252':'var(--border)';e.target.style.boxShadow='none'}} />
            {errors.email && <p className="text-xs mt-1" style={{color:'#e05252'}}>{errors.email.message}</p>}
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className={lbl} style={{color:'var(--ink-soft)'}}>Password</label>
              <Link to="/forgot-password" className="text-xs font-medium hover:underline" style={{color:'var(--teal)'}}>Forgot?</Link>
            </div>
            <input {...register('password')} type="password" autoComplete="current-password"
                   placeholder="••••••••"
                   className={inp}
                   style={{border:`1px solid ${errors.password?'#e05252':'var(--border)'}`,color:'var(--ink)'}}
                   onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.boxShadow='0 0 0 3px rgba(30,128,95,.1)'}}
                   onBlur={e=>{e.target.style.borderColor=errors.password?'#e05252':'var(--border)';e.target.style.boxShadow='none'}} />
            {errors.password && <p className="text-xs mt-1" style={{color:'#e05252'}}>{errors.password.message}</p>}
          </div>
          {serverError && (
            <div className="rounded-xl p-3 text-sm" style={{background:'#fef2f2',color:'#e05252',border:'1px solid #fecaca'}}>{serverError}</div>
          )}
          <button type="submit" disabled={loading}
                  className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{background:'var(--teal)'}}
                  onMouseEnter={e=>!loading&&(e.currentTarget.style.background='var(--teal-mid)')}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--teal)'}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Signing in...</span>
              : 'Sign In'}
          </button>
        </form>


        <p className="text-center text-sm" style={{color:'var(--ink-soft)'}}>
          Don't have an account?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{color:'var(--teal)'}}>Create account</Link>
        </p>
      </motion.div>
    </div>
  );
}

const registerSchema = z.object({
  name:            z.string().min(2, 'Enter your full name'),
  email:           z.string().email('Enter a valid email'),
  phone:           z.string().min(9, 'Valid phone required'),
  password:        z.string().min(8,'At least 8 chars').regex(/[A-Z]/,'Need uppercase').regex(/[0-9]/,'Need a number'),
  confirmPassword: z.string(),
}).refine(d=>d.password===d.confirmPassword,{message:"Passwords don't match",path:['confirmPassword']});

export function Register() {
  const navigate = useNavigate();
  const { register: registerUser, loading, isLoggedIn } = useAuthStore();
  const [serverError, setServerError] = useState('');

  useEffect(() => { if (isLoggedIn()) navigate('/', {replace:true}); }, []); // eslint-disable-line

  const { register, handleSubmit, formState:{ errors } } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ name, email, password, phone }) => {
    setServerError('');
    try { await registerUser(name, email, password, phone); navigate('/', {replace:true}); }
    catch (err) { setServerError(err.message); }
  };

  const fields = [
    {name:'name',            label:'Full Name',        type:'text',     ph:'Jane Doe'},
    {name:'email',           label:'Email',            type:'email',    ph:'jane@example.com'},
    {name:'phone',           label:'Phone',            type:'tel',      ph:'+256 700 123 456'},
    {name:'password',        label:'Password',         type:'password', ph:'Min 8 chars, uppercase, number'},
    {name:'confirmPassword', label:'Confirm Password', type:'password', ph:'Repeat password'},
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{background:'var(--bone)'}}>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
          className="bg-white rounded-2xl w-full max-w-md p-8"
          style={{boxShadow:'0 4px 24px rgba(33,40,54,.08)'}}>
        <div className="text-center mb-8">
          <Link to="/" className="flex-shrink-0 ml-5">
          <div className="font-semibold text-[22px] mb-1">
            <span style={{color:'#808080'}}>essentials</span>
            <span style={{color:'var(--teal)'}}>256</span>
            </div>
            </Link>
          <h1 className="text-xl font-semibold" style={{color:'var(--ink)'}}>Create your account</h1>
          <p className="text-sm mt-1" style={{color:'var(--ink-soft)'}}>Join thousands of stylish women</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map(f=>(
            <div key={f.name}>
              <label className={lbl} style={{color:'var(--ink-soft)'}}>{f.label}</label>
              <input {...register(f.name)} type={f.type} placeholder={f.ph}
                     className={inp}
                     style={{border:`1px solid ${errors[f.name]?'#e05252':'var(--border)'}`,color:'var(--ink)'}}
                     onFocus={e=>{e.target.style.borderColor='var(--teal)';e.target.style.boxShadow='0 0 0 3px rgba(30,128,95,.1)'}}
                     onBlur={e=>{e.target.style.borderColor=errors[f.name]?'#e05252':'var(--border)';e.target.style.boxShadow='none'}} />
              {errors[f.name] && <p className="text-xs mt-1" style={{color:'#e05252'}}>{errors[f.name].message}</p>}
            </div>
          ))}
          {serverError && (
            <div className="rounded-xl p-3 text-sm" style={{background:'#fef2f2',color:'#e05252',border:'1px solid #fecaca'}}>{serverError}</div>
          )}
          <button type="submit" disabled={loading}
                  className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{background:'var(--teal)'}}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm mt-6" style={{color:'var(--ink-soft)'}}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{color:'var(--teal)'}}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
