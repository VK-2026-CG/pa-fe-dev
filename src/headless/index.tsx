/**
 * Headless primitives — behavior + a11y only. No colors, sizes, or class
 * opinions; every visual hook comes in via className/style/render props.
 * The styled skin over these lives in `src/dls-stub/` (swap target for the
 * real DLS). Keep this file dependency-free.
 */
import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react';

/* ── Carousel: horizontal scroll-snap track + active-index tracking ────── */
export interface CarouselApi { index: number; count: number; scrollTo: (i: number) => void }
export function Carousel({
  count, className, style, trackClassName, trackStyle, children, dots,
}: {
  count: number;
  className?: string; style?: CSSProperties;
  trackClassName?: string; trackStyle?: CSSProperties;
  children: ReactNode;
  /** Render-prop for the pagination indicator (dots), fed live state. */
  dots?: (api: CarouselApi) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el || el.children.length === 0) return;
    const first = el.children[0] as HTMLElement;
    const second = el.children[1] as HTMLElement | undefined;
    const pitch = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth || 1;
    setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / pitch))));
  }, [count]);
  const scrollTo = useCallback((i: number) => {
    const el = ref.current;
    if (!el) return;
    const child = el.children[i] as HTMLElement | undefined;
    if (child) el.scrollTo({ left: child.offsetLeft - (el.children[0] as HTMLElement).offsetLeft, behavior: 'smooth' });
  }, []);
  const api = useMemo<CarouselApi>(() => ({ index, count, scrollTo }), [index, count, scrollTo]);
  return (
    <div className={className} style={style}>
      <div ref={ref} className={trackClassName} style={trackStyle} onScroll={onScroll}>
        {children}
      </div>
      {dots?.(api)}
    </div>
  );
}

/**
 * useIsDesktop — reads the `--bp-desktop-min` custom property dls.css
 * defines (the only place breakpoint pixel values may live) so this stays
 * behavior-only; the styled layer owns the number. SSR/first paint is
 * `false` (mobile-first); resolves on mount and tracks live resizes.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--bp-desktop-min').trim();
    const mql = window.matchMedia(`(min-width: ${raw || '1024px'})`);
    const sync = () => setIsDesktop(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);
  return isDesktop;
}

/**
 * useIsTabletUp — same pattern as `useIsDesktop`, reading `--bp-tablet-min`
 * (768px) instead of `--bp-desktop-min`. True at `breakpoint.tablet` and
 * `breakpoint.desktop`; false only below 768px (mobile).
 */
export function useIsTabletUp(): boolean {
  const [isTabletUp, setIsTabletUp] = useState(false);
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--bp-tablet-min').trim();
    const mql = window.matchMedia(`(min-width: ${raw || '768px'})`);
    const sync = () => setIsTabletUp(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, []);
  return isTabletUp;
}

/* ── Collapse: disclosure with a11y wiring (reco panel, accordions) ────── */
export function Collapse({
  open: openProp, defaultOpen = false, onOpenChange, trigger, children,
}: {
  open?: boolean; defaultOpen?: boolean; onOpenChange?: (o: boolean) => void;
  trigger: (state: { open: boolean; toggle: () => void; buttonProps: Record<string, unknown> }) => ReactNode;
  children: ReactNode;
}) {
  const [own, setOwn] = useState(defaultOpen);
  const open = openProp ?? own;
  const id = useId();
  const toggle = () => { const next = !open; setOwn(next); onOpenChange?.(next); };
  return (
    <>
      {trigger({ open, toggle, buttonProps: { 'aria-expanded': open, 'aria-controls': id } })}
      {open && <div id={id}>{children}</div>}
    </>
  );
}

/* ── Tabs (roving, controlled) ─────────────────────────────────────────── */
export function Tabs<T extends string>({
  value, options, onChange, className, renderTab,
}: {
  value: T; options: T[]; onChange: (v: T) => void; className?: string;
  renderTab: (opt: T, selected: boolean) => ReactNode;
}) {
  return (
    <div role="tablist" className={className}>
      {options.map((opt) => (
        <button key={opt} role="tab" aria-selected={opt === value} tabIndex={opt === value ? 0 : -1}
          onClick={() => onChange(opt)}>
          {renderTab(opt, opt === value)}
        </button>
      ))}
    </div>
  );
}

/* ── Switch (toggle) ───────────────────────────────────────────────────── */
export function Switch({
  checked, onChange, label, className, children,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
  className?: string; children: (checked: boolean) => ReactNode;
}) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} className={className}
      onClick={() => onChange(!checked)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
      {children(checked)}
    </button>
  );
}

