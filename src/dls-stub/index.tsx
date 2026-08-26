'use client';
/**
 * DLS STUB primitives — the styled layer over `src/headless`. Swap this
 * folder for the real Prudential DLS; keep the exported names + props.
 * Geometry per docs/design/figma-measurements.md; icons per public/icons/MANIFEST.json.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  Carousel as HCarousel, Checkbox as HCheckbox, Layer, RadioGroup,
  ReorderHandle as HReorderHandle, Switch as HSwitch, type CarouselApi,
} from '@/headless';

/* ── Icon: /public/icons/{token}.svg (DLS export drops in per manifest) ── */
export function Icon({ token, size = 20, className, style, tone }: {
  token: string; size?: number; className?: string; style?: CSSProperties;
  /** CSS color for monochrome glyphs (uses mask so currentColor-like tint works). */
  tone?: string;
}) {
  const src = `/icons/${token}.svg`;
  if (tone) {
    return (
      <span aria-hidden className={`icon ${className ?? ''}`}
        style={{ width: size, height: size, backgroundColor: tone,
          WebkitMask: `url(${src}) no-repeat center / contain`, mask: `url(${src}) no-repeat center / contain`, ...style }} />
    );
  }
  return (
    <span aria-hidden className={`icon ${className ?? ''}`} style={{ width: size, height: size, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={size} height={size} />
    </span>
  );
}

export type Tone = 'success' | 'danger' | 'warning' | 'info' | 'muted';
export function Tag({ tone, children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`tag ${tone ? `badge-${tone}` : ''} ${className ?? ''}`}>{children}</span>;
}

export function ProgressBar({ pct, brand }: { pct: number; brand?: boolean }) {
  return (
    <div className={`progress ${brand ? 'brand' : ''}`} aria-hidden>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function SectionTitleRow({ title, trailing }: { title: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="section-title-row">
      <span className="title16">{title}</span>
      {trailing}
    </div>
  );
}

/* ── ToggleRow (Switch-B, 343×40) ──────────────────────────────────────── */
export function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <span className="title14">{label}</span>
      <HSwitch checked={on} onChange={onChange} label={label}>
        {(checked) => <span className={`switch ${checked ? 'on' : ''}`} />}
      </HSwitch>
    </div>
  );
}

/* ── CarouselRow: measured snap track + brand dots ─────────────────────── */
export function CarouselRow({ count, children, showDots = true }: { count: number; children: ReactNode; showDots?: boolean }) {
  return (
    <HCarousel
      count={count}
      trackClassName="carousel-track"
      dots={showDots && count > 1 ? (api: CarouselApi) => (
        <div className="dots" aria-hidden>
          {Array.from({ length: api.count }, (_, i) => <i key={i} className={i === api.index ? 'on' : ''} />)}
        </div>
      ) : undefined}
    >
      {children}
    </HCarousel>
  );
}

/* ── BottomSheet skin (header 56, rows 52) ─────────────────────────────── */
export function BottomSheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <Layer onClose={onClose} backdropClassName="sheet-backdrop">
      <div className="sheet" role="dialog" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="sheet-head">
          <span className="title16">{title}</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon token="close" size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </Layer>
  );
}

export function SheetRow({ leadToken, label, sub, trailing, onClick }: {
  leadToken?: string; label: ReactNode; sub?: ReactNode; trailing?: ReactNode; onClick?: () => void;
}) {
  return (
    <button className="sheet-row" onClick={onClick}>
      {leadToken && <span className="lead"><Icon token={leadToken} size={20} tone="var(--color-text)" /></span>}
      <span className="lbl" style={leadToken ? undefined : { marginLeft: 0 }}>
        {label}
        {sub && <span className="sub" style={{ display: 'block' }}>{sub}</span>}
      </span>
      {trailing ?? <Icon token="arrow-right-s" size={20} tone="var(--color-text-muted)" />}
    </button>
  );
}

/* ── Radio sheet options (period picker) ───────────────────────────────── */
export function RadioSheetList<T extends string>({ value, options, onChange, label, sub }: {
  value: T; options: T[]; onChange: (v: T) => void;
  label: (opt: T) => ReactNode; sub?: (opt: T) => ReactNode;
}) {
  return (
    <RadioGroup value={value} options={options} onChange={onChange}
      renderOption={(opt, selected) => (
        <div className="sheet-row" style={{ cursor: 'pointer' }}>
          <span className="lbl" style={{ marginLeft: 0 }}>
            {label(opt)}
            {sub?.(opt) && <span className="sub" style={{ display: 'block' }}>{sub(opt)}</span>}
          </span>
          <span className={`radio ${selected ? 'on' : ''}`} />
        </div>
      )} />
  );
}

