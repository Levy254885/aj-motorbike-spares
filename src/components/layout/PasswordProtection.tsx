import { useState, ReactNode } from 'react';
import { Lock } from 'lucide-react';

interface PasswordProtectionProps {
  children: ReactNode;
}

const ADMIN_PASSWORD = 'adminpos254';

export default function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      setError('');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-zinc-950 mb-4">
            <Lock className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Access Required</h1>
          <p className="text-zinc-400 text-sm mt-1">Enter password to continue</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-white placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
