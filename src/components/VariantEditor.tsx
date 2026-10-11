'use client';

import { useRef } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Upload, X } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_IMAGES_PER_VARIANT = 5;

export interface VariantRow {
  id: string;
  label: string;
  price: string;
  mrp: string;
  stock: string;
  existingImages: string[]; // already-uploaded URLs (pre-filled when editing)
  imageFiles: File[];       // newly picked files, uploaded on submit
  imagePreviews: string[];  // object URLs for imageFiles, index-aligned
}

export function emptyVariantRow(): VariantRow {
  return {
    id: Math.random().toString(36).slice(2, 10),
    label: '',
    price: '',
    mrp: '',
    stock: '10',
    existingImages: [],
    imageFiles: [],
    imagePreviews: [],
  };
}

interface VariantEditorProps {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

// The only place a product's price/stock/images come from — mirrors the
// existing "Custom Attributes" row-list pattern used elsewhere in these
// forms. A simple product is just one row; add more for different sizes.
export default function VariantEditor({ variants, onChange }: VariantEditorProps) {
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateRow = (id: string, patch: Partial<VariantRow>) => {
    onChange(variants.map(v => (v.id === id ? { ...v, ...patch } : v)));
  };

  const addRow = () => onChange([...variants, emptyVariantRow()]);

  const removeRow = (id: string) => {
    if (variants.length <= 1) return; // always keep at least one option
    const row = variants.find(v => v.id === id);
    row?.imagePreviews.forEach(url => URL.revokeObjectURL(url));
    onChange(variants.filter(v => v.id !== id));
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const row = variants.find(v => v.id === id);
    if (!row) return;
    const currentCount = row.existingImages.length + row.imageFiles.length;
    const available = MAX_IMAGES_PER_VARIANT - currentCount;
    const selected = Array.from(e.target.files || []);

    if (available <= 0) {
      toast.error(`Maximum ${MAX_IMAGES_PER_VARIANT} images per variant.`);
      return;
    }

    const validated: File[] = [];
    for (const file of selected.slice(0, available)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG, WebP allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: must be under ${MAX_FILE_SIZE_MB}MB.`);
        continue;
      }
      validated.push(file);
    }

    const newPreviews = validated.map(f => URL.createObjectURL(f));
    updateRow(id, {
      imageFiles: [...row.imageFiles, ...validated],
      imagePreviews: [...row.imagePreviews, ...newPreviews],
    });

    const inputEl = fileInputRefs.current[id];
    if (inputEl) inputEl.value = '';
  };

  const removeExistingImage = (id: string, idx: number) => {
    const row = variants.find(v => v.id === id);
    if (!row) return;
    updateRow(id, { existingImages: row.existingImages.filter((_, i) => i !== idx) });
  };

  const removeNewImage = (id: string, idx: number) => {
    const row = variants.find(v => v.id === id);
    if (!row) return;
    URL.revokeObjectURL(row.imagePreviews[idx]);
    updateRow(id, {
      imageFiles: row.imageFiles.filter((_, i) => i !== idx),
      imagePreviews: row.imagePreviews.filter((_, i) => i !== idx),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <label className="block text-sm font-bold text-gray-700">
          Pricing, Stock &amp; Images <span className="text-gray-400 font-normal">— one option for a simple product, or more for different sizes</span>
        </label>
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          + Add Option
        </button>
      </div>

      <div className="space-y-3">
        {variants.map((row) => {
          const imageCount = row.existingImages.length + row.imageFiles.length;
          const canRemove = variants.length > 1;
          return (
            <div key={row.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={variants.length > 1 ? 'Label, e.g. Small / 250ml *' : 'Label, e.g. Small / 250ml (optional if this is your only option)'}
                  value={row.label}
                  onChange={e => updateRow(row.id, { label: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gold-primary"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={!canRemove}
                  title={canRemove ? 'Remove option' : 'A product needs at least one option'}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0 disabled:text-gray-300 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="number" min="0" placeholder="Price *" value={row.price}
                  onChange={e => updateRow(row.id, { price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gold-primary"
                />
                <input
                  type="number" min="0" placeholder="MRP" value={row.mrp}
                  onChange={e => updateRow(row.id, { mrp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gold-primary"
                />
                <input
                  type="number" min="0" placeholder="Stock *" value={row.stock}
                  onChange={e => updateRow(row.id, { stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gold-primary"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {row.existingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className="relative group w-12 h-12">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button" onClick={() => removeExistingImage(row.id, idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {row.imagePreviews.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative group w-12 h-12">
                    <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button" onClick={() => removeNewImage(row.id, idx)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {imageCount < MAX_IMAGES_PER_VARIANT && (
                  <label className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold-primary hover:bg-gold-primary/5 transition-all shrink-0">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <input
                      ref={el => { fileInputRefs.current[row.id] = el; }}
                      type="file" multiple accept=".jpg,.jpeg,.png,.webp"
                      onChange={e => handleFileChange(row.id, e)} className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
