'use client';

import GlassCard from './ui/GlassCard';
import { Check, X, Loader2, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentCard({ student, collectionId, isAdmin, onPaymentUpdate }) {
  const [isLoading, setIsLoading] = useState(false);

  // Normalize status. Check notApplicable first.
  let isNA = collectionId ? student.notApplicable?.[collectionId] : false;
  let paymentStatus = collectionId ? student.payments?.[collectionId] : undefined;

  // Backward compatibility: if paymentStatus is boolean
  if (paymentStatus === true) paymentStatus = 'PAID';
  if (paymentStatus === false) paymentStatus = 'PENDING';

  const status = isNA ? 'NA' : (paymentStatus || 'PENDING'); // 'PAID', 'NA', 'PENDING'

  const handleToggle = async () => {
    if (!isAdmin || !collectionId || isLoading) return;

    setIsLoading(true);
    try {
      // Cycle: PENDING -> PAID -> NA -> PENDING
      let newStatus;
      if (status === 'PENDING') newStatus = 'PAID';
      else if (status === 'PAID') newStatus = 'NA';
      else newStatus = 'APPLICABLE'; // Was NA, now make Applicable (which defaults to PENDING/UNPAID state visually if no payment exists)

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

      const statusText = newStatus === 'PAID' ? 'PAID' : newStatus === 'NA' ? 'Not Applicable' : 'UNPAID';
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

  const getStatusConfig = (s) => {
    switch (s) {
      case 'PAID':
        return { color: "bg-emerald-500/20 border-emerald-500/50 text-emerald-200", icon: Check, label: 'Paid' };
      case 'NA':
        return { color: "bg-white/10 border-white/20 text-white/40", icon: Ban, label: 'N/A' };
      default: // PENDING
        return { color: "bg-rose-500/20 border-rose-500/50 text-rose-200", icon: X, label: 'Unpaid' };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <GlassCard
      className={cn(
        "flex items-center justify-between group",
        isAdmin && "cursor-pointer hover:bg-white/10 active:scale-[0.98]"
      )}
      onClick={handleToggle}
    >
      <div>
        <h3 className="font-semibold text-lg">{student.name}</h3>
        <p className="text-sm text-white/60">Register No: {student.registerNumber}</p>
      </div>

      {collectionId && (
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
          config.color
        )}>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Icon size={16} />
          )}
          <span className="text-sm font-medium">
            {config.label}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
