// Minimal line icons. No emoji, no font dependency. Single-color via `currentColor`.

import React from 'react';

function base({ size = 18, className = '', strokeWidth = 1.6, children, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSun = (p) => base({
  ...p,
  children: <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </>
});

export const IconMoon = (p) => base({
  ...p,
  children: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
});

export const IconSystem = (p) => base({
  ...p,
  children: <>
    <rect x="3" y="4" width="18" height="12" rx="1" />
    <path d="M8 20h8M12 16v4" />
  </>
});

export const IconClock = (p) => base({
  ...p,
  children: <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>
});

export const IconPlus  = (p) => base({ ...p, children: <><path d="M12 5v14" /><path d="M5 12h14" /></> });
export const IconMinus = (p) => base({ ...p, children: <path d="M5 12h14" /> });
export const IconClose = (p) => base({ ...p, children: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></> });
export const IconCheck = (p) => base({ ...p, children: <path d="M20 6 9 17l-5-5" /> });

export const IconChevronRight = (p) => base({ ...p, children: <path d="m9 18 6-6-6-6" /> });
export const IconChevronLeft  = (p) => base({ ...p, children: <path d="m15 18-6-6 6-6" /> });
export const IconArrowRight   = (p) => base({ ...p, children: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></> });
export const IconArrowLeft    = (p) => base({ ...p, children: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></> });

export const IconPrinter = (p) => base({
  ...p,
  children: <>
    <path d="M6 9V2h12v7" />
    <rect x="6" y="14" width="12" height="8" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
  </>
});

export const IconReceipt = (p) => base({
  ...p,
  children: <>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </>
});

export const IconTrash = (p) => base({
  ...p,
  children: <>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </>
});

export const IconLogout = (p) => base({
  ...p,
  children: <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>
});

export const IconChart = (p) => base({
  ...p,
  children: <>
    <path d="M3 3v18h18" />
    <path d="m7 14 4-4 4 4 5-7" />
  </>
});

export const IconList = (p) => base({
  ...p,
  children: <>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </>
});

export const IconRefresh = (p) => base({
  ...p,
  children: <>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 3v6h-6" />
  </>
});

export const IconUser = (p) => base({
  ...p,
  children: <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>
});

export const IconKitchen = (p) => base({
  ...p,
  children: <>
    <path d="M5 4h14v6a3 3 0 0 1-3 3h-1v7h-2v-7h-2v7h-2v-7H8a3 3 0 0 1-3-3z" />
  </>
});

export const IconServer = (p) => base({
  ...p,
  children: <>
    <path d="M4 4h16v6H4z" />
    <path d="M4 14h16v6H4z" />
    <circle cx="7" cy="7" r="0.5" />
    <circle cx="7" cy="17" r="0.5" />
  </>
});

export const IconBell = (p) => base({
  ...p,
  children: <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </>
});