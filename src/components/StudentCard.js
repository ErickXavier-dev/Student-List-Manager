'use client';

import GlassCard from './ui/GlassCard';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export default function StudentCard({ student, collectionId, isAdmin, onPaymentUpdate }) {
  const [isLoading, setIsLoading] = useState(false);

  // If no collection selected, just show student info (or handle gracefully)
  const hasPaid = collectionId ? student.payments?.[collectionId] : false;

  const handleToggle = async () => {
    if (!isAdmin || !collectionId || isLoading) return;

    setIsLoading(true);
    try {
      const newState = !hasPaid;

      const res = await fetch('/api/students', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          collectionId,
          hasPaid: newState,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      toast.success(`Updated ${student.name}'s status`);
      if (onPaymentUpdate) onPaymentUpdate(student._id, newState);
    } catch (error) {
      toast.error('Error updating payment status');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
          hasPaid
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
            : "bg-rose-500/20 border-rose-500/50 text-rose-200"
        )}>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : hasPaid ? (
            <Check size={16} />
          ) : (
            <X size={16} />
          )}
          <span className="text-sm font-medium">
            {hasPaid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
