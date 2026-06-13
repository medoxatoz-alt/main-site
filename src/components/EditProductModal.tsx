'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_IMAGES = 5;

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
}

export default function EditProductModal({ isOpen, onClose, onSuccess, product }: EditProductModalProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMrp, setNewMrp] = useState('');
  const [newCategory, setNewCategory] = useState('Medical Products');
  const [newStock, setNewStock] = useState('10');
  const [newDescription, setNewDescription] = useState('');
  
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseImages = (imageProp: any): string[] => {
    if (!imageProp) return [];
    if (Array.isArray(imageProp)) return imageProp.flat().filter(img => typeof img === 'string' && img.trim() !== '');
    if (typeof imageProp !== 'string') return [];
    const trimmed = imageProp.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try { return JSON.parse(trimmed) as string[]; } catch { }
    }
    if (trimmed.includes(',')) return trimmed.split(',').map((img) => img.trim());
    return [trimmed];
  };

  useEffect(() => {
    if (isOpen && product) {
      setNewTitle(product.title || '');
      // Handle comma-separated prices
      const rawPrice = product.price ? String(product.price).replace(/,/g, '') : '';
      setNewPrice(rawPrice);
      setNewMrp(product.mrp ? String(product.mrp).replace(/,/g, '') : '');
      setNewCategory(product.category || 'Medical Products');
      setNewStock(product.stock !== undefined ? String(product.stock) : '10');
      setNewDescription(product.description || '');

      let initialImages = parseImages(product.images);
      if (initialImages.length === 0) {
        initialImages = parseImages(product.image);
      }
      
      setExistingImages(initialImages);
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [isOpen, product]);

  if (!isOpen) return null;

  const totalImages = existingImages.length + imageFiles.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const available = MAX_IMAGES - totalImages;

    if (available <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed.`);
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
    setImageFiles(prev => [...prev, ...validated]);
    setImagePreviews(prev => [...prev, ...newPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingImage = (idx: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Upload any new images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls.push(res.data.url);
      }

      // Combine existing images with newly uploaded ones
      const finalImages = [...existingImages, ...uploadedUrls];
      const thumbnail = finalImages[0] || 'https://via.placeholder.com/200?text=No+Image';

      await api.put(`/products/${product.id}`, {
        title: newTitle,
        price: Number(newPrice),
        mrp: newMrp ? Number(newMrp) : undefined,
        category: newCategory,
        stock: Number(newStock),
        description: newDescription,
        images: finalImages,
        image: thumbnail,   // backwards-compat alias
        thumbnail,
      });

      toast.success('Product updated successfully!');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update product:', err);
      const errMsg = err?.response?.data?.error || 'Failed to update product.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[640px] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="edit-product-form" onSubmit={handleEditProduct} className="flex flex-col gap-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Product Title *</label>
              <input
                type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                placeholder="e.g., Digital Blood Pressure Monitor"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
              />
            </div>

            {/* Price / MRP / Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Price (₹) *</label>
                <input
                  type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} required
                  placeholder="2500"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">MRP (₹)</label>
                <input
                  type="number" min="0" value={newMrp} onChange={e => setNewMrp(e.target.value)}
                  placeholder="3000"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Stock</label>
                <input
                  type="number" min="0" value={newStock} onChange={e => setNewStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Category *</label>
              <select
                value={newCategory} onChange={e => setNewCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 bg-white"
              >
                <option value="Diagnostics Products">Diagnostics Products</option>
                <option value="Medical Products">Medical Products</option>
                <option value="Skin & Hair Care">Skin &amp; Hair Care</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
              <textarea
                value={newDescription} onChange={e => setNewDescription(e.target.value)}
                rows={2} placeholder="Brief product description..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:border-gold-primary focus:ring-2 focus:ring-gold-primary/20 resize-none"
              />
            </div>

            {/* Multi-image uploader */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Product Images <span className="text-gray-400 font-normal">({totalImages}/{MAX_IMAGES} · JPG, PNG, WebP · Max 5MB each)</span>
              </label>

              {/* Previews grid */}
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {/* Existing Images */}
                  {existingImages.map((url, idx) => (
                    <div key={`exist-${idx}`} className="relative group aspect-square">
                      <img src={url} alt={`Existing ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-gold-primary text-text-main text-[9px] font-bold px-1.5 py-0.5 rounded">
                          MAIN
                        </div>
                      )}
                      <button
                        type="button" onClick={() => removeExistingImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  
                  {/* New Upload Previews */}
                  {imagePreviews.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square">
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                      {existingImages.length === 0 && idx === 0 && (
                        <div className="absolute top-1 left-1 bg-gold-primary text-text-main text-[9px] font-bold px-1.5 py-0.5 rounded">
                          MAIN
                        </div>
                      )}
                      <button
                        type="button" onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              {totalImages < MAX_IMAGES && (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-gold-primary hover:bg-gold-primary/5 transition-all">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">Click to add images</p>
                    <p className="text-xs text-gray-400 mt-0.5">or drag & drop here</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file" multiple accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange} className="hidden"
                  />
                </label>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 flex-shrink-0">
          <button
            type="button" onClick={handleClose}
            className="px-5 py-2.5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 font-semibold rounded-xl transition-all text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit" form="edit-product-form" disabled={isSubmitting}
            className="px-6 py-2.5 bg-gold-primary hover:bg-gold-hover text-text-main font-bold rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
