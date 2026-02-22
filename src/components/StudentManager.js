'use client';
import { useState, useEffect, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import ExcelUploader from '@/components/ExcelUploader';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Search, Edit2, Trash2, Check, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const StudentRow = ({ student, refreshData, onDeleteClick }) => {
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
      refreshData();
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

export default function StudentManager({ classId, collections = [] }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });

  const fetchStudents = useCallback(async (showLoading = true) => {
    if (!classId) return;
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/students?classId=${classId}`);
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load students");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

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
      fetchStudents(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = () => {
    const dataToExport = filteredStudents.map(s => {
      const base = {
        "Register Number": s.registerNumber,
        "Name": s.name,
      };

      // If collections provided, we can add payment status for each
      collections.forEach(c => {
        const isNA = s.notApplicable?.[c._id];
        let status = s.payments?.[c._id];
        if (status === true) status = 'PAID';
        if (!status) status = 'PENDING';
        base[c.title] = isNA ? 'N/A' : status;
      });

      return base;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Students_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toString().includes(search)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <ExcelUploader onUploadSuccess={() => fetchStudents(false)} classId={classId} />
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
            placeholder="Search students..."
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
                      refreshData={() => fetchStudents(false)}
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
