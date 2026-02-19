'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // We need to create this util

export default function GlassCard({ children, className, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "glass rounded-xl p-6 transition-all duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
