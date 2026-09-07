'use client';

import { useRef } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Upload, FileText, X } from 'lucide-react';

const MAX_LINKS = 5;
const MAX_PDF_SIZE_MB = 10;

export interface ResourceLinkRow {
  id: string;
  label: string;
  url: string;
}

export interface HowToUseState {
  pdfFile: File | null;      // newly picked file, uploaded on submit
  pdfFileName: string;       // display name for pdfFile
  existingPdfUrl: string;    // already-uploaded URL (pre-filled when editing)
  links: ResourceLinkRow[];
}

export function emptyHowToUse(): HowToUseState {
  return { pdfFile: null, pdfFileName: '', existingPdfUrl: '', links: [] };
}

function emptyLinkRow(): ResourceLinkRow {
  return { id: Math.random().toString(36).slice(2, 10), label: '', url: '' };
}

interface HowToUseEditorProps {
  value: HowToUseState;
  onChange: (value: HowToUseState) => void;
}

// Product-level "How to Use" resources -- one optional PDF plus up to 5
// named links, shared across every variant of the product (variants only
// ever change price/stock/images, never these).
export default function HowToUseEditor({ value, onChange }: HowToUseEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.');
      return;
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      toast.error(`PDF must be under ${MAX_PDF_SIZE_MB}MB.`);
      return;
    }
    onChange({ ...value, pdfFile: file, pdfFileName: file.name, existingPdfUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePdf = () => {
    onChange({ ...value, pdfFile: null, pdfFileName: '', existingPdfUrl: '' });
  };

  const addLink = () => {
    if (value.links.length >= MAX_LINKS) return;
    onChange({ ...value, links: [...value.links, emptyLinkRow()] });
  };

  const updateLink = (id: string, patch: Partial<ResourceLinkRow>) => {
    onChange({ ...value, links: value.links.map(l => (l.id === id ? { ...l, ...patch } : l)) });
  };

  const removeLink = (id: string) => {
    onChange({ ...value, links: value.links.filter(l => l.id !== id) });
  };

  const hasPdf = !!(value.pdfFile || value.existingPdfUrl);

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">
        How to Use <span className="text-gray-400 font-normal">(optional — a PDF guide and/or reference links)</span>
      </label>

      {/* PDF */}
      <div className="mb-3">
        {hasPdf ? (
          <div className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-300 rounded-xl bg-gray-50">
            <FileText className="w-4 h-4 text-gold-hover shrink-0" />
            <span className="flex-1 text-sm text-gray-700 truncate">
              {value.pdfFileName || 'How-to-use.pdf'}
            </span>
            <button type="button" onClick={removePdf} className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 justify-center border-2 border-dashed border-gray-200 rounded-xl px-3.5 py-3 cursor-pointer hover:border-gold-primary hover:bg-gold-primary/5 transition-all text-sm text-gray-500">
            <Upload className="w-4 h-4" /> Upload a PDF guide (max 10MB)
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
          </label>
        )}
      </div>

      {/* Links */}
      <div className="space-y-2">
        {value.links.map((link) => (
          <div key={link.id} className="flex gap-2">
            <input
              type="text"
              placeholder="Link name, e.g. Video Guide"
              value={link.label}
              onChange={e => updateLink(link.id, { label: e.target.value })}
              className="w-2/5 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gold-primary"
            />
            <input
              type="url"
              placeholder="https://..."
              value={link.url}
              onChange={e => updateLink(link.id, { url: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gold-primary"
            />
            <button
              type="button"
              onClick={() => removeLink(link.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {value.links.length < MAX_LINKS && (
          <button
            type="button"
            onClick={addLink}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            + Add Link{value.links.length > 0 ? ` (${value.links.length}/${MAX_LINKS})` : ''}
          </button>
        )}
      </div>
    </div>
  );
}
