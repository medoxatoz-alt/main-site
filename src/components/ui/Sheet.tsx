'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Side = 'right' | 'left' | 'bottom';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  /** Classes for the sliding panel (width, background, etc.). */
  className?: string;
  /** Accessible name for the dialog. */
  label?: string;
  zIndex?: number;
  /** Show the grab handle at the top of bottom sheets. */
  handle?: boolean;
  children: React.ReactNode;
}

const DURATION = 380; // ms — matches --ease-sheet feel on iOS/Android

// Shared across every open sheet so nested sheets don't unlock the page early.
let lockCount = 0;
function lockScroll() {
  if (lockCount++ === 0) {
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;
  }
}
function unlockScroll() {
  if (--lockCount <= 0) {
    lockCount = 0;
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

/**
 * A native-feeling slide-over panel.
 * - Animates in AND out (stays mounted until the exit finishes).
 * - Swipe to dismiss: sideways for side sheets, down for bottom sheets.
 * - Locks page scroll, closes on Escape / backdrop tap, respects safe areas.
 */
export default function Sheet({
  open,
  onClose,
  side = 'right',
  className = '',
  label,
  zIndex = 2000,
  handle = true,
  children,
}: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number; t: number; axisLocked: boolean | null } | null>(null);

  // Mount → next frame slide in; close → slide out → unmount.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => {
      setMounted(false);
      setDrag(0);
    }, DURATION);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    lockScroll();
    return unlockScroll;
  }, [mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ---- Swipe to dismiss -------------------------------------------------
  const vertical = side === 'bottom';
  const dismissSign = side === 'left' ? -1 : 1; // direction that closes it

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return; // touch / pen only
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, [data-no-drag]')) return;
    // Bottom sheets: drag from the handle/header so the content can still scroll.
    if (vertical && !target.closest('[data-sheet-handle]')) return;
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), axisLocked: null };
  }, [vertical]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.axisLocked === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      // Lock to our axis only if the gesture is clearly along it.
      s.axisLocked = vertical ? Math.abs(dy) > Math.abs(dx) : Math.abs(dx) > Math.abs(dy) * 1.2;
      if (!s.axisLocked) { start.current = null; return; }
      setDragging(true);
    }
    const delta = (vertical ? dy : dx) * dismissSign;
    // Rubber-band when pulling the wrong way.
    setDrag(delta > 0 ? delta : delta / 6);
  }, [vertical, dismissSign]);

  const endDrag = useCallback(() => {
    const s = start.current;
    start.current = null;
    if (!dragging || !s) { setDragging(false); return; }
    const size = vertical ? panelRef.current?.offsetHeight ?? 400 : panelRef.current?.offsetWidth ?? 400;
    const velocity = drag / Math.max(1, performance.now() - s.t);
    setDragging(false);
    if (drag > size * 0.3 || velocity > 0.6) {
      onClose();
    } else {
      setDrag(0);
    }
  }, [dragging, drag, vertical, onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  const offscreen = vertical ? 'translate3d(0,calc(100% + 48px),0)' : side === 'left' ? 'translate3d(-100%,0,0)' : 'translate3d(100%,0,0)';
  const dragPx = drag * dismissSign;
  const transform = !shown
    ? offscreen
    : vertical
      ? `translate3d(0,${dragPx}px,0)`
      : `translate3d(${dragPx}px,0,0)`;

  const size = vertical ? panelRef.current?.offsetHeight : panelRef.current?.offsetWidth;
  const backdropOpacity = shown ? Math.max(0, 1 - Math.max(0, drag) / ((size ?? 500) * 1.2)) : 0;

  const position =
    side === 'bottom'
      ? 'left-0 right-0 bottom-0 max-h-[92dvh] rounded-t-[20px] pb-safe'
      : side === 'left'
        ? 'left-0 top-0 bottom-0 h-dvh'
        : 'right-0 top-0 bottom-0 h-dvh';

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }} role="dialog" aria-modal="true" aria-label={label}>
      <div
        className="absolute inset-0 bg-black/40"
        style={{
          opacity: backdropOpacity,
          transition: dragging ? 'none' : `opacity ${DURATION}ms var(--ease-sheet)`,
        }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`absolute flex flex-col bg-white shadow-[0_0_40px_rgba(0,0,0,0.18)] overscroll-contain will-change-transform ${position} ${className}`}
        style={{
          transform,
          transition: dragging ? 'none' : `transform ${DURATION}ms var(--ease-sheet)`,
          touchAction: 'pan-y',
        }}
      >
        {/* Off-screen extension: when the sheet is pulled past its resting
            point (rubber-band), this fills the gap so nothing shows through. */}
        <div
          aria-hidden
          className={`absolute pointer-events-none ${vertical ? 'sm:hidden' : ''}`}
          style={
            vertical
              ? { left: 0, right: 0, top: '100%', height: '100vh', background: 'inherit' }
              : side === 'left'
                ? { top: 0, bottom: 0, right: '100%', width: '100vw', background: 'inherit' }
                : { top: 0, bottom: 0, left: '100%', width: '100vw', background: 'inherit' }
          }
        />
        {vertical && handle && (
          <div data-sheet-handle className="flex justify-center pt-2.5 pb-1 shrink-0 touch-none" aria-hidden>
            <span className="h-1 w-9 rounded-full bg-gray-300" />
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
