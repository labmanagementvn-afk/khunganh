import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Icon, type IconName } from './Icon';

export interface TimelineItem {
  id: string;
  label: string;
  icon: IconName;
  start: number;
  end: number;
}

interface Props {
  duration: number;
  /** Đoạn video được giữ lại khi xuất */
  trim: { start: number; end: number };
  onTrim: (t: { start: number; end: number }) => void;
  /** Theo thứ tự lớp (phần tử cuối nằm trên cùng) – hiển thị lớp trên cùng ở hàng đầu như CapCut */
  items: TimelineItem[];
  selected: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, t: { start: number; end: number }) => void;
  /** Thời điểm đang phát (đọc liên tục để vẽ vạch phát) */
  getTime: () => number;
  onSeek: (t: number) => void;
}

const MIN_LEN = 0.3;
const SNAP_PX = 8;
const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

type Drag =
  | { mode: 'move' | 'left' | 'right'; id: string; x0: number; start0: number; end0: number }
  | { mode: 'trim-left' | 'trim-right'; x0: number; start0: number; end0: number }
  | { mode: 'seek' };

/** Timeline kiểu CapCut: kéo thanh để dời, kéo mép để đổi thời lượng, kéo trên thước để tua */
export function Timeline({ duration, trim, onTrim, items, selected, onSelect, onChange, getTime, onSeek }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [boxWidth, setBoxWidth] = useState(320);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<Drag | null>(null);
  const width = Math.max(1, boxWidth * zoom);
  const d = Math.max(0.1, duration);
  const toX = (t: number) => (t / d) * width;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setBoxWidth(el.clientWidth - 2);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Vạch phát cập nhật theo từng khung hình (không render lại React)
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = getTime();
      if (headRef.current) headRef.current.style.transform = `translateX(${toX(t)}px)`;
      if (timeRef.current) timeRef.current.textContent = fmt(t);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  });

  const timeAt = (clientX: number) => {
    const r = innerRef.current!.getBoundingClientRect();
    return Math.min(d, Math.max(0, ((clientX - r.left) / width) * d));
  };

  /** Hít vào các mốc gần (đầu/cuối đoạn, vạch phát, mép các lớp khác) */
  const snap = (t: number, exceptId?: string) => {
    const marks = [0, d, trim.start, trim.end, getTime(), ...items.filter((i) => i.id !== exceptId).flatMap((i) => [i.start, i.end])];
    let best = t;
    let bestPx = SNAP_PX;
    for (const m of marks) {
      const px = Math.abs(toX(m) - toX(t));
      if (px < bestPx) {
        best = m;
        bestPx = px;
      }
    }
    return best;
  };

  function begin(e: ReactPointerEvent, dr: Drag) {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = dr;
    if (dr.mode === 'seek') onSeek(timeAt(e.clientX));
  }

  function move(e: ReactPointerEvent) {
    const dr = drag.current;
    if (!dr) return;
    if (dr.mode === 'seek') {
      onSeek(timeAt(e.clientX));
      return;
    }
    const dt = ((e.clientX - dr.x0) / width) * d;
    if (dr.mode === 'trim-left' || dr.mode === 'trim-right') {
      if (dr.mode === 'trim-left') onTrim({ start: Math.min(Math.max(0, snap(dr.start0 + dt)), trim.end - MIN_LEN), end: trim.end });
      else onTrim({ start: trim.start, end: Math.max(Math.min(d, snap(dr.end0 + dt)), trim.start + MIN_LEN) });
      return;
    }
    if (!('id' in dr)) return;
    if (dr.mode === 'move') {
      const len = dr.end0 - dr.start0;
      let start = Math.min(Math.max(0, dr.start0 + dt), d - len);
      const sStart = snap(start, dr.id);
      const sEnd = snap(start + len, dr.id);
      if (sStart !== start) start = sStart;
      else if (sEnd !== start + len) start = sEnd - len;
      start = Math.min(Math.max(0, start), d - len);
      onChange(dr.id, { start, end: start + len });
    } else if (dr.mode === 'left') onChange(dr.id, { start: Math.min(Math.max(0, snap(dr.start0 + dt, dr.id)), dr.end0 - MIN_LEN), end: dr.end0 });
    else onChange(dr.id, { start: dr.start0, end: Math.max(Math.min(d, snap(dr.end0 + dt, dr.id)), dr.start0 + MIN_LEN) });
  }

  const end = () => (drag.current = null);

  // Vạch chia thước: khoảng cách giữa hai vạch tối thiểu ~56px
  const step = [0.5, 1, 2, 5, 10, 15, 30, 60, 120].find((s) => toX(s) >= 56) ?? 300;
  const ticks = Array.from({ length: Math.floor(d / step) + 1 }, (_, i) => i * step);
  const rows = [...items].reverse();

  return (
    <div className="timeline">
      <div className="tl-head">
        <span ref={timeRef} className="tl-time">
          0:00.0
        </span>
        <span className="muted">/ {fmt(d)}</span>
        <span className="grow" />
        <button className="icon-btn" onClick={() => setZoom((z) => Math.max(1, z / 1.6))} disabled={zoom <= 1} aria-label="Thu nhỏ timeline">
          <Icon name="minus" />
        </button>
        <button className="icon-btn" onClick={() => setZoom((z) => Math.min(40, z * 1.6))} aria-label="Phóng to timeline">
          <Icon name="plus" />
        </button>
      </div>
      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-inner" ref={innerRef} style={{ width }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
          <div className="tl-ruler" onPointerDown={(e) => begin(e, { mode: 'seek' })}>
            {ticks.map((t) => (
              <span key={t} className="tl-tick" style={{ left: toX(t) }}>
                {t >= 60 ? `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}` : `${t}s`}
              </span>
            ))}
          </div>

          {rows.map((it) => (
            <div key={it.id} className="tl-track" onPointerDown={(e) => begin(e, { mode: 'seek' })}>
              <div
                className={selected === it.id ? 'tl-bar on' : 'tl-bar'}
                style={{ left: toX(it.start), width: Math.max(14, toX(it.end) - toX(it.start)) }}
                onPointerDown={(e) => {
                  onSelect(it.id);
                  begin(e, { mode: 'move', id: it.id, x0: e.clientX, start0: it.start, end0: it.end });
                }}
              >
                <span
                  className="tl-handle l"
                  onPointerDown={(e) => {
                    onSelect(it.id);
                    begin(e, { mode: 'left', id: it.id, x0: e.clientX, start0: it.start, end0: it.end });
                  }}
                />
                <span className="tl-label">
                  <Icon name={it.icon} size={13} /> {it.label}
                </span>
                <span
                  className="tl-handle r"
                  onPointerDown={(e) => {
                    onSelect(it.id);
                    begin(e, { mode: 'right', id: it.id, x0: e.clientX, start0: it.start, end0: it.end });
                  }}
                />
              </div>
            </div>
          ))}

          <div className="tl-track video" onPointerDown={(e) => begin(e, { mode: 'seek' })}>
            <div className="tl-video" />
            <div className="tl-cut" style={{ left: 0, width: toX(trim.start) }} />
            <div className="tl-cut" style={{ left: toX(trim.end), right: 0 }} />
            <div className="tl-trim" style={{ left: toX(trim.start), width: toX(trim.end) - toX(trim.start) }}>
              <span
                className="tl-handle l"
                onPointerDown={(e) => begin(e, { mode: 'trim-left', x0: e.clientX, start0: trim.start, end0: trim.end })}
              />
              <span className="tl-label">
                <Icon name="video" size={13} /> Video · {fmt(trim.end - trim.start)}
              </span>
              <span
                className="tl-handle r"
                onPointerDown={(e) => begin(e, { mode: 'trim-right', x0: e.clientX, start0: trim.start, end0: trim.end })}
              />
            </div>
          </div>

          <div className="tl-playhead" ref={headRef} />
        </div>
      </div>
      <p className="hint">Kéo thanh để dời, kéo hai mép để đổi thời lượng. Kéo trên thước để tua.</p>
    </div>
  );
}
