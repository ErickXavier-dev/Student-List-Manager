'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import ExcelUploader from '@/components/ExcelUploader';
import CollectionManager from '@/components/CollectionManager';
import StudentCard from '@/components/StudentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { UserCog, ReceiptText, Layers, Download, Search, Edit2, Trash2, Check, X, Shield, Users, Key, School } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Separate component for Class Management
const ClassManager = ({ classes, fetchData }) => {
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingPasswords, setEditingPasswords] = useState(null); // { id, role }
  const [newPassword, setNewPassword] = useState('');

  const handleCreateClass = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="text-purple-400" size={24} /> Create New Class
        </h3>
        <form onSubmit={handleCreateClass} className="flex gap-2">
          <input
            type="text"
            placeholder="Class Name (e.g., CS-A)"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-purple-500/50"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-2 rounded-lg font-bold transition-all"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <GlassCard key={c._id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-bold text-white">{c.name}</h4>
                <div className="p-2 rounded-lg bg-white/5">
                  <School className="text-white/40" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                      <Key size={12} /> Teacher
                    </span>
                    {c.teacherPasswordRevoked && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded">Revoked</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPasswords({ id: c._id, role: 'teacher' })}
                      className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleRevokePassword(c._id, 'teacher')}
                      className="text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                      <Key size={12} /> Class Rep
                    </span>
                    {c.repPasswordRevoked && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded">Revoked</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPasswords({ id: c._id, role: 'rep' })}
                      className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => handleRevokePassword(c._id, 'rep')}
                      className="text-xs text-red-400 hover:bg-red-400/10 px-2 py-1 rounded transition-colors"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
};

