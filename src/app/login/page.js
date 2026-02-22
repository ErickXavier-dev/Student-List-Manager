'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import { Lock, Loader2, ArrowRight, UserCircle, School, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('hod'); // 'hod', 'teacher', 'rep'
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/auth/classes');
        const data = await res.json();
        setClasses(data);
        if (data.length > 0) setClassId(data[0]._id);
      } catch (err) {
        toast.error('Failed to load classes');
      }
    };
    fetchClasses();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, role, classId }),
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold">Access Portal</h1>
          <p className="text-white/60 text-sm mt-1">Select role and enter credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hod', label: 'HOD', icon: UserCircle },
              { id: 'teacher', label: 'Teacher', icon: School },
              { id: 'rep', label: 'Rep', icon: Users },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${role === r.id ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
              >
                <r.icon size={20} />
                <span className="text-[10px] uppercase font-bold tracking-wider">{r.label}</span>
              </button>
            ))}
          </div>

          {(role === 'teacher' || role === 'rep') && (
            <div className="space-y-1">
              <label className="text-xs text-white/40 ml-1">Select Class</label>
              <select
                value={classId}
                onChange={e => setClassId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-blue-500/50 transition-colors text-white"
              >
                {classes.map(c => (
                  <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-white/40 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-blue-500/50 transition-colors text-center text-lg tracking-widest"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