/* ── Menu popover (anchored) ───────────────────────────────────────────── */
export function MenuPopover({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 25 }} onClick={onClose} />
      <div className="menu" role="menu">{children}</div>
    </>
  );
}

/* ── Small buttons ─────────────────────────────────────────────────────── */
export function IconButton({ token, label, onClick, size = 21 }: { token: string; label: string; onClick?: () => void; size?: number }) {
  return (
    <button className="icon-btn" aria-label={label} onClick={onClick}>
      <Icon token={token} size={size} tone="var(--color-text)" />
    </button>
  );
}
export function PeriodButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="period-btn" onClick={onClick}>
      {label} <Icon token="arrow-down-s" size={16} tone="var(--color-text)" />
    </button>
  );
}

/* ── Customize Metrics skin (S-P4-04): white sheet + rounded pill rows ─── */
export function CustomizeSurface({ children }: { children: ReactNode }) {
  return <div className="cust-surface">{children}</div>;
}

export function CustomizeHeader({ title, closeLabel, onClose }: {
  title: ReactNode; closeLabel: string; onClose: () => void;
}) {
  return (
    <div className="cust-head">
      <h1>{title}</h1>
      <button className="cust-close" aria-label={closeLabel} onClick={onClose}>
        <Icon token="close" size={24} tone="var(--color-text)" />
      </button>
    </div>
  );
}

export function CustomizeSection({ title, description, children }: {
  title: ReactNode; description: ReactNode; children: ReactNode;
}) {
  return (
    <section className="cust-section">
      <h2>{title}</h2>
      <span className="desc">{description}</span>
      <ul className="cust-list">{children}</ul>
    </section>
  );
}

/** Checked box: pink for locked priority rows and chosen focus rows. */
export function SelectionBox({ checked, disabled, label, onChange }: {
  checked: boolean; disabled?: boolean; label: string; onChange?: () => void;
}) {
  return (
    <HCheckbox checked={checked} disabled={disabled} label={label} onChange={onChange}>
      <span className={`cust-box ${checked ? 'on' : ''}`}>
        {checked && <Icon className="tick" token="check" size={16} tone="var(--color-surface)" />}
      </span>
    </HCheckbox>
  );
}

/** Six-dot skin over the headless mouse/touch/pen/keyboard reorder behavior. */
export function DragHandle({ label, index, count, onMove, onDragStateChange }: {
  label: string;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onDragStateChange: (from: number | null, over: number | null) => void;
}) {
  return (
    <HReorderHandle
      className="cust-grip"
      label={label}
      index={index}
      count={count}
      onMove={onMove}
      onDragStateChange={onDragStateChange}
    >
      {Array.from({ length: 6 }, (_, i) => <i key={i} aria-hidden />)}
    </HReorderHandle>
  );
}

export function CustomizeMetricRow({ children, dragging, dropTarget, reorderIndex }: {
  children: ReactNode;
  dragging?: boolean;
  dropTarget?: boolean;
  reorderIndex?: number;
}) {
  return (
    <li
      className={`cust-row ${dragging ? 'dragging' : ''} ${dropTarget ? 'drop-target' : ''}`}
      {...(reorderIndex === undefined ? {} : { 'data-reorder-index': reorderIndex })}
    >
      {children}
    </li>
  );
}

export function CustomizeActions({ children }: { children: ReactNode }) {
  return <div className="cust-actions">{children}</div>;
}

/* ── Scope pill (108×38) with menu ─────────────────────────────────────── */
export function ScopePill({ label, options, onSelect }: {
  label: string; options: Array<{ key: string; label: string; selected: boolean }>; onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="scope-control">
      <button className="scope-pill" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} <Icon token="arrow-down-s" size={16} tone="var(--color-text)" />
      </button>
      {open && (
        <MenuPopover onClose={() => setOpen(false)}>
          {options.map((o) => (
            <button key={o.key} className="sheet-row" role="menuitem" style={{ padding: '0 14px' }}
              onClick={() => { setOpen(false); onSelect(o.key); }}>
              <span className="lbl" style={{ marginLeft: 0 }}>{o.label}</span>
              {o.selected ? <span aria-hidden>✓</span> : <span />}
            </button>
          ))}
        </MenuPopover>
      )}
    </span>
  );
}
