import { useState, FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wrench } from 'lucide-react';

export default function LoginPage() {
  const { user, login, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        navigate('/', { replace: true });
      } else {
        await resetPassword(email.trim());
        setInfo('Password reset email sent. Check your inbox.');
        setMode('login');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Invalid email or password.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Unable to sign in. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-zinc-950 mb-4">
            <Wrench className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">A.J Motorbike Spares</h1>
          <p className="text-zinc-400 text-sm mt-1">& Accessories</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-1">{mode === 'login' ? 'Sign in' : 'Reset password'}</h2>
          <p className="text-sm text-zinc-400 mb-6">{mode === 'login' ? 'Enter your credentials to access the system' : 'We will send a reset link to your email'}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="you@example.com" />
            </div>
            {mode === 'login' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
                <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="••••••••" />
              </div>
            )}
            {error && <div className="rounded-lg bg-red-950/50 border border-red-900 px-3 py-2 text-sm text-red-300">{error}</div>}
            {info && <div className="rounded-lg bg-emerald-950/50 border border-emerald-900 px-3 py-2 text-sm text-emerald-300">{info}</div>}
            <button type="submit" disabled={submitting}
              className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-semibold py-2.5 transition-colors">
              {submitting ? (mode === 'login' ? 'Signing in…' : 'Sending…') : mode === 'login' ? 'Sign in' : 'Send reset link'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'reset' : 'login'); setError(''); setInfo(''); }}
              className="text-sm text-amber-500 hover:text-amber-400">
              {mode === 'login' ? 'Forgot password?' : 'Back to sign in'}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-600 mt-6">A.J Motorbike Spares & Accessories · Inventory & POS</p>
      </div>
    </div>
  );
}
