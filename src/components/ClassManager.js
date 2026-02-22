'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import StudentManager from '@/components/StudentManager';
import CollectionManager from '@/components/CollectionManager';
import { Shield, Key, School, ArrowLeft, Users, Layers, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ClassManager({ classes, fetchData }) {
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPasswords, setEditingPasswords] = useState(null); // { id, role }
  const [newPassword, setNewPassword] = useState('');
  const [detailClass, setDetailClass] = useState(null); // The class object currently being managed in detail
  const [classCollections, setClassCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Fetch collections for the specific class when entering detail mode
  useEffect(() => {
    if (detailClass) {
      const fetchClassCollections = async () => {
        setLoadingCollections(true);
        try {
          const res = await fetch(`/api/collections?classId=${detailClass._id}`);
          const data = await res.json();
          if (Array.isArray(data)) setClassCollections(data);
        } catch (err) {
          toast.error("Failed to load class collections");
        } finally {
          setLoadingCollections(false);
        }
      };
      fetchClassCollections();
    } else {
      setClassCollections([]);
    }
  }, [detailClass]);

  // Sync detailClass with classes list to ensure status dots update immediately
  useEffect(() => {
    if (detailClass && classes.length > 0) {
      const updated = classes.find(c => c._id === detailClass._id);
      if (updated) setDetailClass(updated);
    }
  }, [classes, detailClass?._id]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName }),
      });
      if (!res.ok) throw new Error('Failed to create class');
      toast.success('Class created');
      setNewClassName('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePassword = async (classId, role) => {
    try {
      const res = await fetch(`/api/admin/classes/${classId}/passwords`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role, password: newPassword, action: 'update' }),
      });
      if (!res.ok) throw new Error('Failed to update password');
      toast.success(`${role} password updated (Valid for 6 months)`);
      setEditingPasswords(null);
      setNewPassword('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRevokePassword = async (classId, role) => {
    try {
      const res = await fetch(`/api/admin/classes/${classId}/passwords`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role, action: 'revoke' }),
      });
      if (!res.ok) throw new Error('Failed to revoke password');
      toast.success(`${role} password revoked`);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Detailed Class Management View
  if (detailClass) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
        <button
          onClick={() => setDetailClass(null)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} /> Back to Class List
        </button>

        <header className="flex items-center justify-between glass p-6 rounded-3xl border border-white/10 overflow-hidden relative">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 blur-[90px] rounded-full"></div>

          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 rounded-3xl bg-purple-500/20 text-purple-400 shadow-inner border border-purple-500/20">
              <School size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">{detailClass.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-black">Secure Management Terminal</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-12">
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shadow-inner">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Students & Enrollment</h3>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Class Registry Management</p>
                </div>
              </div>
            </div>
            <StudentManager
              classId={detailClass._id}
              collections={classCollections}
              detailClass={detailClass}
              setEditingPasswords={setEditingPasswords}
              handleRevokePassword={handleRevokePassword}
            />
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-inner">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Class Collections</h3>
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Event & Fee Management</p>
                </div>
              </div>
            </div>
            <CollectionManager
              collections={classCollections}
              onUpdate={() => {
                // Refresh both collections and fetchData (for general dashboard)
                fetchData();
                // Also refresh local detailed view collections
                fetch(`/api/collections?classId=${detailClass._id}`)
                  .then(res => res.json())
                  .then(data => Array.isArray(data) && setClassCollections(data));
              }}
              loading={loadingCollections}
              role="hod"
              classId={detailClass._id}
              hideGeneralToggle={true}
            />
          </section>
        </div>
      </div>
    );
  }

  // Class List Grid View
  return (
    <div className="space-y-6">
      <GlassCard className="p-8 border-purple-500/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 shadow-inner">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Expand Department</h3>
            <p className="text-[10px] text-white/40 uppercase font-black tracking-[0.2em] mt-1">Initialize New Academic Workspace</p>
          </div>
        </div>

        <form onSubmit={handleCreateClass} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <input
              type="text"
              placeholder="Class Name (e.g., CS-A)"
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all placeholder:text-white/20 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex items-center justify-center min-w-[160px]"
          >
            {isCreating ? 'Initializing...' : 'Create Workspace'}
          </button>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <GlassCard key={c._id} className="p-0 flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-500 overflow-hidden min-h-[200px]">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 opacity-30 group-hover:opacity-100 transition-opacity"></div>

            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">{c.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">Active Workspace</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all duration-500">
                  <School className="text-white/20 group-hover:text-purple-400 transition-colors" size={24} />
                </div>
              </div>
            </div>

            <button
              onClick={() => setDetailClass(c)}
              className="w-full bg-white/5 hover:bg-purple-600 group-hover:bg-purple-600 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 border-t border-white/5"
            >
              Control Class <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={16} />
            </button>
          </GlassCard>
        ))}
      </div>

      {editingPasswords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in transition-all">
          <GlassCard className="w-full max-w-sm p-6 space-y-4">
            <h3 className="text-xl font-bold">Set {editingPasswords.role} Password</h3>
            <p className="text-sm text-white/60">Enter new password for {editingPasswords.role}. It will be valid for 6 months.</p>
            <input
              type="text"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-purple-500/50"
              autoFocus
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleUpdatePassword(editingPasswords.id, editingPasswords.role)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg font-bold"
              >
                Save
              </button>
              <button
                onClick={() => setEditingPasswords(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
