'use client';
import { useState, useEffect } from 'react';
import StudentManager from '@/components/StudentManager';
import ClassManager from '@/components/ClassManager';
import CollectionManager from '@/components/CollectionManager';
import StudentCard from '@/components/StudentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserCog, ReceiptText, Layers, Download, Search, Shield, Key } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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

      if (Array.isArray(dataStudents)) setStudents(dataStudents);
      if (Array.isArray(dataCollections)) setCollections(dataCollections);

      if (sessionData.role === 'hod') {
        const resClasses = await fetch('/api/admin/classes');
        const dataClasses = await resClasses.json();
        if (Array.isArray(dataClasses)) {
          setClasses(dataClasses);
          if (!selectedClassId && dataClasses.length > 0) {
            setSelectedClassId(dataClasses[0]._id);
          }
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

      if (activeTab === 'payments' && selectedCollection) {
        const col = collections.find(c => c._id === selectedCollection);
        const isNA = s.notApplicable?.[selectedCollection];
        let status = s.payments?.[selectedCollection];
        if (status === true) status = 'PAID';
        if (!status) status = 'PENDING';

        base["Collection"] = col?.title;
        base["Amount"] = col?.amount;
        base["Status"] = isNA ? 'N/A' : status;
      }
      return base;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!session) return <div className="p-8 text-center text-white/40">Verifying session...</div>;

  const isHOD = session.role === 'hod';

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
            {!isHOD && (
              <span className="text-xs text-white/40">| Class: {session.className || 'Loading...'}</span>
            )}
          </div>
        </div>

        {isHOD && activeTab === 'payments' && (
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
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'payments' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <ReceiptText size={20} />
          Payments
        </button>

        {!isHOD && (
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            <UserCog size={20} />
            Students
          </button>
        )}

        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'collections' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <Layers size={20} />
          Collections
        </button>

        {isHOD && (
          <button
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'classes' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            <Shield size={20} />
            Classes
          </button>
        )}

        {(session.role === 'teacher') && (
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
          >
            <Key size={20} />
            Class Rep Access
          </button>
        )}
      </div>

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
                  onChange={(e) => setFilterStatus(e.target.value)}
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

        {/* STUDENTS TAB (Teacher/Rep Only) */}
        {activeTab === 'students' && !isHOD && (
          <StudentManager classId={session.classId} collections={collections} />
        )}

        {/* COLLECTIONS TAB */}
        {activeTab === 'collections' && (
          <CollectionManager
            collections={collections}
            onUpdate={fetchData}
            loading={loading}
            role={session.role}
            classId={isHOD ? null : session.classId}
            classes={classes}
          />
        )}

        {/* CLASSES TAB (HOD ONLY) */}
        {activeTab === 'classes' && isHOD && (
          <ClassManager classes={classes} fetchData={fetchData} />
        )}

        {/* SECURITY TAB (TEACHER ONLY - HOD does it via Classes tab) */}
        {activeTab === 'security' && session.role === 'teacher' && (
          <div className="max-w-2xl mx-auto glass p-8 rounded-2xl border border-white/10 text-center space-y-6">
            <Key className="mx-auto text-blue-400" size={48} />
            <h3 className="text-2xl font-bold">Class Rep Access</h3>
            <p className="text-white/60">Configure the shared password for Class Reps in your class.</p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter new rep password"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm"
                id="repPasswordInputTeacher"
              />
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    const pass = document.getElementById('repPasswordInputTeacher').value;
                    if (!pass) return toast.error('Enter password');
                    fetch(`/api/admin/classes/${session.classId}/passwords`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetRole: 'rep', password: pass, action: 'update' })
                    }).then(res => res.ok && toast.success('Rep password updated'));
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold transition-all"
                >
                  Update Password
                </button>
                <button
                  onClick={() => {
                    fetch(`/api/admin/classes/${session.classId}/passwords`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ targetRole: 'rep', action: 'revoke' })
                    }).then(res => res.ok && toast.success('Rep password revoked'));
                  }}
                  className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 py-3 rounded-xl font-bold transition-all"
                >
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

