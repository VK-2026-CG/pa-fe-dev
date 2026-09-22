/**
 * DLS STUB primitives — the styled layer over `src/headless`. Swap this
 * folder for the real Prudential DLS; keep the exported names + props.
 * Geometry per docs/design/figma-measurements.md; icons per public/icons/MANIFEST.json.
 */
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Carousel as HCarousel,
  Checkbox as HCheckbox,
  Collapse,
  Layer,
  RadioGroup,
  ReorderHandle as HReorderHandle,
  Switch as HSwitch,
  useEscapeKey,
  useFocusTrap,
  type CarouselApi,
} from "@/headless";

/* ── Icon: /public/icons/{token}.svg (DLS export drops in per manifest) ── */
export function Icon({
  token,
  size = 20,
  className,
  style,
  tone,
}: {
  token: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  /** CSS color for monochrome glyphs (uses mask so currentColor-like tint works). */
  tone?: string;
}) {
  const src = `/icons/${token}.svg`;
  if (tone) {
    return (
      <span
        aria-hidden
        className={`icon ${className ?? ""}`}
        style={{
          width: size,
          height: size,
          backgroundColor: tone,
          WebkitMask: `url(${src}) no-repeat center / contain`,
          mask: `url(${src}) no-repeat center / contain`,
          ...style,
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`icon ${className ?? ""}`}
      style={{ width: size, height: size, ...style }}
    >
      <img src={src} alt="" width={size} height={size} />
    </span>
  );
}

export type Tone = "success" | "danger" | "warning" | "info" | "muted";
export function Tag({
  tone,
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`tag ${tone ? `badge-${tone}` : ""} ${className ?? ""}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ pct, brand }: { pct: number; brand?: boolean }) {
  return (
    <div className={`progress ${brand ? "brand" : ""}`} aria-hidden>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function SectionTitleRow({
  title,
  trailing,
}: {
  title: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="section-title-row">
      <span className="title16">{title}</span>
      {trailing}
    </div>
  );
}

/* ── ToggleRow (Switch-B, 343×40) ──────────────────────────────────────── */
export function ToggleRow({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <span className="title14">{label}</span>
      <HSwitch checked={on} onChange={onChange} label={label}>
        {(checked) => <span className={`switch ${checked ? "on" : ""}`} />}
      </HSwitch>
    </div>
  );
}

/* ── CarouselRow: measured snap track + brand dots ─────────────────────── */
export function CarouselRow({
  count,
  children,
  showDots = true,
  className,
  style,
}: {
  count: number;
  children: ReactNode;
  showDots?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <HCarousel
      count={count}
      style={style}
      trackClassName={`carousel-track ${className ?? ""}`}
      dots={
        showDots && count > 1
          ? (api: CarouselApi) => (
              <div className="dots" aria-hidden>
                {Array.from({ length: api.count }, (_, i) => (
                  <i key={i} className={i === api.index ? "on" : ""} />
                ))}
              </div>
            )
          : undefined
      }
    >
      {children}
    </HCarousel>
  );
}

/* ── BottomSheet skin (header 56, rows 52) ─────────────────────────────── */
export function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Layer onClose={onClose} backdropClassName="sheet-backdrop">
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        <div className="sheet-head">
          <span className="title16">{title}</span>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <Icon token="close" size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </Layer>
  );
}

export function SheetRow({
  leadToken,
  label,
  sub,
  trailing,
  onClick,
}: {
  leadToken?: string;
  label: ReactNode;
  sub?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="sheet-row" onClick={onClick}>
      {leadToken && (
        <span className="lead">
          <Icon token={leadToken} size={20} tone="var(--color-text)" />
        </span>
      )}
      <span className="lbl" style={leadToken ? undefined : { marginLeft: 0 }}>
        {label}
        {sub && (
          <span className="sub" style={{ display: "block" }}>
            {sub}
          </span>
        )}
      </span>
      {trailing ?? (
        <Icon token="arrow-right-s" size={20} tone="var(--color-text-muted)" />
      )}
    </button>
  );
}

/* ── Radio sheet options (period picker) ───────────────────────────────── */
export function RadioSheetList<T extends string>({
  value,
  options,
  onChange,
  label,
  sub,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  label: (opt: T) => ReactNode;
  sub?: (opt: T) => ReactNode;
}) {
  return (
    <RadioGroup
      value={value}
      options={options}
      onChange={onChange}
      renderOption={(opt, selected) => (
        <div className="sheet-row" style={{ cursor: "pointer" }}>
          <span className="lbl" style={{ marginLeft: 0 }}>
            {label(opt)}
            {sub?.(opt) && (
              <span className="sub" style={{ display: "block" }}>
                {sub(opt)}
              </span>
            )}
          </span>
          <span className={`radio ${selected ? "on" : ""}`} />
        </div>
      )}
    />
  );
}

/* ── Menu popover (anchored to a `position: relative` ancestor) ─────────
   Not built on `Layer`: `.menu` is `position: absolute` against that
   ancestor, so it must stay a DOM sibling of the backdrop rather than
   nested inside Layer's own (fixed) backdrop element. */
export function MenuPopover({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  useEscapeKey(onClose);
  const trapRef = useRef<HTMLDivElement>(null);
  useFocusTrap(trapRef);
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 25 }}
        onClick={onClose}
      />
      <div ref={trapRef} className="menu" role="menu" tabIndex={-1}>
        {children}
      </div>
    </>
  );
}

/* ── Small buttons ─────────────────────────────────────────────────────── */
export function IconButton({
  token,
  label,
  onClick,
  size = 21,
}: {
  token: string;
  label: string;
  onClick?: () => void;
  size?: number;
}) {
  return (
    <button className="icon-btn" aria-label={label} onClick={onClick}>
      <Icon token={token} size={size} tone="var(--color-text)" />
    </button>
  );
}
export function PeriodButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="period-btn" onClick={onClick}>
      {label} <Icon token="arrow-down-s" size={16} tone="var(--color-text)" />
    </button>
  );
}

/* ── Desktop Filter action (A7, v1.4.0, screenshot-derived) ────────────── */
export function FilterButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="filter-btn" aria-label={label} onClick={onClick}>
      <Icon token="filter" size={16} tone="var(--color-text)" />
      <span className="filter-btn-label">{label}</span>
    </button>
  );
}

/**
 * Metric panel (A7, v1.4.0, screenshot-derived). `isDesktop` gates whether
 * the title/count/collapse header renders at all — not just CSS visibility
 * — so mobile never carries a second, hidden-but-present copy of controls
 * (which broke unique-locator assumptions in a11y/e2e). Below desktop,
 * `.metric-panel` is a bare wrapper and children always render.
 */
export function MetricPanel({
  isDesktop,
  title,
  count,
  action,
  defaultOpen = true,
  children,
}: {
  isDesktop: boolean;
  title: ReactNode;
  count: number;
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  if (!isDesktop) return <div className="metric-panel">{children}</div>;
  return (
    <div className="metric-panel">
      <Collapse
        defaultOpen={defaultOpen}
        trigger={({ open, toggle, buttonProps }) => (
          <div className="metric-panel-head">
            <button
              {...buttonProps}
              className="metric-panel-toggle"
              onClick={toggle}
              disabled={Boolean(action)}
            >
              <span className="title16">{title}</span>
              <span className="count-badge">{count}</span>
            </button>
            <span style={{ flex: 1 }} />
            {action ?? (
              <button
                className="icon-btn"
                aria-label={open ? "Collapse" : "Expand"}
                onClick={toggle}
              >
                <Icon
                  token={open ? "arrow-up-s" : "arrow-down-s"}
                  size={20}
                  tone="var(--color-text)"
                />
              </button>
            )}
          </div>
        )}
      >
        <div className="metric-panel-body">{children}</div>
      </Collapse>
    </div>
  );
}

/**
 * Customize Metrics overlay chrome (S-P4-04, v1.4.0 responsive contract,
 * AC-P4-04-11..31): bottom sheet below `breakpoint.tablet`, right-anchored
 * side sheet at `breakpoint.tablet` and above (`dls.css` media queries own
 * the geometry split — this component only wires backdrop/Escape/focus-trap
 * via `Layer` and the dialog a11y attributes).
 */
export function CustomizeSurface({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Layer onClose={onClose} backdropClassName="cust-backdrop" align="none">
      <div
        className="cust-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cust-title"
      >
        {children}
      </div>
    </Layer>
  );
}

export function CustomizeHeader({
  title,
  closeLabel,
  onClose,
}: {
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="cust-head">
      <h1 id="cust-title">{title}</h1>
      <button className="cust-close" aria-label={closeLabel} onClick={onClose}>
        <Icon token="close" size={24} tone="var(--color-text)" />
      </button>
    </div>
  );
}

/** Scrolls independently of the fixed header/footer (AC-P4-04-12/18/21). */
export function CustomizeScrollArea({ children }: { children: ReactNode }) {
  return <div className="cust-scroll">{children}</div>;
}

export function CustomizeSection({
  title,
  description,
  /** Priority Metrics only — shaded full-width heading band (AC-P4-04-32). */
  shaded,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  shaded?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="cust-section">
      <div className={`cust-section-head ${shaded ? "shaded" : ""}`}>
        <h2>{title}</h2>
        <span className="desc">{description}</span>
      </div>
      <ul className="cust-list">{children}</ul>
    </section>
  );
}

/** Checked box: pink for locked priority rows and chosen focus rows. */
export function SelectionBox({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange?: () => void;
}) {
  return (
    <HCheckbox
      checked={checked}
      disabled={disabled}
      label={label}
      onChange={onChange}
    >
      <span className={`cust-box ${checked ? "on" : ""} ${disabled ? "locked" : ""}`}>
        {checked && (
          <Icon
            className="tick"
            token="check"
            size={16}
            tone="var(--color-surface)"
          />
        )}
      </span>
    </HCheckbox>
  );
}

/** Six-dot skin over the headless mouse/touch/pen/keyboard reorder behavior. */
export function DragHandle({
  label,
  index,
  count,
  onMove,
  onDragStateChange,
}: {
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
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} aria-hidden />
      ))}
    </HReorderHandle>
  );
}

export function CustomizeMetricRow({
  children,
  dragging,
  dropTarget,
  selected,
  reorderIndex,
}: {
  children: ReactNode;
  dragging?: boolean;
  dropTarget?: boolean;
  /** Selected, unlocked row — stronger border treatment (AC-P4-04-25). */
  selected?: boolean;
  reorderIndex?: number;
}) {
  return (
    <li
      className={`cust-row ${dragging ? "dragging" : ""} ${dropTarget ? "drop-target" : ""} ${selected ? "selected" : ""}`}
      {...(reorderIndex === undefined
        ? {}
        : { "data-reorder-index": reorderIndex })}
    >
      {children}
    </li>
  );
}

export function CustomizeActions({ children }: { children: ReactNode }) {
  return <div className="cust-actions">{children}</div>;
}

/**
 * Scope pill (Figma 6588:16960, 108×38) with menu. `icon` prefixes the
 * label. The label span (`.scope-pill-label`) stays in the DOM at every
 * breakpoint — `dls.css` collapses it visually below `breakpoint.tablet`
 * (icon-only) and shows it from `breakpoint.tablet` up, per AC-P4-01-42;
 * `aria-label` keeps the button's accessible name breakpoint-independent.
 */
export function ScopePill({
  icon,
  label,
  ariaLabel,
  options,
  onSelect,
}: {
  icon?: string;
  label: string;
  ariaLabel?: string;
  options: Array<{ key: string; label: string; selected: boolean }>;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="scope-control">
      <button
        className="scope-pill"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        {icon && <Icon token={icon} size={20} tone="var(--color-text)" />}
        <span className="scope-pill-label">{label}</span>
        <Icon token="arrow-down-s" size={16} tone="var(--color-text)" />
      </button>
      {open && (
        <MenuPopover onClose={() => setOpen(false)}>
          {options.map((o) => (
            <button
              key={o.key}
              className="sheet-row"
              role="menuitem"
              style={{ padding: "0 14px" }}
              onClick={() => {
                setOpen(false);
                onSelect(o.key);
              }}
            >
              <span className="lbl" style={{ marginLeft: 0 }}>
                {o.label}
              </span>
              {o.selected ? <span aria-hidden>✓</span> : <span />}
            </button>
          ))}
        </MenuPopover>
      )}
    </span>
  );
}
