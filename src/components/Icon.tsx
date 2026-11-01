// Bộ icon nét mảnh dùng chung (SVG, theo màu chữ hiện tại).

const PATHS = {
  plus: 'M12 5v14M5 12h14',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM21 15l-5-5L5 21M9 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  trash: 'M4 7h16M10 11v6M14 11v6M9 7V4h6v3M6 7l1 13h10l1-13',
  check: 'M5 12.5l4.5 4.5L19 7',
  type: 'M5 7V5h14v2M12 5v14M9 19h6',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  share: 'M12 3v12M8 7l4-4 4 4M6 11H5v9h14v-9h-1',
  maximize: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  minimize: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 8h8v8H8z',
  x: 'M6 6l12 12M18 6L6 18',
  reset: 'M4 4v6h6M5.1 15a7.5 7.5 0 1 0 1.6-7.8L4 10',
  rotate: 'M20 4v6h-6M18.9 15a7.5 7.5 0 1 1-1.6-7.8L20 10',
  wand: 'M4 20L15 9M13 7l4 4M18 3v4M16 5h4M8 4v2M7 5h2M20 13v2M19 14h2',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  replace: 'M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4',
  center: 'M12 3v18M8 8h8M6 16h12',
  grid: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM12 3v18M12 12h9',
  frame: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h8v8H8z',
  alert: 'M12 9v4M12 17h.01M10.3 4.2L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z',
  save: 'M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 3v5h7V3M8 21v-7h8v7',
  play: 'M7 4.5v15l12-7.5-12-7.5z',
  swap: 'M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  copy: 'M10 8h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM15 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  sliders: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M16 4v4M10 10v4M16 16v4',
  sticker: 'M4 4h16v9l-7 7H4zM13 20v-7h7',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
