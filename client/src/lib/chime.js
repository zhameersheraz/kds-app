// Notification chime.
//
// Created because POS.jsx called `new Audio('/notify.mp3')`, and there is no
// notify.mp3 in client/public. `new Audio()` does not throw for a missing file,
// so it 404'd asynchronously on .play() and the empty .catch swallowed it. The
// order-sent and order-ready sounds never played and never reported anything.
//
// The Web Audio version needs no asset and cannot 404. The tone is the one
// KDS.jsx already shipped, lifted out of that file so all three call sites
// share a single AudioContext instead of one each.

let ctx = null;

function context() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  // Mobile Safari starts the context suspended until a user gesture.
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * @param {number} times how many times to repeat. >1 uses the brighter
 *                       two-note alert, 1 uses a single soft sweep.
 */
export function chime(times = 1) {
  try {
    const ac = context();
    if (!ac) return;
    const now = ac.currentTime;
    for (let i = 0; i < times; i++) {
      const t = now + i * 0.25;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(times > 1 ? 880 : 660, t);
      o.frequency.exponentialRampToValueAtTime(times > 1 ? 1320 : 880, t + 0.18);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(times > 1 ? 0.16 : 0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t);
      o.stop(t + 0.45);
    }
  } catch (_) {
    // Audio is a nicety. Never let it break the order flow.
  }
}
