'use client';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import GlassCard from './ui/GlassCard';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ExcelUploader({ onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const bstr = event.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        // Map keys to normalized form (Case insensitive approximation or expected keys)
        // Expected: Name, Register Number
        const formattedData = data.map(row => {
          // Find keys that match "name" or "register" loosely
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

        // Send to API
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: formattedData }),
        });

        const result = await res.json();

        if (!res.ok) {
          // Check if backend sent specific details
          if (result.details && Array.isArray(result.details)) {
            // Show first few errors
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

        // Reset
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <GlassCard className="text-center p-8 border-dashed border-2 border-white/20 bg-transparent hover:bg-white/5 transition-colors">
      <input
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileUpload}
        className="hidden"
        ref={fileInputRef}
      />

      <div
        className="flex flex-col items-center gap-4 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-4 rounded-full bg-white/10 text-emerald-400">
          {isUploading ? <Loader2 className="animate-spin" size={32} /> : <FileSpreadsheet size={32} />}
        </div>
        <div>
          <h3 className="text-lg font-semibold">Upload Class List</h3>
          <p className="text-sm text-white/60">
            Drop your Excel / CSV file here to update student list.
            <br />
            <span className="text-xs opacity-70">(Columns: Name, Register Number)</span>
          </p>
          <a
            href="/sample.csv"
            download
            className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline"
            onClick={(e) => e.stopPropagation()}
          >
            Download Sample CSV
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
