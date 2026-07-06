// Product photo component.
// Renders a real food photo from the URL stored in the menu item.
// On any error (offline, blocked CDN, broken URL) falls back to a clean
// labeled placeholder so the UI never breaks.

import React, { useState } from 'react';

export default function ProductImage({ image, name, className = '' }) {
  const [errored, setErrored] = useState(false);
  const isUrl = typeof image === 'string' && /^https?:\/\//i.test(image);

  if (!isUrl || errored) {
    return <Placeholder name={name} className={className} />;
  }

  return (
    <div className={'relative overflow-hidden ' + className}>
      <img
        src={image}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
        className="w-full h-full object-cover"
        style={{ display: 'block' }}
      />
    </div>
  );
}

function Placeholder({ name, className = '' }) {
  // Generate a stable color from the name so the placeholder is consistent.
  const hue = hashHue(name || 'x');
  const bg = `hsl(${hue}, 22%, 88%)`;
  const bgDark = `hsl(${hue}, 14%, 22%)`;
  return (
    <div
      className={'w-full h-full grid place-items-center ' + className}
      style={{ background: 'var(--ph-bg, ' + bg + ')' }}
    >
      <style>{`.dark .ph-${hashHue(name)} { background: ${bgDark} !important; }`}</style>
      <span className="font-display text-xs uppercase tracking-widest text-ink/70 dark:text-paper/70 text-center px-2">
        {name}
      </span>
    </div>
  );
}

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}