'use client';
import { useState } from 'react';
import GlassCard from './ui/GlassCard';
import ConfirmModal from './ui/ConfirmModal';
import EditCollectionModal from './ui/EditCollectionModal';
import CollectionApplicabilityModal from './ui/CollectionApplicabilityModal';
import { Plus, Trash2, Loader2, IndianRupee, Pencil, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

interface Collection {
  _id: string;
  title: string;
  amount: number;
  classId?: string | null;
  createdByRole?: string;
  createdAt: string;
}

interface ClassData {
  _id: string;
  name: string;
}

interface CollectionManagerProps {
  collections: Collection[];
  onUpdate: (newCollection?: Collection) => void;
  loading: boolean;
  role: 'hod' | 'teacher' | 'rep';
  classId?: string;
  hideGeneralToggle?: boolean;
  classes?: ClassData[];
}

export default function CollectionManager({
  collections,
  onUpdate,
  loading,
  role,
  classId,
  hideGeneralToggle,
  classes = []
}: CollectionManagerProps) {
  const [formData, setFormData] = useState({ title: '', amount: '', isGeneral: false, targetClassId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; collection: Collection | null }>({ isOpen: false, collection: null });
  const [applicabilityModal, setApplicabilityModal] = useState<{ isOpen: boolean; collection: Collection | null }>({ isOpen: false, collection: null });

  const handleEditClick = (col: Collection) => {
    setEditModal({ isOpen: true, collection: col });
  };

  const handleManageClick = (col: Collection) => {
    setApplicabilityModal({ isOpen: true, collection: col });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    // If HOD is creating a specific collection in global view, they MUST select a class
    if (role === 'hod' && !hideGeneralToggle && !formData.isGeneral && !formData.targetClassId) {
      return toast.error("Please select a target class");
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          amount: formData.amount,
          isGeneral: hideGeneralToggle ? false : formData.isGeneral,
          classId: hideGeneralToggle ? classId : (formData.isGeneral ? null : formData.targetClassId)
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create collection');
      }

      const newCollection = await res.json();
      toast.success('Collection Created');
      setFormData({ title: '', amount: '', isGeneral: false, targetClassId: '' });
      if (onUpdate) onUpdate(newCollection);
    } catch (error: any) {
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
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateCollection = async (id: string, title: string, amount: string | number) => {
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
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const showClassSelector = role === 'hod' && !hideGeneralToggle && !formData.isGeneral;

  return (
    <div className="space-y-6">
      <GlassCard className="border-emerald-500/10 overflow-visible">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Plus size={20} />
            </div>
            New Collection
          </h3>
          {role === 'hod' && !hideGeneralToggle && (
            <div className="p-1 px-3 rounded-full bg-white/5 border border-white/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.isGeneral}
                    onChange={e => setFormData({ ...formData, isGeneral: e.target.checked })}
                  />
                  <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:bg-purple-500/50 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white/40 rounded-full peer-checked:translate-x-4 peer-checked:bg-white transition-all"></div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 group-hover:text-white/80 transition-colors">General Mode</span>
              </label>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Event Name (e.g. Picnic)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {showClassSelector && (
              <div className="flex-1 min-w-[180px]">
                <select
                  className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 appearance-none text-white/90 font-medium cursor-pointer transition-all"
                  value={formData.targetClassId}
                  onChange={e => setFormData({ ...formData, targetClassId: e.target.value })}
                >
                  <option value="" className="bg-slate-900">Select Class...</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
                <IndianRupee size={18} />
              </div>
              <input
                type="number"
                placeholder="Amount"
                className="w-full md:w-32 bg-white/5 border border-white/10 rounded-xl pl-11 pr-5 py-3 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs px-8 py-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Event'}
            </button>
          </div>
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
