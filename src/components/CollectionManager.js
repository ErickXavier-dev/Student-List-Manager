import { useState } from 'react';
import GlassCard from './ui/GlassCard';
import ConfirmModal from './ui/ConfirmModal';
import EditCollectionModal from './ui/EditCollectionModal';
import CollectionApplicabilityModal from './ui/CollectionApplicabilityModal';
import { Plus, Trash2, Loader2, IndianRupee, Pencil, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function CollectionManager({ collections, onUpdate, loading, role }) {
  const [formData, setFormData] = useState({ title: '', amount: '', isGeneral: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [editModal, setEditModal] = useState({ isOpen: false, collection: null });
  const [applicabilityModal, setApplicabilityModal] = useState({ isOpen: false, collection: null });

  const handleEditClick = (col) => {
    setEditModal({ isOpen: true, collection: col });
  };

  const handleManageClick = (col) => {
    setApplicabilityModal({ isOpen: true, collection: col });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create collection');
      }

      const newCollection = await res.json();
      toast.success('Collection Created');
      setFormData({ title: '', amount: '', isGeneral: false });
      if (onUpdate) onUpdate(newCollection);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    const id = deleteModal.id;
    if (!id) return;

    setDeleteModal({ isOpen: false, id: null });

    try {
      const res = await fetch(`/api/collections?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Collection Deleted');
      if (onUpdate) onUpdate(); // Trigger refresh
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateCollection = async (id, title, amount) => {
    try {
      const res = await fetch('/api/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, amount }),
      });

      if (!res.ok) throw new Error('Failed to update collection');

      await res.json();
      toast.success('Collection Updated');
      setEditModal({ isOpen: false, collection: null });
      if (onUpdate) onUpdate();
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
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
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create'}
            </button>
          </div>

          {role === 'hod' && (
            <label className="flex items-center gap-2 cursor-pointer w-fit group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isGeneral}
                  onChange={e => setFormData({ ...formData, isGeneral: e.target.checked })}
                />
                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-purple-500/50 transition-colors"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white/40 rounded-full peer-checked:translate-x-5 peer-checked:bg-white transition-all"></div>
              </div>
              <span className="text-sm text-white/60 group-hover:text-white transition-colors">General Collection (Apply to all classes)</span>
            </label>
          )}
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))
        ) : (
          collections.map(col => {
            const isGeneral = col.classId === null;
            const canDelete = role !== 'rep' || col.createdByRole === 'rep';

            return (
              <GlassCard key={col._id} className="relative group overflow-hidden">
                {isGeneral && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>}
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleManageClick(col)}
                    className="p-2 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                    title="Manage Applicability"
                  >
                    <Users size={16} />
                  </button>
                  <button
                    onClick={() => handleEditClick(col)}
                    className="p-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                    title="Edit Details"
                  >
                    <Pencil size={16} />
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: col._id })}
                      className="p-2 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-lg text-white/90 pr-20 truncate">{col.title}</h4>
                  {isGeneral && <span className="text-[10px] font-bold bg-purple-600/20 text-purple-400 px-1.5 rounded-full border border-purple-500/30 uppercase tracking-tighter">General</span>}
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <IndianRupee size={14} />
                  <span className="font-bold text-xl">{col.amount}</span>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    By {col.createdByRole || 'Admin'}
                  </p>
                  <p className="text-[10px] text-white/20">
                    {new Date(col.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </GlassCard>
            );
          })
        )}
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

      {/* Edit Modal */}
      {editModal.isOpen && (
        <EditCollectionModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, collection: null })}
          collection={editModal.collection}
          onUpdate={handleUpdateCollection}
        />
      )}

      {/* Applicability Modal */}
      {applicabilityModal.isOpen && (
        <CollectionApplicabilityModal
          isOpen={applicabilityModal.isOpen}
          onClose={() => setApplicabilityModal({ isOpen: false, collection: null })}
          collection={applicabilityModal.collection}
        />
      )}
    </div>
  );
}

