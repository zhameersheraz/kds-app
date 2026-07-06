// Landing page - shown to anyone visiting the site before login.
// Hero with KDS explainer, how-it-works, features. Uses layered SVGs with
// perspective transforms for a 3D feel without any heavy deps.
// v6.2: smooth-scroll anchors, IntersectionObserver fade-ins, back-to-top.

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Nav onNav={scrollToId} onTop={scrollTop} />
      <Hero />
      <Explainer />
      <HowItWorks />
      <Features />
      <Footer />
      <BackToTop visible={showTop} onClick={scrollTop} />
    </div>
  );
}

function Nav({ onNav, onTop }) {
  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <button onClick={onTop} className="font-display text-lg font-bold tracking-tight">
          <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
          <span className="ml-2 opacity-50 text-sm">/ Kitchen Display</span>
        </button>
        <nav className="hidden md:flex items-center gap-6 text-sm ml-6">
          <button onClick={() => onNav('about')}    className="opacity-70 hover:opacity-100 transition">About</button>
          <button onClick={() => onNav('how')}      className="opacity-70 hover:opacity-100 transition">How it works</button>
          <button onClick={() => onNav('features')} className="opacity-70 hover:opacity-100 transition">Features</button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/login"  className="btn-quiet text-sm">Sign in</Link>
          <Link to="/signup" className="btn-primary text-sm">Get started</Link>
        </div>
      </div>
    </header>
  );
}

function Reveal({ children, as: As = 'div', className = '', delay = 0 }) {
  // Fade-up when the element scrolls into view.
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <As
      ref={ref}
      className={
        'transition-all duration-700 ease-out will-change-transform ' +
        (shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4') +
        ' ' + className
      }
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </As>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* background pattern */}
      <div className="absolute inset-0 paper-grain opacity-60 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(60% 50% at 70% 30%, rgba(220,80,50,0.06), transparent 70%)'
      }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 items-center">
        <Reveal>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-4">
            Kitchen Display System + Point of Sale
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            Run your kitchen <br/>
            with <span className="text-accent">clarity</span>, not chaos.
          </h1>
          <p className="mt-6 text-base sm:text-lg opacity-70 max-w-xl leading-relaxed">
            Orders flow from the counter to the kitchen to the table - real-time, on every
            device, with zero paper and zero shouting across the pass.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/signup" className="btn-primary">Create an account</Link>
            <Link to="/login"  className="btn-ghost">I already have one</Link>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs opacity-50 mono">
            <span>Web</span>
            <span>Real-time</span>
            <span>PHP / USD</span>
            <span>Open registration</span>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <HeroScene />
        </Reveal>
      </div>
    </section>
  );
}

