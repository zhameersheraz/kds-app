# KDS - Kitchen Display System + POS

A real-time POS to KDS prototype. React (Vite + Tailwind) front end, Node.js (Express + Socket.IO + SQLite) back end. Clean monochrome design, dark mode, Philippine peso default currency.

```
       POS (phone)            Express + Socket.IO + SQLite            KDS (tablet)
   +-----------------+    new_order / order_status_update     +-------------------+
   |  /pos  (server) | <-----------------------------------> |  /kds (kitchen)   |
   +-----------------+                                         +-------------------+
            |                                                            |
            +-------------------------- admin ---------------------------+
                                  /admin  (sales, orders, top items)
```

## What's included

- **POS** (`/pos`) - Mobile-first order entry. Product line-art illustrations, table number, per-item notes, tax calc, send-to-kitchen.
- **KDS** (`/kitchen`) - Real-time cards grouped by status. Wait-time color bar (green / amber / red), inline action buttons. Web Audio ding on new orders.
- **Server Status** (`/server-status`) - Server's phone view of their active orders. Real-time Ready alerts.
- **Admin** (`/admin`) - Sales totals, 7-day revenue sparkline, top-selling items, full order history with status filter.
- **Sign up** (`/signup`) - Open registration. First user auto-becomes admin.
- **Print** - Printable kitchen tickets and customer receipts (80mm thermal friendly). Printer button on every KDS card and completed order.
- **Dark / light / system theme** - Persisted, follows `prefers-color-scheme` by default.
- **Currency switch** - PHP (default) / USD. Persisted.
- **Live clock** - In the top bar.
- **Self-healing DB migrations** - Adding new items / columns / admin account updates transparently on boot.

## Login

Pre-seeded accounts (also visible on the login screen):

| Role    | Username  | Password    | Lands on      |
|---------|-----------|-------------|---------------|
| Admin   | `zham`    | `zham123`   | `/admin`      |
| Server  | `server`  | `server123` | `/pos`        |
| Kitchen | `kitchen` | `kitchen123`| `/kds`        |

Sign up at `/signup` to create more.

## Run locally on Kali

```bash
# Backend
cd server
npm install
npm start            # http://localhost:4000  (auto-seeds DB on first run)

# Frontend (only if you want hot-reload while developing)
cd ../client
npm install
npm run build        # one-time, outputs ./dist
cd ../server
npm start            # server now serves /dist on the same port
```

## Run on 2+ devices (same LAN)

The server already binds `0.0.0.0`. You need a reachable IP for other devices
on the WiFi to hit the VM. Three options below, pick whichever you prefer.

### Option A - Port forward (easiest, no VM network changes)

This is the one I recommend for your setup. It lets your **host laptop**
(Brave, Chrome, Edge, etc.) reach the VM via `http://localhost:4000`,
and any other device on the same WiFi via your host's LAN IP.

In VirtualBox Manager (with the VM powered off):

1. Select the Kali VM -> **Settings** -> **Network** -> **Adapter 1**
2. Confirm "Attached to: NAT"
3. Click **Advanced** -> **Port Forwarding**
4. Add a rule:
   - Name: `kds`
   - Protocol: `TCP`
   - Host IP: leave empty
   - Host Port: `4000`
   - Guest IP: leave empty
   - Guest Port: `4000`
5. Click OK, OK. Start the VM.

From the **host laptop** (Windows):
- `http://localhost:4000` works in Brave, Chrome, Edge, Firefox.

From **other devices on the same WiFi** (phone, tablet):
- They reach the VM via the host's LAN IP, e.g. `http://192.168.1.42:4000`
- Find your host's LAN IP: open PowerShell -> `ipconfig` -> look for "IPv4 Address" under Wi-Fi.

### Option B - Bridged adapter (VM gets a real LAN IP)

The VM appears on your WiFi network as its own device.

In VirtualBox Manager (VM powered off):
1. **Settings** -> **Network** -> **Adapter 1**
2. Attached to: **Bridged Adapter**, Name: your WiFi adapter
3. OK, start VM.

Kali will get a real LAN IP. Find it:

```bash
ip -4 addr | grep inet
# or
hostname -I
```

Then any device on the WiFi hits `http://<kali-ip>:4000/pos` directly.

### Option C - Test inside the VM only

Open Firefox inside Kali -> `http://localhost:4000`. All three views in tabs
is enough for a quick demo or screen recording.

## Mobile / tablet usage

