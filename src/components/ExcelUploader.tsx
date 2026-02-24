'use client';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import GlassCard from './ui/GlassCard';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExcelUploaderProps {
  onUploadSuccess: () => void;
  classId: string;
}

export default function ExcelUploader({ onUploadSuccess, classId }: ExcelUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        if (!bstr) return;

        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet) as any[];

        const formattedData = data.map(row => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('name'));
          const regKey = keys.find(k => k.toLowerCase().includes('register') || k.toLowerCase().includes('roll'));

          return {
            name: nameKey ? row[nameKey] : null,
            registerNumber: regKey ? row[regKey] : null
          };
        }).filter(item => item.name && item.registerNumber);

        if (formattedData.length === 0) {
          throw new Error("No valid student data found. Columns 'Name' and 'Register Number' required.");
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: formattedData, classId }),
        });

        const result = await res.json();

        if (!res.ok) {
          if (result.details && Array.isArray(result.details)) {
            const msg = result.details.slice(0, 3).join(', ') + (result.details.length > 3 ? ` +${result.details.length - 3} more` : '');
            throw new Error(msg);
          }
          throw new Error(result.error || 'Upload failed');
        }

        toast.success(result.message);
        if (result.inputErrors && result.inputErrors.length > 0) {
          toast.warning(`Some rows failed: ${result.inputErrors.length} errors.`);
        }

        if (onUploadSuccess) onUploadSuccess();

        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error: any) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <GlassCard className="text-center p-12 border-dashed border-2 border-white/10 bg-black/20 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all duration-500 group relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>

      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
        className="hidden"
        ref={fileInputRef}
      />

      <div
        className="flex flex-col items-center gap-6 cursor-pointer relative z-10"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-500 shadow-xl group-hover:shadow-emerald-500/10">
          {isUploading ? (
            <Loader2 className="animate-spin" size={40} />
          ) : (
            <div className="relative">
              <FileSpreadsheet size={40} />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">Update Registry</h3>
          <p className="text-xs text-white/40 uppercase font-black tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
            Drop Spreadsheet or <span className="text-emerald-400">Browse Files</span> to Sync Student Data
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest">
            Supported: .XLSX, .XLS, .CSV
          </div>

          <a
            href="/sample.csv"
            download
            className="group/link flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-emerald-400 transition-colors uppercase tracking-[0.1em]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-px w-4 bg-white/20 group-hover/link:bg-emerald-400/50 transition-colors"></div>
            Download Structure Template
            <div className="h-px w-4 bg-white/20 group-hover/link:bg-emerald-400/50 transition-colors"></div>
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
