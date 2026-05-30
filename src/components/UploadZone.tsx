import React, { useState, useRef } from 'react';
import { Upload, ClipboardCheck, FileText, ArrowRight, Play } from 'lucide-react';
import { PRELOADED_SAMPLE_TSV } from '../data';

interface UploadZoneProps {
  onDataParsed: (rawTsv: string) => void;
  onClear: () => void;
  hasData: boolean;
  totalParsedRows: number;
}

export default function UploadZone({ onDataParsed, onClear, hasData, totalParsedRows }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse text or file
  const handleTextSubmit = () => {
    if (pastedText.trim()) {
      onDataParsed(pastedText);
      setPastedText('');
      setShowPasteArea(false);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        onDataParsed(text);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8" id="upload-zone">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 rounded text-blue-600 block">
              <Upload className="w-4 h-4" />
            </span>
            Load Lead Call Sheets
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Upload CSV/TSV spreadsheets or copy-paste directly from Google Sheets / Excel.
          </p>
        </div>

        {hasData && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 animate-fadeIn">
              <span className="inline-block w-2 bg-blue-500 rounded-full h-2 animate-pulse"></span>
              {totalParsedRows} active rows loaded
            </span>
            <button
              onClick={onClear}
              className="text-xs font-semibold text-red-505 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 transition-colors cursor-pointer"
            >
              Clear Records
            </button>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="space-y-4">
          {/* Drag & Drop Boundary Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
            }`}
            onClick={triggerFileSelect}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.tsv,.txt"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 text-slate-400 mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-slate-450" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Drag & drop your call log sheet here, or{' '}
                <span className="text-blue-650 font-bold hover:underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports CSV, TSV (Tab separated), or plain text log sheets
              </p>
            </div>
          </div>

          {/* Quick choices segment */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <span className="text-slate-400 font-medium">Or choose quick entry:</span>
            <button
              onClick={() => onDataParsed(PRELOADED_SAMPLE_TSV)}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Load Interactive Demo Log
            </button>

            <button
              onClick={() => setShowPasteArea(!showPasteArea)}
              className="flex items-center gap-1 bg-slate-150 hover:bg-slate-205 text-slate-700 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer border border-slate-200"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Paste Raw Copy
            </button>
          </div>

          {/* Expandable copy paste region */}
          {showPasteArea && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-705 mb-2">
                Paste rows with headers from Excel/Sheets:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="LEAD ID&#9;ENTRY DATE&#9;ENTRY TIME&#9;AGENT NAME&#9;STATUS&#10;LID123&#9;27-05&#9;9:00 AM&#9;Vikas Ujjwal&#9;Booked"
                className="w-full h-32 bg-white text-xs border border-slate-200 rounded-lg p-3 font-mono focus:outline-none focus:border-blue-500 mb-2 whitespace-pre text-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPasteArea(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-150 text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTextSubmit}
                  disabled={!pastedText.trim()}
                  className="bg-blue-650 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Apply Log
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
          <ClipboardCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-blue-900 leading-tight">
              Lead database populated successfully
            </p>
            <p className="text-xs text-blue-700 mt-0.5 max-w-xl truncate">
              Calculations are linked dynamically. Filter columns or request AI Audit reports below.
            </p>
          </div>
          <button
            onClick={triggerFileSelect}
            className="text-xs text-slate-705 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded font-medium transition-colors cursor-pointer shrink-0"
          >
            Upload Other Sheet
          </button>
        </div>
      )}
    </div>
  );
}