function HeroScene() {
  // Layered SVG that suggests a 3D floating kitchen pass with a ticket,
  // a plate, and a glass. Pure SVG + CSS transform - no JS.
  return (
    <div className="relative h-[360px] sm:h-[420px] lg:h-[480px] [perspective:1400px]">
      <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(18deg)_rotateY(-22deg)_rotateZ(0deg)]">
        {/* floor shadow */}
        <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-[70%] h-6 rounded-full blur-2xl bg-black/15" />

        {/* The ticket */}
        <svg viewBox="0 0 200 260" className="absolute left-[8%] top-[6%] w-[42%] [transform:translateZ(40px)_rotateZ(-6deg)] drop-shadow-xl">
          <defs>
            <linearGradient id="ticketGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0"   stopColor="#ffffff"/>
              <stop offset="1"   stopColor="#f3eee5"/>
            </linearGradient>
          </defs>
          <path d="M10 0 H190 V250 L175 240 160 250 145 240 130 250 115 240 100 250 85 240 70 250 55 240 40 250 25 240 10 250 Z"
                fill="url(#ticketGrad)" stroke="#1a1a1a" strokeWidth="1.2" />
          <line x1="20" y1="60" x2="180" y2="60" stroke="#1a1a1a" strokeDasharray="3 3" strokeWidth="1" />
          <line x1="20" y1="170" x2="180" y2="170" stroke="#1a1a1a" strokeDasharray="3 3" strokeWidth="1" />
          <text x="100" y="32" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="14" fill="#1a1a1a" fontWeight="700">KDS TICKET</text>
          <text x="100" y="50" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="10" fill="#1a1a1a" opacity="0.6">TABLE 7 - SERVER SAM</text>
          <g fontFamily="ui-monospace,monospace" fontSize="11" fill="#1a1a1a">
            <text x="30" y="90">2x  Classic Cheeseburger</text>
            <text x="30" y="108">1x  French Fries</text>
            <text x="30" y="126">1x  Cola</text>
            <text x="30" y="144">1x  Cheesecake Slice</text>
          </g>
          <text x="100" y="200" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="12" fill="#1a1a1a" fontWeight="700">TOTAL</text>
          <text x="100" y="222" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="18" fill="#dc5032" fontWeight="800">PHP 795.00</text>
        </svg>

        {/* The plate (with burger) */}
        <svg viewBox="0 0 220 220" className="absolute right-[6%] top-[14%] w-[46%] [transform:translateZ(80px)_rotateZ(8deg)] drop-shadow-2xl">
          <defs>
            <radialGradient id="plateGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0"   stopColor="#ffffff"/>
              <stop offset="1"   stopColor="#dad3c5"/>
            </radialGradient>
            <linearGradient id="bunTop" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#e7a85a"/>
              <stop offset="1" stopColor="#b8762e"/>
            </linearGradient>
            <linearGradient id="bunBot" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#caa05e"/>
              <stop offset="1" stopColor="#8b5e22"/>
            </linearGradient>
            <linearGradient id="pattyGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#5b3018"/>
              <stop offset="1" stopColor="#2e160a"/>
            </linearGradient>
            <linearGradient id="cheeseGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffd84d"/>
              <stop offset="1" stopColor="#d99a13"/>
            </linearGradient>
          </defs>

          <ellipse cx="110" cy="110" rx="100" ry="38" fill="#000" opacity="0.15" />
          <ellipse cx="110" cy="105" rx="100" ry="40" fill="url(#plateGrad)" stroke="#1a1a1a" strokeWidth="1.5"/>
          <ellipse cx="110" cy="100" rx="78"  ry="30" fill="none"     stroke="#1a1a1a" strokeWidth="0.8" opacity="0.4"/>

          <path d="M58 92 C 58 60, 162 60, 162 92 Z" fill="url(#bunTop)" stroke="#1a1a1a" strokeWidth="1.2"/>
          {[[88,78],[104,72],[122,76],[140,84],[96,86],[128,68]].map(([x,y],i) =>
            <ellipse key={i} cx={x} cy={y} rx="3" ry="1.6" fill="#fff7df" stroke="#1a1a1a" strokeWidth="0.4"/>
          )}
          <path d="M48 100 q10 -10 20 0 q10 -10 20 0 q10 -10 20 0 q10 -10 20 0 q10 -10 20 0 V 110 H 48 Z" fill="#5fb04a" stroke="#1a1a1a" strokeWidth="1"/>
          <path d="M48 108 H 172 L 168 118 H 52 Z" fill="url(#cheeseGrad)" stroke="#1a1a1a" strokeWidth="1"/>
          <rect x="52" y="116" width="116" height="14" rx="3" fill="url(#pattyGrad)" stroke="#1a1a1a" strokeWidth="1"/>
          <path d="M58 130 C 58 144, 162 144, 162 130 Z" fill="url(#bunBot)" stroke="#1a1a1a" strokeWidth="1.2"/>
        </svg>

        {/* The glass */}
        <svg viewBox="0 0 120 200" className="absolute left-[44%] bottom-[6%] w-[24%] [transform:translateZ(120px)_rotateZ(-4deg)] drop-shadow-xl">
          <defs>
            <linearGradient id="cola" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#3b1a0d"/>
              <stop offset="1" stopColor="#150805"/>
            </linearGradient>
            <linearGradient id="glass" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0"   stopColor="#ffffff" stopOpacity="0.7"/>
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.05"/>
              <stop offset="1"   stopColor="#000000" stopOpacity="0.15"/>
            </linearGradient>
          </defs>
          <path d="M15 10 H 105 L 95 195 H 25 Z" fill="url(#glass)" stroke="#1a1a1a" strokeWidth="1.4"/>
          <path d="M20 40 H 100 V 188 H 20 Z" fill="url(#cola)"/>
          <rect x="35" y="48" width="14" height="14" rx="2" fill="#e9f3ff" stroke="#1a1a1a" strokeWidth="0.6" opacity="0.8"/>
          <rect x="60" y="42" width="12" height="14" rx="2" fill="#e9f3ff" stroke="#1a1a1a" strokeWidth="0.6" opacity="0.8"/>
          <rect x="78" y="50" width="14" height="12" rx="2" fill="#e9f3ff" stroke="#1a1a1a" strokeWidth="0.6" opacity="0.8"/>
          <circle cx="40" cy="100" r="2" fill="#fff" opacity="0.5"/>
          <circle cx="70" cy="140" r="1.5" fill="#fff" opacity="0.4"/>
          <circle cx="85" cy="120" r="2" fill="#fff" opacity="0.5"/>
          <circle cx="55" cy="160" r="1.6" fill="#fff" opacity="0.4"/>
          <rect x="55" y="20" width="6" height="60" fill="#dc5032" stroke="#1a1a1a" strokeWidth="0.6" transform="rotate(15 58 50)"/>
        </svg>
      </div>
    </div>
  );
}