/* ── Checkbox ──────────────────────────────────────────────────────────── */
export function Checkbox({
  checked, disabled, onChange, label, className, children,
}: {
  checked: boolean; disabled?: boolean; onChange?: () => void; label: string;
  className?: string; children: ReactNode;
}) {
  return (
    <button role="checkbox" aria-checked={checked} aria-label={label} disabled={disabled}
      className={className} onClick={disabled ? undefined : onChange}
      style={{ background: 'none', border: 0, padding: 0, cursor: disabled ? 'default' : 'pointer' }}>
      {children}
    </button>
  );
}

/* ── ReorderHandle: pointer/touch/pen + keyboard, no visual opinions ────── */
export function ReorderHandle({
  index, count, label, className, onMove, onDragStateChange, children,
}: {
  index: number;
  count: number;
  label: string;
  className?: string;
  onMove: (from: number, to: number) => void;
  onDragStateChange?: (from: number | null, over: number | null) => void;
  children: ReactNode;
}) {
  const target = useRef(index);

  const targetAt = (clientX: number, clientY: number): number => {
    const row = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-reorder-index]');
    const value = Number(row?.dataset.reorderIndex);
    return Number.isInteger(value) && value >= 0 && value < count ? value : target.current;
  };

  const finish = (e: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!cancelled) onMove(index, target.current);
    target.current = index;
    onDragStateChange?.(null, null);
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); onMove(index, index - 1); }
        if (e.key === 'ArrowDown' && index < count - 1) { e.preventDefault(); onMove(index, index + 1); }
      }}
      onPointerDown={(e) => {
        if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault();
        target.current = index;
        e.currentTarget.setPointerCapture(e.pointerId);
        onDragStateChange?.(index, index);
      }}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        target.current = targetAt(e.clientX, e.clientY);
        onDragStateChange?.(index, target.current);
      }}
      onPointerUp={(e) => finish(e)}
      onPointerCancel={(e) => finish(e, true)}
    >
      {children}
    </button>
  );
}

/** Escape-to-dismiss for any overlay (sheets, menus) — the one place the key listener lives. */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useFocusTrap — on mount, moves focus into the container (first focusable
 * element, falling back to the container itself) and cycles Tab/Shift+Tab
 * within it; on unmount, returns focus to whatever was focused before.
 * Shared by every `Layer`-based sheet/menu (Filter, More actions, Customize).
 */
export function useFocusTrap(containerRef: { current: HTMLElement | null }): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    // `preventScroll` throughout: focusing a sheet control must never move
    // the page underneath it (dashboard scroll position is contractual —
    // S-P4-04 AC-P4-04-33/S-P4-01 AC-P4-01-58).
    (getFocusable()[0] ?? container).focus({ preventScroll: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [containerRef]);
}

/* ── Layer (backdrop + Escape/outside dismiss + focus trap) → sheets & menus ── */
export function Layer({
  onClose, backdropClassName, children, align = 'end',
}: {
  onClose: () => void; backdropClassName?: string; children: ReactNode;
  align?: 'end' | 'none';
}) {
  useEscapeKey(onClose);
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef);
  return (
    <div className={backdropClassName} onClick={onClose}
      style={align === 'end' ? { display: 'flex', alignItems: 'flex-end', justifyContent: 'center' } : undefined}>
      <div
        ref={trapRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ width: align === 'end' ? '100%' : undefined, outline: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── RadioGroup ────────────────────────────────────────────────────────── */
export function RadioGroup<T extends string>({
  value, options, onChange, renderOption, className, labelledBy,
}: {
  value: T; options: T[]; onChange: (v: T) => void; className?: string;
  renderOption: (opt: T, selected: boolean) => ReactNode;
  /** id of the element that names the group (e.g. its section heading). */
  labelledBy?: string;
}) {
  return (
    <div role="radiogroup" className={className} aria-labelledby={labelledBy}>
      {options.map((opt) => (
        <div key={opt} role="radio" aria-checked={opt === value} tabIndex={0}
          onClick={() => onChange(opt)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onChange(opt); }}
          style={{ cursor: 'pointer' }}>
          {renderOption(opt, opt === value)}
        </div>
      ))}
    </div>
  );
}

/* ── Progress math ─────────────────────────────────────────────────────── */
export function clampPct(pct: number | undefined | null): number {
  return Math.max(0, Math.min(100, pct ?? 0));
}
