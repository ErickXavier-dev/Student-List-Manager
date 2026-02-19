'use client';
import { useState } from 'react';
import GlassCard from './ui/GlassCard';
import ConfirmModal from './ui/ConfirmModal';
import { Plus, Trash2, Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

export default function CollectionManager({ collections, onUpdate }) {
  const [formData, setFormData] = useState({ title: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setLoading(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create collection');

      const newCollection = await res.json();
      toast.success('Collection Created');
      setFormData({ title: '', amount: '' });
      if (onUpdate) onUpdate(newCollection);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;

    setDeleteModal({ isOpen: false, id: null });

    try {
      const res = await fetch(`/api/collections?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Collection Deleted');
      if (onUpdate) onUpdate(); // Trigger refresh
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-emerald-400" />
          New Collection
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Event Name (e.g. Picnic)"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-emerald-500/50 transition-colors"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
          <div className="relative">
            <IndianRupee size={16} className="absolute left-3 top-3 text-white/40" />
            <input
              type="number"
              placeholder="Amount"
              className="w-full sm:w-32 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 outline-none focus:border-emerald-500/50 transition-colors"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[100px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Create'}
          </button>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map(col => (
          <GlassCard key={col._id} className="relative group">
            <button
              onClick={() => setDeleteModal({ isOpen: true, id: col._id })}
              className="absolute top-2 right-2 p-2 rounded-full bg-rose-500/10 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20"
            >
              <Trash2 size={16} />
            </button>
            <h4 className="font-medium text-lg text-white/90">{col.title}</h4>
            <div className="flex items-center gap-1 text-emerald-400 mt-1">
              <IndianRupee size={14} />
              <span className="font-bold text-xl">{col.amount}</span>
            </div>
            <p className="text-xs text-white/40 mt-2">
              {new Date(col.createdAt).toLocaleDateString()}
            </p>
          </GlassCard>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? This action cannot be undone."
        isDanger={true}
        confirmText="Delete"
      />
    </div>
  );
}