function Explainer() {
  return (
    <section id="about" className="border-b border-line">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <Reveal>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-3">What is KDS</div>
          <h2 className="font-display text-3xl sm:text-4xl leading-tight">
            A real-time order pipeline from counter to kitchen to table.
          </h2>
          <p className="mt-5 text-base sm:text-lg opacity-70 leading-relaxed">
            KDS is a small, self-contained web app for restaurants and cafes. The server takes an
            order on a tablet or laptop, the kitchen sees it appear on the display the second it
            is sent, the chef marks it preparing and then ready, and the server sees it light up
            in their queue. No printers, no shouting, no paper slips blowing across the pass.
          </p>
          <p className="mt-4 text-sm opacity-50">
            Built with React, Node.js, Socket.IO and SQLite. One binary, one port, one URL.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Server takes the order',
      body: 'Pick items from the menu, attach a table number and a note for allergies or special requests, then send to kitchen with one tap.'
    },
    {
      n: '02',
      title: 'Kitchen prepares it',
      body: 'Tickets appear in the Pending rail on the kitchen display. The chef moves them to Preparing, then Ready. A chime tells the team each time something new arrives.'
    },
    {
      n: '03',
      title: 'Server runs it',
      body: 'Ready tickets light up on the server screen. Tap Served when the food hits the table. The whole flow is logged for end-of-day reports.'
    }
  ];
  return (
    <section id="how" className="border-b border-line bg-ink/[0.02]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <Reveal>
          <div className="text-center mb-12">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-3">How it works</div>
            <h2 className="font-display text-3xl sm:text-4xl">Three screens, one shared truth.</h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="card p-6 h-full">
                <div className="font-display text-accent text-sm tracking-widest">{s.n}</div>
                <div className="font-display text-xl mt-2">{s.title}</div>
                <p className="text-sm opacity-70 mt-2 leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { title: 'Real-time sync',       body: 'Socket.IO pushes new orders and status changes the instant they happen. No refresh button.' },
    { title: 'Three roles',          body: 'Server takes orders. Kitchen prepares them. Admin sees everything and tracks revenue.' },
    { title: 'Thermal-print tickets',body: 'Kitchen ticket and customer receipt both render to a print-ready 80mm layout.' },
    { title: 'Currency aware',       body: 'Menu prices in PHP, switch to USD on the fly. Conversion rate is constant per session.' },
    { title: 'Today + last 7 days',  body: 'Admin dashboard tracks today\'s orders, revenue, top sellers and the past week.' },
    { title: 'Self-hosted, no fees', body: 'One Node.js process, one SQLite file, one URL. Deploy free on Render or any Node host.' }
  ];
  return (
    <section id="features" className="border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <Reveal>
          <div className="text-center mb-12">
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-3">Features</div>
            <h2 className="font-display text-3xl sm:text-4xl">Everything a small kitchen needs.</h2>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 100}>
              <div className="card p-5 h-full">
                <div className="font-display text-base">{it.title}</div>
                <p className="text-sm opacity-70 mt-1.5 leading-relaxed">{it.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <Reveal as="footer">
      <div className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid sm:grid-cols-2 gap-8 items-end">
          <div>
            <div className="font-display text-3xl font-bold tracking-tight">
              <span className="inline-block border-l-2 border-accent pl-2">KDS</span>
            </div>
            <p className="mt-4 text-sm opacity-70 max-w-sm leading-relaxed">
              A small, real-time kitchen display and POS system. Open registration,
              three roles, one URL.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex gap-2">
              <Link to="/signup" className="btn-primary">Create account</Link>
              <Link to="/login"  className="btn-ghost">Sign in</Link>
            </div>
            <div className="text-[10px] opacity-50 mono">
              v6.2 - single-process Node + React + SQLite + Socket.IO
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function BackToTop({ visible, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Back to top"
      title="Back to top"
      className={
        'fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full border border-line bg-paper shadow-lg ' +
        'flex items-center justify-center transition-all duration-300 ' +
        (visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none')
      }
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5"/>
        <path d="m5 12 7-7 7 7"/>
      </svg>
    </button>
  );
}