The UI is mobile-first. On a phone browser (server's view) and a tablet browser
(kitchen view), layouts adapt:
- POS: menu grid stacks above the order ticket on narrow screens, side-by-side on wide.
- KDS: single-column cards on phones, multi-column on tablets.
- TopBar: wraps on narrow screens, role chip hides on small, clock hides below md.
- Admin tables: horizontal scroll on narrow screens.

For a true 2-device demo:
1. Run the server with port forwarding (Option A above) or bridged networking (B).
2. Open the URLs in your phone's browser and your laptop/tablet browser.

## Deploy publicly (anyone on the internet can reach it)

A full step-by-step guide for three free paths lives in **[DEPLOY.md](./DEPLOY.md)**:
- **Cloudflare Tunnel** — 2 commands, no signup, instant public URL
- **ngrok** — 5 min, free signup, stable free URL
- **Render.com** — 15 min, permanent hosted URL (~$0.25/mo for the SQLite disk)

Or use the one-shot script:
```bash
chmod +x deploy-tunnel.sh
./deploy-tunnel.sh
```
Starts the server and opens a public Cloudflare tunnel. Ctrl+C cleans up.

## Currency

All prices in the database are PHP (the source of truth). When you switch the
topbar toggle to `USD`, prices are converted using a fixed rate
(`RATE_PHP_PER_USD = 56` in `client/src/lib/currency.jsx`). So:
- Classic Cheeseburger: PHP 220.00 -> $3.93
- Cola: PHP 65.00 -> $1.16

The rate is a single constant in the frontend; change it to whatever baseline
you want. The database itself stays in PHP either way.

## Project layout

```
kds-app/
+-- server/                       # Express + Socket.IO + SQLite
|   +-- index.js                  # REST API + WS + serves /dist
|   +-- db.js                     # Schema + seed + self-healing migrations
|   +-- routes/{auth,orders,menu,reports}.js
|   +-- middleware/auth.js        # JWT
+-- client/
|   +-- src/
|   |   +-- pages/                # Login, Signup, POS, KDS, Admin, ServerStatus
|   |   +-- components/           # OrderCard, MenuGrid, OrderTicket, TopBar,
|   |   |                         # StatusBadge, ProductImage, icons
|   |   +-- lib/                  # api, socket, store (auth), toast,
|   |   |                         # theme, currency, format, printTicket
|   +-- tailwind.config.js        # Dark mode + ink/paper/accent palette
|   +-- src/index.css             # Theme variables + base styles
+-- README.md
```

## REST API

```
POST   /api/auth/login            { username, password }        -> { token, user }
POST   /api/auth/signup           { name, username, password, role } -> { token, user }
GET    /api/auth/me               Bearer                        -> { user }

GET    /api/menu                  Bearer                        -> [...]
POST   /api/menu                  admin
PATCH  /api/menu/:id              admin
DELETE /api/menu/:id              admin

POST   /api/orders                server / admin
GET    /api/orders/active         kitchen / admin
GET    /api/orders/mine           server / admin
GET    /api/orders/all?status=    admin
PATCH  /api/orders/:id/status     role-gated state transition

GET    /api/reports/sales         admin
GET    /api/reports/summary       admin
```

## Real-time events

| Event                  | Direction             | Notes                              |
|------------------------|-----------------------|------------------------------------|
| `new_order`            | server -> kitchen, admin | full hydrated order              |
| `order_status_update`  | any -> all            | drops off KDS on `served`          |

Auth is exchanged once via `socket.handshake.auth.token` (JWT).

## Design notes

- **Palette**: off-white (`#fafaf7`) + ink black (`#0a0a0a`) + deep red accent (`#b91c1c`) in light mode. Dark mode uses a warmer `#1a1a1a` background (not pure black) and a brighter accent. One accent, used sparingly.
- **Typography**: serif (Georgia stack) for display, system sans for body, monospace for numbers and receipts.
- **Spacing**: generous. Sharp 2px corners, no shadows, hairline borders.
- **Theme**: class-based dark mode via `dark:` Tailwind variant. Theme colors use CSS variables (`rgb(var(--c-ink) / <alpha-value>)`) so opacity modifiers work in both modes. Cycle button: light -> dark -> system -> light.
- **Currency**: context-based, PHP default. Toggle persists in localStorage.
- **Product photos**: 15 Unsplash food photos referenced by URL in `menu_items.image`. On any error (offline, broken CDN), falls back to a clean colored placeholder with the food name. You can swap URLs via the menu admin (or directly in the DB).
- **Logout**: confirms via modal before signing out.
- **Modal**: small reusable `<Modal>` component with Escape + backdrop dismiss.

## Reset / wipe

```bash
rm -rf server/data
# Restart the server. DB will be re-created and seeded fresh.
```

## Notes for the report

- Zero external runtime services. Runs on a laptop.
- Socket.IO falls back to long-polling if WebSockets are blocked.
- Web Audio API used for kitchen alerts - no audio asset files.
- All timestamps in SQLite are UTC; client formats elapsed durations locally.
- Server-side schema migrations are idempotent and self-heal on every boot.