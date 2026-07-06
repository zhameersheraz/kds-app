# KDS - Kitchen Display System + POS

A real-time POS-to-Kitchen-Display web app for small restaurants and cafes.
One URL, three screens, real orders flowing live from counter to kitchen to
table. No paper, no printers, no shouting across the pass.

Live demo: **https://kds-app-5d6v.onrender.com**

```
   Server (phone/tablet)        Express + Socket.IO + SQLite        Kitchen (tablet/wall)
   +-----------------+       new_order / order_status_update       +-------------------+
   | /pos            |  <-----------------------------------------> |  /kds             |
   +-----------------+                                              +-------------------+
            |                                                                |
            +-------------------------- admin -------------------------------+
                                  /admin  (sales, orders, top items)

   Anyone /                          +-------------------+
   first visit            /landing -> |  public landing    |
                                     +-------------------+
```

## What's in the box

| Screen        | Path            | What it does                                       |
|---------------|-----------------|----------------------------------------------------|
| Landing       | `/landing`      | Public intro, hero, how-it-works, features. No login. |
| Sign in       | `/login`        | Username + password. Show/hide password eye.       |
| Sign up       | `/signup`       | Open registration. Pick a role. First user = admin.|
| POS           | `/pos`          | Server takes orders. Menu grid + cart + send to kitchen. |
| My tables     | `/server-status`| Server's view of their own active orders. Cancel own pending, mark ready as served. |
| KDS           | `/kds`          | Kitchen display. Three side-by-side rails (Pending / Preparing / Ready). Wait-time color bar, chime on new orders. |
| Admin         | `/admin`        | Today's sales, top items, 7-day chart, full order history with filters. |

Plus:

- **Real-time** - Socket.IO pushes new orders and status changes the second they happen.
- **Three roles** - server, kitchen, admin. Each screen enforces its own role.
- **Print** - thermal-80mm friendly popup for kitchen tickets and customer receipts.
- **Currency** - PHP (default) and USD. Toggle in the topbar, constant rate of 56 PHP/USD.
- **Self-healing DB** - schema migrations and seed accounts re-apply on every boot.
- **Stale auto-cancel** - pending orders idle for more than 30 minutes get auto-cancelled so the kitchen pass doesn't drown in abandoned tickets.
- **No emojis, no dark mode** - one clean monochrome theme.

## Login (demo accounts)

| Role    | Username  | Password                | Lands on |
|---------|-----------|-------------------------|----------|
| Admin   | `zham`    | `ZhamAdmin!2026-KDS`    | `/admin` |
| Server  | `server`  | `ServerPass!2026-KDS`   | `/pos`   |
| Kitchen | `kitchen` | `KitchenPass!2026-KDS`  | `/kds`   |

Click any row on the login screen to autofill. Sign up more accounts at
`/signup` if you want to test a multi-server / multi-kitchen flow.

## What each role can do

| Action                              | Server | Kitchen | Admin |
|-------------------------------------|:------:|:-------:|:-----:|
| Take a new order                    |   yes  |    -    |  yes  |
| Mark pending -> preparing           |    -   |   yes   |  yes  |
| Mark preparing -> ready             |    -   |   yes   |  yes  |
| Mark ready -> served                |   yes  |    -    |  yes  |
| Cancel your own PENDING order       |   yes  |    -    |  yes  |
| Cancel any order, any state         |    -   |    -    |  yes  |
| View today's sales / 7-day history  |    -   |    -    |  yes  |
| View full order history (filter)    |    -   |    -    |  yes  |

## Run locally on Kali

```bash
cd server
npm install
npm start            # http://localhost:4000  (auto-seeds DB on first run)

# Frontend (only if you want hot-reload while developing)
cd ../client
npm install
npm run build        # outputs ./dist once
cd ../server
npm start            # server now serves /dist on the same port
```

## Run on 2+ devices (same LAN)

The server already binds `0.0.0.0`. Pick whichever fits your setup.

### Option A - Port forward in VirtualBox (easiest, recommended)

With the VM powered off, in VirtualBox Manager:

1. Select the Kali VM -> **Settings** -> **Network** -> **Adapter 1**
2. Confirm "Attached to: NAT"
3. Click **Advanced** -> **Port Forwarding**
4. Add a rule: Name `kds`, Protocol TCP, Host port `4000`, Guest port `4000`
5. OK, OK. Start the VM.

Then on the **host laptop**: `http://localhost:4000` works.
On **other devices on the same WiFi**: find your host LAN IP via
PowerShell `ipconfig` (look for IPv4 under Wi-Fi), then hit
`http://<your-host-ip>:4000` from the phone or tablet.

### Option B - Bridged adapter (VM gets its own LAN IP)

In VirtualBox Manager (VM off):
1. **Settings** -> **Network** -> **Adapter 1**
2. Attached to **Bridged Adapter**, Name: your WiFi adapter
3. OK, start the VM.

Find the VM's IP:

```bash
ip -4 addr | grep inet
# or
hostname -I
```

Then any device on the WiFi hits `http://<kali-ip>:4000/pos` directly.

### Option C - Single machine demo

Three browser tabs:
- `http://localhost:4000/landing`
- `http://localhost:4000/pos`   (log in as `server`)
- `http://localhost:4000/kds`   (log in as `kitchen`)
- `http://localhost:4000/admin` (log in as `zham`)

Real-time events fire across all four even on one machine.

## Mobile / tablet usage

The UI is mobile-first:
- POS: menu grid stacks above the cart on a phone, side-by-side on tablet and up.
- KDS: three rails stacked vertically on mobile (under 768px), side-by-side on tablet and up.
- Topbar: wraps on narrow screens, the clock and role chip hide under 768px.
- Admin tables: horizontal scroll on narrow screens.

