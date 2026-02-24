'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import StudentCard from '@/components/StudentCard';
import { Search, Wallet, Users as UsersIcon, AlertCircle, Lock, Loader2, ArrowRight, School, LogOut, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Student {
  _id: string;
  name: string;
  registerNumber: string;
  notApplicable?: Record<string, boolean>;
  payments?: Record<string, string | boolean>;
}

interface Collection {
  _id: string;
  title: string;
  amount: number;
  classId?: string | null;
}

interface ClassData {
  _id: string;
  name: string;
}

interface Session {
  role: string;
  classId?: string;
  className?: string;
}

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'paid', 'pending'

  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loginForm, setLoginForm] = useState({
    password: '',
    role: 'teacher',
    classId: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/auth/classes');
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) {
        setLoginForm(prev => ({ ...prev, classId: data[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load classes');
    }
  };

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      } else {
        setSession(null);
        fetchClasses();
      }
    } catch (err) {
      setSession(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      // Pass classId to API if applicable (though route.js should handle session)
      const [resStudents, resCollections] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/collections')
      ]);
      const dataStudents = await resStudents.json();
      const dataCollections = await resCollections.json();

      if (Array.isArray(dataStudents)) setStudents(dataStudents);
      else setStudents([]);

      if (Array.isArray(dataCollections)) setCollections(dataCollections);
      else setCollections([]);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
      const interval = setInterval(() => fetchData(false), 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      toast.success('Access granted');
      setSession(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSession(null);
      fetchClasses();
      toast.success('Signed out');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  // Handle initial selection and maintain validity
  useEffect(() => {
    if (collections.length > 0) {
      const exists = selectedCollection && collections.find(c => c._id === selectedCollection);
      if (!selectedCollection || !exists) {
        setSelectedCollection(collections[0]._id);
      }
    }
  }, [collections, selectedCollection]);

  // Derived state
  const currentCollection = collections.find(c => c._id === selectedCollection);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.registerNumber.toString().includes(search);

    if (!selectedCollection) return matchesSearch;

    const isNA = s.notApplicable?.[selectedCollection];
    let status: string | undefined | boolean = s.payments?.[selectedCollection];

    if (status === true) status = 'PAID';
    if (status === false || status === undefined || status === null) status = 'PENDING';

    const effectiveStatus = isNA ? 'NA' : status;

    if (filterStatus === 'all') return matchesSearch && effectiveStatus !== 'NA';
    if (filterStatus === 'paid') return matchesSearch && effectiveStatus === 'PAID';
    if (filterStatus === 'pending') return matchesSearch && effectiveStatus === 'PENDING';
    if (filterStatus === 'na') return matchesSearch && effectiveStatus === 'NA';

    return matchesSearch;
  });

  const getStats = () => {
    if (!selectedCollection) return { paid: 0, total: 0, pending: 0, amount: 0 };
    const applicableStudents = students.filter(s => !s.notApplicable?.[selectedCollection]);
    const paidStudents = applicableStudents.filter(s => {
      let status = s.payments?.[selectedCollection];
      return status === true || status === 'PAID';
    });
    return {
      paid: paidStudents.length,
      total: applicableStudents.length,
      pending: applicableStudents.length - paidStudents.length,
      amount: paidStudents.length * (currentCollection?.amount || 0)
    };
  };

  const stats = getStats();

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-white/40 animate-pulse">Checking credentials...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                <Lock size={32} />
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Class Access</h1>
              <p className="text-white/60 text-sm mt-1">Select your class and enter password</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'teacher', label: 'Teacher', icon: School },
                  { id: 'rep', label: 'Rep', icon: UsersIcon },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setLoginForm({ ...loginForm, role: r.id })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${loginForm.role === r.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    <r.icon size={24} />
                    <span className="text-xs uppercase font-bold tracking-wider">{r.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/40 ml-1">Select Class</label>
                <select
                  value={loginForm.classId}
                  onChange={e => setLoginForm({ ...loginForm, classId: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors text-white appearance-none"
                >
                  {classes.map(c => (
                    <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/40 ml-1">Access Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 transition-colors text-center text-lg tracking-widest"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : <>View List <ArrowRight size={18} /></>}
              </button>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero / Stats */}
      <section className="text-center space-y-4 relative">
        <div className="absolute top-0 right-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          Student Payments
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Track class collections with transparency and ease.
        </p>
      </section>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Collection Selector */}
        <div className="w-full md:w-auto overflow-x-auto p-4 md:p-4 hide-scrollbar flex gap-2">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-32 rounded-full" />)
          ) : collections.map(col => (
            <button
              key={col._id}
              onClick={() => setSelectedCollection(col._id)}
              className={`
                        whitespace-nowrap px-6 py-2 rounded-full transition-all text-sm font-medium border overflow-hidden bg-clip-padding
                        ${selectedCollection === col._id
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                    `}
            >
              {col.title}
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            className="bg-white/5 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-white/30 transition-colors text-white text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all" className="bg-slate-900 text-white">All Students</option>
            <option value="paid" className="bg-slate-900 text-white">Paid Only</option>
            <option value="pending" className="bg-slate-900 text-white">Pending Only</option>
            <option value="na" className="bg-slate-900 text-white">Not Applicable</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Search student..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 outline-none focus:border-white/30 transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[88px] w-full rounded-2xl" />
          <Skeleton className="h-[88px] w-full rounded-2xl" />
          <Skeleton className="h-[88px] w-full rounded-2xl" />
        </div>
      ) : currentCollection && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Total Collected</p>
              <p className="text-xl font-bold">₹ {stats.amount}</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
              <UsersIcon size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Paid Students</p>
              <p className="text-xl font-bold">{stats.paid} <span className="text-sm text-white/40 font-normal">/ {stats.total}</span></p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/20 text-orange-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Student List */}
      <div className="space-y-4">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student, i) => (
              <motion.div
                key={student._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <StudentCard
                  student={student}
                  collectionId={selectedCollection}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-white/40">
            No students found.
          </div>
        )}
      </div>
    </div>
  );
}
