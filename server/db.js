// SQLite database setup + schema + initial seed.
// Uses better-sqlite3 (synchronous, fast, zero-config for a school project).

const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'kds.db');
const fs = require('fs');
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Schema ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('server','kitchen','admin')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    price       REAL NOT NULL,
    description TEXT,
    image       TEXT,
    available   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             TEXT PRIMARY KEY,
    table_number   TEXT NOT NULL,
    server_id      TEXT NOT NULL,
    server_name    TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','preparing','ready','served','cancelled')),
    total          REAL NOT NULL,
    notes          TEXT,
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (server_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id           TEXT PRIMARY KEY,
    order_id     TEXT NOT NULL,
    menu_item_id TEXT,
    name         TEXT NOT NULL,
    qty          INTEGER NOT NULL,
    price        REAL NOT NULL,
    notes        TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_server   ON orders(server_id);
  CREATE INDEX IF NOT EXISTS idx_orders_table    ON orders(table_number);
  CREATE INDEX IF NOT EXISTS idx_items_order     ON order_items(order_id);
`);

// --- Schema migrations (self-healing on old DBs) ---------------------------
function migrate() {
  // v2: add `image` column to menu_items if missing
  const cols = db.prepare("PRAGMA table_info(menu_items)").all();
  const hasImage = cols.some((c) => c.name === 'image');
  if (!hasImage) {
    db.exec('ALTER TABLE menu_items ADD COLUMN image TEXT');
    console.log('[db] migration: added menu_items.image column');
  }
  // v2: replace old menu entirely if it predates this version. Detected by
  // presence of removed/renamed items (Apple Pie, Coffee, Bacon BBQ Burger).
  const oldMarkers = db.prepare(
    "SELECT COUNT(*) AS c FROM menu_items WHERE name IN ('Apple Pie','Coffee','Bacon BBQ Burger')"
  ).get().c;
  if (oldMarkers > 0) {
    db.exec('DELETE FROM menu_items');
    console.log('[db] migration: cleared legacy menu (Apple Pie / Coffee / Bacon removed)');
  }
}
migrate();

// --- Seed on first boot ---------------------------------------------------
function seedIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const menuCount = db.prepare('SELECT COUNT(*) AS c FROM menu_items').get().c;

  if (userCount === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (id, name, username, password_hash, role) VALUES (?,?,?,?,?)'
    );
    const seedUsers = [
      { id: 'u_admin', name: 'zham',     username: 'zham',     password: 'zham123', role: 'admin'   },
      { id: 'u_server',name: 'Sam',      username: 'server',   password: 'server123', role: 'server' },
      { id: 'u_kitch', name: 'Kim',      username: 'kitchen',  password: 'kitchen123', role: 'kitchen' }
    ];
    const tx = db.transaction((rows) => {
      for (const u of rows) {
        insertUser.run(u.id, u.name, u.username, bcrypt.hashSync(u.password, 10), u.role);
      }
    });
    tx(seedUsers);
    console.log('[db] seeded users: zham/zham123 (admin), server/server123, kitchen/kitchen123');
  } else {
    // Self-healing migration: ensure the canonical admin exists with the
    // current default password. Old DBs that have 'admin/admin123' get fixed.
    const admin = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('admin');
    if (admin) {
      const wantsZham = admin.username !== 'zham';
      const wantsPwd  = !bcrypt.compareSync('zham123', admin.password_hash);
      if (wantsZham || wantsPwd) {
        db.prepare(
          'UPDATE users SET username = ?, name = ?, password_hash = ? WHERE id = ?'
        ).run('zham', 'zham', bcrypt.hashSync('zham123', 10), admin.id);
        console.log('[db] admin account updated to zham/zham123');
      }
    } else {
      // No admin at all, create one.
      db.prepare(
        'INSERT INTO users (id, name, username, password_hash, role) VALUES (?,?,?,?,?)'
      ).run('u_admin', 'zham', 'zham', bcrypt.hashSync('zham123', 10), 'admin');
      console.log('[db] admin account created: zham/zham123');
    }
  }

  if (menuCount === 0) {
    const insertItem = db.prepare(
      'INSERT INTO menu_items (id, name, category, price, description, image) VALUES (?,?,?,?,?,?)'
    );
    const seedMenu = [
      // Burgers
      { id: 'm1',  name: 'Classic Cheeseburger', category: 'Burgers', price: 220, description: 'Beef patty, cheddar, lettuce, tomato, house sauce',           image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop&auto=format' },
      { id: 'm2',  name: 'Smokehouse Burger',   category: 'Burgers', price: 260, description: 'Beef patty, smoked cheese, grilled onion, BBQ glaze',          image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=600&fit=crop&auto=format' },
      { id: 'm3',  name: 'Mushroom Swiss',      category: 'Burgers', price: 245, description: 'Beef patty, sauteed mushroom, swiss, garlic aioli',            image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=600&fit=crop&auto=format' },
      { id: 'm4',  name: 'Veggie Burger',       category: 'Burgers', price: 210, description: 'Black bean patty, avocado, sprouts, tomato',                    image: 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600&h=600&fit=crop&auto=format' },
      { id: 'm5',  name: 'Chicken Sandwich',    category: 'Burgers', price: 215, description: 'Grilled chicken breast, slaw, pickle, mustard mayo',            image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&h=600&fit=crop&auto=format' },
      // Sides
      { id: 'm6',  name: 'French Fries',        category: 'Sides',   price: 95,  description: 'Crispy, lightly salted',                                        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=600&fit=crop&auto=format' },
      { id: 'm7',  name: 'Onion Rings',         category: 'Sides',   price: 110, description: 'Beer-battered, crunchy',                                        image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=600&fit=crop&auto=format' },
      { id: 'm8',  name: 'Side Salad',          category: 'Sides',   price: 125, description: 'Mixed greens, tomato, vinaigrette',                             image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=600&fit=crop&auto=format' },
      { id: 'm9',  name: 'Sweet Potato Fries',  category: 'Sides',   price: 115, description: 'With chipotle mayo',                                            image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&h=600&fit=crop&auto=format' },
      // Drinks
      { id: 'm10', name: 'Cola',                category: 'Drinks',  price: 65,  description: 'Ice-cold can',                                                  image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop&auto=format' },
      { id: 'm11', name: 'Iced Tea',            category: 'Drinks',  price: 75,  description: 'House-brewed, sweet or unsweetened',                            image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop&auto=format' },
      { id: 'm12', name: 'Lemonade',            category: 'Drinks',  price: 85,  description: 'Fresh-squeezed, with mint',                                     image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=600&fit=crop&auto=format' },
      { id: 'm13', name: 'Iced Coffee',         category: 'Drinks',  price: 95,  description: 'Cold brew over ice',                                            image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600&h=600&fit=crop&auto=format' },
      // Desserts
      { id: 'm14', name: 'Chocolate Brownie',   category: 'Desserts',price: 140, description: 'Warm, fudge sauce, vanilla ice cream',                          image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop&auto=format' },
      { id: 'm15', name: 'Cheesecake Slice',    category: 'Desserts',price: 160, description: 'New-York style, berry compote',                                 image: 'https://images.unsplash.com/photo-1567306301406-9f9cf134a9f5?w=600&h=600&fit=crop&auto=format' }
    ];
    const tx = db.transaction((rows) => {
      for (const m of rows) insertItem.run(m.id, m.name, m.category, m.price, m.description, m.image);
    });
    tx(seedMenu);
    console.log('[db] seeded menu items (15 across 4 categories) - default prices in PHP');
  } else {
    // Self-heal: if any of the new items are missing, insert them.
    // Also update image URLs for items that still have the old SVG key (e.g. "burger").
    const PHOTOS = {
      'm1':  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop&auto=format',
      'm2':  'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&h=600&fit=crop&auto=format',
      'm3':  'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=600&fit=crop&auto=format',
      'm4':  'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600&h=600&fit=crop&auto=format',
      'm5':  'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&h=600&fit=crop&auto=format',
      'm6':  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=600&fit=crop&auto=format',
      'm7':  'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=600&fit=crop&auto=format',
      'm8':  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=600&fit=crop&auto=format',
      'm9':  'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&h=600&fit=crop&auto=format',
      'm10': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop&auto=format',
      'm11': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=600&fit=crop&auto=format',
      'm12': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&h=600&fit=crop&auto=format',
      'm13': 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=600&h=600&fit=crop&auto=format',
      'm14': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop&auto=format',
      'm15': 'https://images.unsplash.com/photo-1567306301406-9f9cf134a9f5?w=600&h=600&fit=crop&auto=format'
    };
    const updateImg = db.prepare('UPDATE menu_items SET image = ? WHERE id = ?');
    let updated = 0;
    for (const [id, url] of Object.entries(PHOTOS)) {
      const r = updateImg.run(url, id);
      if (r.changes > 0) updated++;
    }
    if (updated) console.log(`[db] menu migration: refreshed ${updated} image URL(s)`);
  }
}

seedIfEmpty();

module.exports = db;