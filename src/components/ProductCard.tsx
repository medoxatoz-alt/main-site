import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, Check, Plus } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  category: string;
  price: number | string;
  mrp?: number | string;
  image: string | string[];
  images?: string[];
  stock?: number | string;
}

interface ProductCardProps {
  product: Product;
  /** Callback fired when the user clicks the add to cart button */
  onAddToCart?: (product: Product) => void | Promise<void>;
}

// ----------------------------------------------------------------------
// Helper Functions (Extracted to keep the component lightweight)
// ----------------------------------------------------------------------

const parseImages = (imageProp: string | string[]): string[] => {
  if (Array.isArray(imageProp)) return imageProp;
  if (typeof imageProp !== 'string') return ['https://via.placeholder.com/200?text=No+Image'];

  const trimmed = imageProp.trim();
  
  // Handle JSON array strings
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return JSON.parse(trimmed) as string[];
    } catch {
      // Silently fall back to standard parsing on failure
    }
  }
  
  // Handle comma-separated strings
  if (trimmed.includes(',')) {
    return trimmed.split(',').map((img) => img.trim());
  }
  
  return trimmed ? [trimmed] : ['https://via.placeholder.com/200?text=No+Image'];
};

const parsePrice = (val: number | string | undefined): number => {
  if (!val) return 0;
  return typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val);
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddedRecently, setIsAddedRecently] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Parse data
  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    return parseImages(product.image);
  }, [product?.image, product?.images]);
  const price = useMemo(() => parsePrice(product?.price), [product?.price]);
  const mrp = useMemo(() => parsePrice(product?.mrp), [product?.mrp]);

  const discountPercentage = useMemo(() => {
    if (mrp && mrp > price) {
      return Math.round(((mrp - price) / mrp) * 100);
    }
    return 0;
  }, [price, mrp]);

  const isOutOfStock = useMemo(() => {
    if (!product) return true;
    const stockVal = product.stock !== undefined ? Number(product.stock) : 10;
    return stockVal <= 0;
  }, [product?.stock, product]);

  // Cycle through images on hover
  useEffect(() => {
    if (!isHovered || images.length <= 1) {
      setCurrentImageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  if (!product) {
    return null;
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding || isAddedRecently) return;
    if (onAddToCart) {
      setIsAdding(true);
      try {
        await onAddToCart(product);
        setIsAddedRecently(true);
        setTimeout(() => setIsAddedRecently(false), 1800);
      } finally {
        setIsAdding(false);
      }
    } else {
      console.warn('onAddToCart prop is not provided for ProductCard');
    }
  };


  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-white rounded-2xl border border-line p-2 sm:p-2.5 transition-[box-shadow,border-color,transform] duration-300 ease-[var(--ease-out-expo)] hover:border-gray-300 hover:shadow-[0_10px_30px_-8px_rgba(16,24,40,0.14)] active:scale-[0.985] animate-in fade-in animation-duration-500"
    >
      {/* Image tile — uniform grey backdrop so mixed product photos look consistent */}
      <Link
        href={`/product/${product.id}`}
        className="block"
        aria-label={`View details for ${product.title}`}
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f3f4f6]">
          {/* Only mount the extra images once hovered — otherwise every card in
              the grid would eagerly fetch every image up front. */}
          {(isHovered ? images : images.slice(0, 1)).map((imgUrl, idx) => (
            <img
              key={idx}
              src={imgUrl}
              alt={`${product.title} - view ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={idx === 0 ? () => setImgLoaded(true) : undefined}
              onError={idx === 0 ? () => setImgLoaded(true) : undefined}
              ref={idx === 0 ? (el) => { if (el?.complete) setImgLoaded(true); } : undefined}
              className={`absolute inset-0 m-auto max-w-[88%] max-h-[88%] object-contain mix-blend-multiply transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] ${
                idx === currentImageIndex && (idx > 0 || imgLoaded) ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } ${isOutOfStock ? 'grayscale opacity-60' : ''} group-hover:scale-[1.05]`}
            />
          ))}

          {/* Badge */}
          {isOutOfStock ? (
            <span className="absolute top-2 left-2 text-[10.5px] sm:text-[11px] font-semibold text-gray-600 bg-white/95 rounded-md px-1.5 py-0.5 shadow-sm">
              Out of stock
            </span>
          ) : discountPercentage > 0 ? (
            <span className="absolute top-2 left-2 text-[10.5px] sm:text-[11px] font-semibold text-emerald-700 bg-white/95 rounded-md px-1.5 py-0.5 shadow-sm tabular-nums">
              {discountPercentage}% off
            </span>
          ) : null}

          {/* Image progress (desktop hover) */}
          {images.length > 1 && isHovered && (
            <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 animate-in fade-in duration-200">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? 'w-4 bg-ink' : 'w-1 bg-black/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 flex flex-col px-1 pt-2.5 sm:px-1.5 sm:pt-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="text-[13px] sm:text-[14px] leading-[1.4] font-medium text-ink line-clamp-2 min-h-[2.8em]">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1.5 whitespace-nowrap overflow-hidden">
          <span className="text-[15px] sm:text-[16px] font-semibold text-ink tabular-nums">
            ₹{price.toLocaleString('en-IN')}
          </span>
          {mrp > price && (
            <span className="text-[12px] text-gray-400 line-through tabular-nums">₹{mrp.toLocaleString('en-IN')}</span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className={`pressable relative z-10 mt-2.5 w-full h-9 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 border ${
            isOutOfStock
              ? 'bg-gray-50 text-gray-400 border-line cursor-not-allowed'
              : isAddedRecently
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-ink border-gray-200 hover:bg-ink hover:text-white hover:border-ink disabled:opacity-60'
          }`}
          aria-label={isOutOfStock ? `${product.title} is out of stock` : `Add ${product.title} to cart`}
        >
          {isOutOfStock ? (
            <span>Sold out</span>
          ) : isAddedRecently ? (
            <>
              <Check className="w-4 h-4 stroke-[2.5] animate-in zoom-in-50 duration-300" />
              <span>Added</span>
            </>
          ) : isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[2.25]" />
              <span>Add to cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}