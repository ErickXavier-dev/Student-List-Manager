'use client';

import GlassCard from './ui/GlassCard';
import { Check, X, Loader2, Ban, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface Student {
  _id: string;
  name: string;
  registerNumber: string;
  notApplicable?: Record<string, boolean>;
  payments?: Record<string, string | boolean>;
}

interface StudentCardProps {
  student: Student;
  collectionId: string | null;
  isAdmin?: boolean;
  onPaymentUpdate?: (studentId: string, status: string) => void;
}

export default function StudentCard({ student, collectionId, isAdmin, onPaymentUpdate }: StudentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Normalize status. Check notApplicable first.
  let isNA = collectionId ? student.notApplicable?.[collectionId!] : false;
  let paymentStatus = collectionId ? student.payments?.[collectionId!] : undefined;

  // Backward compatibility: if paymentStatus is boolean
  if (paymentStatus === true) paymentStatus = 'PAID';
  if (paymentStatus === false) paymentStatus = 'PENDING';

  const status = isNA ? 'NA' : (paymentStatus || 'PENDING'); // 'PAID', 'NA', 'PENDING'

  const handleToggle = async () => {
    if (!isAdmin || !collectionId || isLoading || status === 'NA') return;

    setIsLoading(true);
    try {
      // Cycle: PENDING/NA -> PAID -> PENDING
      let newStatus: string | null;
      if (status === 'PAID') newStatus = null; // Unpaid
      else newStatus = 'PAID'; // Paid

      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          collectionId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      const statusText = newStatus === 'PAID' ? 'PAID' : 'UNPAID';
      toast.success(`Updated ${student.name}'s status to ${statusText}`);

      // Pass the effective status back (null means Pending)
      if (onPaymentUpdate) onPaymentUpdate(student._id, newStatus || 'PENDING');
    } catch (error) {
      toast.error('Error updating payment status');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'PAID':
        return { color: "bg-emerald-500/20 border-emerald-500/50 text-emerald-200", icon: Check, label: 'Paid' };
      case 'NA':
        return { color: "bg-white/10 border-white/20 text-white/40", icon: Ban, label: 'N/A' };
      default: // PENDING
        return { color: "bg-rose-500/20 border-rose-500/50 text-rose-200", icon: X, label: 'Unpaid' };
    }
  };

  const config = getStatusConfig(status as string);
  const Icon = config.icon as LucideIcon;

  return (
    <GlassCard
      className={cn(
        "flex items-center justify-between group relative overflow-hidden transition-all duration-300",
        isAdmin && status !== 'NA' && "cursor-pointer hover:border-emerald-500/30 hover:bg-emerald-500/5 active:scale-[0.98]",
        isAdmin && status === 'NA' && "opacity-60 grayscale-[0.5]"
      )}
      onClick={handleToggle}
    >
      {/* Dynamic Background Glow on Hover */}
      <div className={cn(
        "absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity blur-xl z-0",
        status === 'PAID' ? "from-emerald-500 to-teal-500" : status === 'NA' ? "from-white to-gray-400" : "from-rose-500 to-pink-500"
      )}></div>

      <div className="relative z-10 space-y-1">
        <h3 className="font-black text-lg text-white group-hover:text-emerald-300 transition-colors tracking-tight">{student.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Reg No</span>
          <code className="text-xs text-white/40 font-mono tracking-tighter">{student.registerNumber}</code>
        </div>
      </div>

      {collectionId && (
        <div className={cn(
          "relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-500 shadow-lg",
          config.color,
          status === 'PAID' ? "shadow-emerald-500/10" : status === 'PENDING' ? "shadow-rose-500/10" : ""
        )}>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-white/50" />
          ) : (
            <div className="relative">
              <Icon size={16} className="relative z-10" />
              {!isLoading && (
                <div className={cn(
                  "absolute inset-0 blur-md opacity-50",
                  status === 'PAID' ? "bg-emerald-400" : status === 'PENDING' ? "bg-rose-400" : "bg-white"
                )}></div>
              )}
            </div>
          )}
          <span className="text-xs font-black uppercase tracking-widest">
            {config.label}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
