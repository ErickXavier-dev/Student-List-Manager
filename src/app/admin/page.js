'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import ExcelUploader from '@/components/ExcelUploader';
import CollectionManager from '@/components/CollectionManager';
import StudentCard from '@/components/StudentCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserCog, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [resStudents, resCollections] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/collections')
      ]);
      const dataStudents = await resStudents.json();
      const dataCollections = await resCollections.json();

      setStudents(dataStudents);
      setCollections(dataCollections);
      if (dataCollections.length > 0 && !selectedCollection) {
        setSelectedCollection(dataCollections[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePaymentUpdate = (studentId, newState) => {
    // Optimistic update
    setStudents(prev => prev.map(s => {
      if (s._id === studentId) {
        const newPayments = { ...s.payments, [selectedCollection]: newState };
        return { ...s, payments: newPayments };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Admin Dashboard
        </h1>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <UserCog size={20} />
          Students & Payments
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === 'collections' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}
        >
          <ReceiptText size={20} />
          Collections
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1">
              <ExcelUploader onUploadSuccess={fetchData} />
            </div>

            {/* Quick Payment Management */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Manage Payments</h3>
                <div className="flex gap-2">
                  <select
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 outline-none"
                    value={selectedCollection || ''}
                    onChange={e => setSelectedCollection(e.target.value)}
                  >
                    {collections.map(c => (
                      <option key={c._id} value={c._id} className="text-black">
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {students.map(student => (
                    <StudentCard
                      key={student._id}
                      student={student}
                      collectionId={selectedCollection}
                      isAdmin={true}
                      onPaymentUpdate={handlePaymentUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CollectionManager collections={collections} onUpdate={fetchData} />
        </div>
      )}
    </div>
  );
}
