'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, IndianRupee } from 'lucide-react';
import GlassCard from './GlassCard';

export default function EditCollectionModal({ isOpen, onClose, collection, onUpdate }) {
  const [formData, setFormData] = useState({
    title: collection?.title || '',
    amount: collection?.amount || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onUpdate(collection._id, formData.title, formData.amount);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <GlassCard className="border-white/10 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-white">Edit Collection</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/60">Collection Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-emerald-500/50 transition-colors text-white"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white/60">Amount</label>
                  <div className="relative">
                    <IndianRupee size={16} className="absolute left-3 top-3 text-white/40" />
                    <input
                      type="number"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 outline-none focus:border-emerald-500/50 transition-colors text-white"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
