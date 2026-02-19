'use client';
import { useState, useEffect } from 'react';
import { X, Search, Check, Ban, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CollectionApplicabilityModal({ isOpen, onClose, collection }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // studentId of currently updating student

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNA = async (student) => {
    if (updating) return;
    setUpdating(student._id);

    const isNA = student.notApplicable?.[collection._id];

    // Prevent toggling if already NA
    if (isNA) return;

    const newStatus = 'NA';

    try {
      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          collectionId: collection._id,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Update local state
      setStudents(prev => prev.map(s => {
        if (s._id === student._id) {
          // Update notApplicable map
          const newNotApplicable = { ...s.notApplicable };
          if (newStatus === 'NA') {
            newNotApplicable[collection._id] = true;
          } else {
            delete newNotApplicable[collection._id];
          }

          return { ...s, notApplicable: newNotApplicable };
        }
        return s;
      }));

      toast.success(`Marked ${student.name} as ${newStatus === 'NA' ? 'Not Applicable' : 'Applicable'}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (updating) return;
    setUpdating('bulk'); // Generic updating state

    try {
      const res = await fetch('/api/collections/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection._id,
          action
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      toast.success(data.message);

      // Refresh students
      await fetchStudents();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toString().includes(search)
  );

  // Check if ALL filtered students are NA (or should we check ALL students? usually ALL students in context)
  // Logic: "when everyone is selected as no appliable" -> implies all students in the collection.
  const allNA = students.length > 0 && students.every(s => s.notApplicable?.[collection._id]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex flex-col gap-4 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Manage Applicability</h2>
                  <p className="text-sm text-white/60">For {collection?.title}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction(allNA ? 'MARK_ALL_APPLICABLE' : 'MARK_EVERYONE_NA')}
                  disabled={loading || updating}
                  className={`
                    flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border
                    ${allNA
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'}
                  `}
                >
                  {allNA ? 'Mark All Applicable' : 'Mark Everyone NA'}
                </button>

                {!allNA && (
                  <button
                    onClick={() => handleBulkAction('MARK_ALL_NA')} // This is "Mark Unpaid NA"
                    disabled={loading || updating}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors border bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    Mark Unpaid as NA
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white outline-none focus:border-white/30 transition-colors"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white/40" /></div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-center text-white/40 py-8">No students found</p>
              ) : (
                filteredStudents.map(student => {
                  const isNA = student.notApplicable?.[collection._id];
                  // Payment status logic
                  let paymentStatus = student.payments?.[collection._id];
                  if (paymentStatus === true) paymentStatus = 'PAID';

                  const isPaid = paymentStatus === 'PAID';

                  return (
                    <div key={student._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                      <div>
                        <h4 className="font-medium text-white">{student.name}</h4>
                        <p className="text-xs text-white/50">{student.registerNumber}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {isPaid && <span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-500/10 rounded">Paid</span>}

                        {isNA ? (
                          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500/20 text-rose-400 cursor-not-allowed select-none">
                            <Ban size={14} /> NA
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleNA(student)}
                            disabled={updating === student._id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                          >
                            {updating === student._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <><Check size={14} /> Applicable</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
