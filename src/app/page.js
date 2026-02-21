'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import StudentCard from '@/components/StudentCard';
import { Search, Wallet, Users, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [students, setStudents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'paid', 'pending'

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [resStudents, resCollections] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/collections')
      ]);
      const dataStudents = await resStudents.json();
      const dataCollections = await resCollections.json();

      setStudents(dataStudents);
      setCollections(dataCollections);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Handle initial selection and maintain validity
  useEffect(() => {
    if (collections.length > 0) {
      // If nothing selected, or selected item no longer exists, select first
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
    let status = s.payments?.[selectedCollection];

    // Backward compatibility
    if (status === true) status = 'PAID';
    if (status === false || status === undefined || status === null) status = 'PENDING';

    // Effective status Logic
    const effectiveStatus = isNA ? 'NA' : status;

    if (filterStatus === 'all') return matchesSearch && effectiveStatus !== 'NA'; // Hide NA by default
    if (filterStatus === 'paid') return matchesSearch && effectiveStatus === 'PAID';
    if (filterStatus === 'pending') return matchesSearch && effectiveStatus === 'PENDING';
    if (filterStatus === 'na') return matchesSearch && effectiveStatus === 'NA';

    return matchesSearch;
  });

  const getStats = () => {
    if (!selectedCollection) return { paid: 0, total: 0, pending: 0, amount: 0 };

    // Calculate based on ALL students (excluding NA)
    const applicableStudents = students.filter(s => {
      return !s.notApplicable?.[selectedCollection];
    });

    const paidStudents = applicableStudents.filter(s => {
      let status = s.payments?.[selectedCollection];
      if (status === true) return true;
      return status === 'PAID';
    });

    return {
      paid: paidStudents.length,
      total: applicableStudents.length,
      pending: applicableStudents.length - paidStudents.length,
      amount: paidStudents.length * (currentCollection?.amount || 0)
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-8">
      {/* Hero / Stats */}
      <section className="text-center space-y-4">
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
              <Users size={24} />
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
