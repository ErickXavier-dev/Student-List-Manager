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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStudents, resCollections] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/collections')
      ]);
      const dataStudents = await resStudents.json();
      const dataCollections = await resCollections.json();

      setStudents(dataStudents);
      setCollections(dataCollections);
      if (dataCollections.length > 0 && !selectedCollection) {
        setSelectedCollection(dataCollections[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Derived state
  const currentCollection = collections.find(c => c._id === selectedCollection);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toString().includes(search)
  );

  const paidCount = filteredStudents.filter(s =>
    selectedCollection && s.payments?.[selectedCollection]
  ).length;

  const totalAmount = paidCount * (currentCollection?.amount || 0);

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
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar flex gap-2">
          {loading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-32 rounded-full" />)
          ) : collections.map(col => (
            <button
              key={col._id}
              onClick={() => setSelectedCollection(col._id)}
              className={`
                        whitespace-nowrap px-6 py-2 rounded-full transition-all text-sm font-medium border
                        ${selectedCollection === col._id
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                    `}
            >
              {col.title}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
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

      {/* Stats Cards */}
      {currentCollection && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Total Collected</p>
              <p className="text-xl font-bold">₹ {totalAmount}</p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Paid Students</p>
              <p className="text-xl font-bold">{paidCount} <span className="text-sm text-white/40 font-normal">/ {students.length}</span></p>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-500/20 text-orange-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-white/60">Pending</p>
              <p className="text-xl font-bold">{students.length - paidCount}</p>
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
