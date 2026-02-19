'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import ExcelUploader from '@/components/ExcelUploader';
import CollectionManager from '@/components/CollectionManager';
import StudentCard from '@/components/StudentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { UserCog, ReceiptText, Layers, Download, Search, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
      <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
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
  const [activeTab, setActiveTab] = useState('payments'); // Default to payments as it's most used
  const [students, setStudents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });

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
      toast.error("Failed to load data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Filter students based on status and search
  const getFilteredStudents = () => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.registerNumber.toString().includes(search);

      if (!matchesSearch) return false;
      if (activeTab === 'students') return true; // No payment filter in Students tab

      if (!selectedCollection) return true;

      const isNA = s.notApplicable?.[selectedCollection];
      let status = s.payments?.[selectedCollection];

      // Backward compat
      if (status === true) status = 'PAID';
      if (status === false || status === undefined || status === null) status = 'PENDING';

      // NA overrides everything for display/filtering usually, or we treat it as a distinct state
      // Logic:
      // if NA -> Status is NA
      // else -> Status is PAID or PENDING

      const effectiveStatus = isNA ? 'NA' : status;

      if (filterStatus === 'all') return effectiveStatus !== 'NA'; // Hide NA by default
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

      // Only add payment details if NOT in the students tab
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
          // Export all payments
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

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Admin Dashboard
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-4 hide-scrollbar">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <UserCog size={20} />
          Students
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <ReceiptText size={20} />
          Payments
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'collections' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <Layers size={20} />
          Collections
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ExcelUploader onUploadSuccess={fetchData} />
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
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/60 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="px-4 py-3">Reg No</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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
                    {c.title}
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

        {/* COLLECTIONS TAB */}
        {activeTab === 'collections' && (
          <CollectionManager collections={collections} onUpdate={fetchData} />
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