For a true 2-device demo, do Option A or B above.

## Deploy publicly (permanent URL anyone can hit)

A step-by-step guide for three free paths lives in **[DEPLOY.md](./DEPLOY.md)**:

- **Cloudflare Tunnel** - 2 commands, no signup, instant public URL.
- **ngrok** - 5 minutes, free signup, stable free URL.
- **Render.com** - 15 minutes, permanent hosted URL. **This is what the
  live demo above uses.** Free tier, spins down after 15 min idle
  (30-60s cold start on the next hit), DB resets on each redeploy.
  Production use would need Render's $7/mo persistent disk add-on.

Or use the one-shot script:

```bash
chmod +x deploy-tunnel.sh
./deploy-tunnel.sh
```

Starts the server and opens a public Cloudflare tunnel. Ctrl+C cleans up.

## Currency

All prices in the database are PHP - the source of truth. When you switch
the topbar toggle to USD, prices convert using a fixed rate
(`RATE_PHP_PER_USD = 56` in `client/src/lib/currency.jsx`). So:

- Classic Cheeseburger: PHP 220.00 -> $3.93
- Cola: PHP 65.00 -> $1.16

The rate is a single constant in the frontend; change it to whatever
baseline you want. The database itself stays in PHP either way.

To change the rate to a live one, set `RATE_PHP_PER_USD` to whatever you
get from a rates API. The current setup is intentionally static - no
extra moving parts.

## Project layout

```
kds-app/
+-- server/                         # Express + Socket.IO + SQLite
|   +-- index.js                    # REST API + WS + serves /dist
|   +-- db.js                       # Schema + seed + self-healing migrations
|   +-- routes/
|   |   +-- auth.js                 # /login, /signup, /me
|   |   +-- orders.js               # /orders  (state machine + stale auto-cancel)
|   |   +-- menu.js                 # /menu    (admin CRUD)
|   |   +-- reports.js              # /reports (sales, summary)
|   +-- middleware/auth.js          # JWT (12h TTL)
+-- client/
|   +-- src/
|   |   +-- pages/                  # Landing, Login, Signup, POS, KDS, Admin, ServerStatus
|   |   +-- components/             # OrderCard, MenuGrid, OrderTicket, TopBar,
|   |   |                           # StatusBadge, ProductImage, Modal, icons
|   |   +-- lib/                    # api, socket, store (auth), toast,
|   |   |                           # currency, format, printTicket
|   +-- tailwind.config.js          # ink/paper/accent palette
|   +-- src/index.css               # CSS variables + base styles
+-- README.md
+-- DEPLOY.md
+-- render.yaml                     # Render service config (auto)
```

## REST API

```
POST   /api/auth/login              { username, password }              -> { token, user }
POST   /api/auth/signup             { name, username, password, role }  -> { token, user }
GET    /api/auth/me                 Bearer                              -> { user }

GET    /api/menu                    Bearer                              -> [...]
POST   /api/menu                    admin
PATCH  /api/menu/:id                admin
DELETE /api/menu/:id                admin

POST   /api/orders                  server / admin
GET    /api/orders/active           kitchen / admin
GET    /api/orders/mine             server / admin
GET    /api/orders/all?status=      admin
PATCH  /api/orders/:id/status       role-gated state transition

GET    /api/reports/sales           admin
GET    /api/reports/summary         admin
```

## Real-time events

| Event                  | Direction             | Notes                              |
|------------------------|-----------------------|------------------------------------|
| `new_order`            | server -> kitchen, admin | full hydrated order              |
| `order_status_update`  | any -> all            | drops off KDS on `served`          |

Auth is exchanged once via `socket.handshake.auth.token` (JWT).

## Design notes

- **Palette**: off-white (`#fafaf7`) + ink black (`#0a0a0a`) + deep red accent (`#b91c1c`). One accent, used sparingly. No dark mode.
- **Typography**: serif (Georgia stack) for display, system sans for body, monospace for numbers and receipts.
- **Spacing**: generous. Sharp 2px corners, no shadows, hairline borders.
- **Currency**: context-based, PHP default. Toggle persists in localStorage.
- **Product photos**: 15 Unsplash food photos referenced by URL in `menu_items.image`. If a URL 404s, the placeholder renders (clean colored block with the food name). Swap URLs in the DB or via the menu admin.
- **Logout**: confirms via modal before signing out.
- **Modal**: small reusable `<Modal>` component, Escape + backdrop to dismiss.

## Limits and caveats

- **JWT session**: 12 hours. After that you have to log in again.
- **Render free tier**: 15 min idle = spin down. Next hit takes 30-60s.
- **Render free tier DB**: no persistent disk, so the SQLite file resets on each redeploy. Demo accounts re-seed automatically. Production needs Render's $7/mo disk.
- **No payments**: the POS sends orders to the kitchen, it does not charge cards.
- **No multi-tenant**: one deployment = one restaurant.
- **No image upload**: menu photos are external URLs, not stored on the server.

## Reset / wipe the local DB

```bash
rm -rf server/data
# Restart the server. DB will be re-created and seeded fresh.
```

## Notes for the report

- Zero external runtime services. Runs on a laptop. Deploy is one `render.yaml` away.
- Socket.IO falls back to long-polling if WebSockets are blocked.
- Web Audio API used for kitchen alerts - no audio asset files.
- All timestamps in SQLite are UTC; client formats elapsed durations locally.
- Server-side schema migrations are idempotent and self-heal on every boot.
- State machine is centralised in `server/routes/orders.js` - the file is the source of truth for who can move what status.