const StudentRow = ({ student, fetchData, onDeleteClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: student.name, registerNumber: student.registerNumber });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      toast.success('Student updated');
      setIsEditing(false);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-white/5 transition-colors">
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.registerNumber}
            onChange={e => setEditData({ ...editData, registerNumber: e.target.value })}
            className="bg-black/20 border border-white/10 rounded px-2 py-1 w-full text-white"
            autoFocus
          />
        </td>
        <td className="px-4 py-3">
          <input
            type="text"
            value={editData.name}
            onChange={e => setEditData({ ...editData, name: e.target.value })}
            className="bg-black/20 border border-white/10 rounded px-2 py-1 w-full text-white"
          />
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <button onClick={handleSave} disabled={isSaving} className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors">
              <Check size={18} />
            </button>
            <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors">
              <X size={18} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="px-4 py-3 font-mono text-white/70">{student.registerNumber}</td>
      <td className="px-4 py-3 font-medium">{student.name}</td>
      <td className="px-4 py-3 text-right opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <div className="flex justify-end gap-2">
          <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-blue-500/20 text-blue-400 rounded transition-colors">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDeleteClick(student)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('payments');
  const [students, setStudents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const sessionRes = await fetch('/api/auth/session');
      if (!sessionRes.ok) {
        window.location.href = '/login';
        return;
      }
      const sessionData = await sessionRes.json();
      setSession(sessionData);

      let classIdQuery = '';
      if (sessionData.role === 'hod') {
        if (selectedClassId) classIdQuery = `?classId=${selectedClassId}`;
      } else {
        classIdQuery = `?classId=${sessionData.classId}`;
      }

      const [resStudents, resCollections] = await Promise.all([
        fetch(`/api/students${classIdQuery}`),
        fetch(`/api/collections${classIdQuery}`)
      ]);
      const dataStudents = await resStudents.json();
      const dataCollections = await resCollections.json();

      setStudents(dataStudents);
      setCollections(dataCollections);

      if (sessionData.role === 'hod') {
        const resClasses = await fetch('/api/admin/classes');
        const dataClasses = await resClasses.json();
        setClasses(dataClasses);
        if (!selectedClassId && dataClasses.length > 0) {
          setSelectedClassId(dataClasses[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [selectedClassId]);

  // Handle initial selection and maintain validity
  useEffect(() => {
    if (collections.length > 0) {
      const exists = selectedCollection && collections.find(c => c._id === selectedCollection);
      if (!selectedCollection || !exists) {
        setSelectedCollection(collections[0]._id);
      }
    }
  }, [collections, selectedCollection]);

  const handlePaymentUpdate = (studentId, newState) => {
    setStudents(prev => prev.map(s => {
      if (s._id === studentId) {
        const newPayments = { ...s.payments, [selectedCollection]: newState };
        return { ...s, payments: newPayments };
      }
      return s;
    }));
  };

  const confirmDelete = async () => {
    const student = deleteModal.student;
    if (!student) return;

    setDeleteModal({ isOpen: false, student: null });

    try {
      const res = await fetch(`/api/students/${student._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Student deleted');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getFilteredStudents = () => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.registerNumber.toString().includes(search);

      if (!matchesSearch) return false;
      if (activeTab === 'students') return true;

      if (!selectedCollection) return true;

      const isNA = s.notApplicable?.[selectedCollection];
      let status = s.payments?.[selectedCollection];

      if (status === true) status = 'PAID';
      if (status === false || status === undefined || status === null) status = 'PENDING';

      const effectiveStatus = isNA ? 'NA' : status;

      if (filterStatus === 'all') return effectiveStatus !== 'NA';
      if (filterStatus === 'paid') return effectiveStatus === 'PAID';
      if (filterStatus === 'pending') return effectiveStatus === 'PENDING';
      if (filterStatus === 'na') return effectiveStatus === 'NA';

      return true;
    });
  };

  const filteredStudents = getFilteredStudents();

  const handleExport = () => {
    const dataToExport = filteredStudents.map(s => {
      const base = {
        "Register Number": s.registerNumber,
        "Name": s.name,
      };

      if (activeTab !== 'students') {
        if (activeTab === 'payments' && selectedCollection) {
          const col = collections.find(c => c._id === selectedCollection);

          const isNA = s.notApplicable?.[selectedCollection];
          let status = s.payments?.[selectedCollection];
          if (status === true) status = 'PAID';
          if (!status) status = 'PENDING';

          const effectiveStatus = isNA ? 'N/A' : (status || 'PENDING');

          base["Collection"] = col?.title;
          base["Amount"] = col?.amount;
          base["Status"] = effectiveStatus;
        } else {
          collections.forEach(c => {
            const isNA = s.notApplicable?.[c._id];
            let status = s.payments?.[c._id];
            if (status === true) status = 'PAID';
            if (!status) status = 'PENDING';

            base[c.title] = isNA ? 'N/A' : (status || 'PENDING');
          });
        }
      }
      return base;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `ListManager_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!session) return <div className="p-8 text-center text-white/40">Verifying session...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60 uppercase tracking-widest font-bold font-mono">
              {session.role}
            </span>
            {session.role !== 'hod' && (
              <span className="text-xs text-white/40">| Class: {classes.find(c => c._id === session.classId)?.name || 'Loading...'}</span>
            )}
          </div>
        </div>

        {session.role === 'hod' && (
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <span className="text-xs text-white/40 ml-3 uppercase font-bold tracking-wider">Active Class</span>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-white/10 border-none rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500/50"
            >
              {classes.map(c => (
                <option key={c._id} value={c._id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-4 hide-scrollbar">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <ReceiptText size={20} />
          Payments
        </button>

        {/* Only HOD and Teacher can manage students/collections usually, but user said "managegibility and access to their class reps" */}
        {/* So Rep can also see these tabs as per request: "manage the one in their class" */}
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <UserCog size={20} />
          Students
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'collections' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <Layers size={20} />
          Collections
        </button>

        {session.role === 'hod' && (
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'classes' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            <Shield size={20} />
            Classes
          </button>
        )}

        {(session.role === 'teacher' || session.role === 'hod') && (
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            <Key size={20} />
            {session.role === 'teacher' ? 'Class Rep Access' : 'Security'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between gap-4 glass p-4 rounded-xl items-center">
              <div className="flex gap-2 w-full xl:w-auto overflow-x-auto hide-scrollbar">
                {collections.map(c => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCollection(c._id)}
                    className={`
                                whitespace-nowrap px-4 py-1.5 rounded-lg transition-all text-sm font-medium border
                                ${selectedCollection === c._id
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}
                            `}
                  >
                    {c.title}{c.classId === null && <span className="ml-2 text-[10px] bg-purple-500/30 px-1 rounded uppercase tracking-tighter">General</span>}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto items-center">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full sm:w-48 bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-1.5 outline-none focus:border-white/30 transition-colors text-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 outline-none text-sm text-white w-full sm:w-auto"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all" className="bg-slate-900">All Students</option>
                  <option value="paid" className="bg-slate-900">Paid</option>
                  <option value="pending" className="bg-slate-900">Pending</option>
                  <option value="na" className="bg-slate-900">Not Applicable</option>
                </select>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm transition-colors whitespace-nowrap w-full sm:w-auto justify-center"
                >
                  <Download size={16} /> Export
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : (
                filteredStudents.map(student => (
                  <StudentCard
                    key={student._id}
                    student={student}
                    collectionId={selectedCollection}
                    isAdmin={true}
                    onPaymentUpdate={handlePaymentUpdate}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ExcelUploader onUploadSuccess={fetchData} classId={session.role === 'hod' ? selectedClassId : session.classId} />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Student List</h3>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm transition-colors"
                >
                  <Download size={16} /> Export List
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or register no..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 outline-none focus:border-white/30 transition-colors text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/60 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-4 py-3">Reg No</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      <>
                        {filteredStudents.map(s => (
                          <StudentRow
                            key={s._id}
                            student={s}
                            fetchData={fetchData}
                            onDeleteClick={(student) => setDeleteModal({ isOpen: true, student })}
                          />
                        ))}
                        {filteredStudents.length === 0 && (
                          <tr><td colSpan="3" className="text-center py-8 text-white/40">No students found</td></tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COLLECTIONS TAB */}
        {activeTab === 'collections' && (
          <CollectionManager collections={collections} onUpdate={fetchData} loading={loading} role={session.role} />
        )}

        {/* CLASSES TAB (HOD ONLY) */}
        {activeTab === 'classes' && session.role === 'hod' && (
          <ClassManager classes={classes} fetchData={fetchData} />
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="max-w-2xl mx-auto">
            {session.role === 'teacher' ? (
              <GlassCard className="p-8 space-y-6">
                <div className="text-center">
                  <Users className="mx-auto text-blue-400 mb-4" size={48} />
                  <h3 className="text-2xl font-bold">Class Rep Access</h3>
                  <p className="text-white/60">Manage the shared password for Class Reps of your class.</p>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-xs text-white/40">Current Status</span>
                    {classes.find(c => c._id === session.classId)?.repPasswordRevoked ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold">REVOKED</span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">ACTIVE</span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reset Password</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter new rep password"
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm"
                        id="repPasswordInput"
                      />
                      <button
                        onClick={() => {
                          const pass = document.getElementById('repPasswordInput').value;
                          if (!pass) return toast.error('Enter password');
                          fetch(`/api/admin/classes/${session.classId}/passwords`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ targetRole: 'rep', password: pass, action: 'update' })
                          }).then(res => {
                            if (res.ok) {
                              toast.success('Rep password updated (6 month validity)');
                              fetchData();
                            }
                          });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold"
                      >
                        Update
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      fetch(`/api/admin/classes/${session.classId}/passwords`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ targetRole: 'rep', action: 'revoke' })
                      }).then(res => {
                        if (res.ok) {
                          toast.success('Rep password revoked');
                          fetchData();
                        }
                      });
                    }}
                    className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    Revoke Access Immediately
                  </button>
                </div>
              </GlassCard>
            ) : (
              <div className="text-center p-20 text-white/40">
                Use the Classes tab to manage security for individual classes.
              </div>
            )}
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, student: null })}
        onConfirm={confirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete ${deleteModal.student?.name}? This action cannot be undone.`}
        isDanger={true}
        confirmText="Delete"
      />
    </div>
  );
}

