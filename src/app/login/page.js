'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import { Lock, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('Logged in successfully');
      router.push('/admin');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold">Admin Access</h1>
          <p className="text-white/60 text-sm mt-1">Enter password to manage class list</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Enter Password"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors text-center text-lg tracking-widest"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
