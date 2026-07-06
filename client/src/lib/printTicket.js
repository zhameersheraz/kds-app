// Printable ticket helper.
// Opens a popup window with a thermal-printer-friendly layout and auto-calls
// window.print(). Used by KDS (kitchen ticket) and ServerStatus (customer receipt).

import { CURRENCIES } from './currency';

function readCur() {
  try {
    const v = localStorage.getItem('kds_currency');
    if (v === 'USD') return CURRENCIES.USD;
  } catch (_) {}
  return CURRENCIES.PHP;
}

function money(n, cur) {
  const php = Number(n || 0);
  const display = cur.convert ? cur.convert(php) : php;
  const s = display.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return cur.code === 'PHP' ? 'PHP ' + s : cur.symbol + s;
}

export function printKitchenTicket(order) {
  openAndPrint(renderHTML(order, 'kitchen', readCur()), 'kitchen-ticket');
}

export function printCustomerReceipt(order) {
  openAndPrint(renderHTML(order, 'customer', readCur()), 'customer-receipt');
}

function renderHTML(order, kind, cur) {
  const subtotal = order.items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const now = new Date();
  const dateStr = now.toLocaleString();
  const title = kind === 'kitchen' ? 'KITCHEN TICKET' : 'CUSTOMER RECEIPT';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title} #${esc(order.table_number)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 12px; line-height: 1.4;
    padding: 6mm;
  }
  .center { text-align: center; }
  .bold   { font-weight: 700; }
  .big    { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
  hr      { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .row    { display: flex; justify-content: space-between; gap: 8px; }
  table   { width: 100%; border-collapse: collapse; }
  td      { padding: 1px 0; vertical-align: top; }
  td.qty  { width: 32px; font-weight: 700; }
  td.name { padding-right: 6px; }
  td.notes { font-size: 11px; color: #333; padding-left: 14px; font-style: italic; }
  .note-block { background: #f4f4f4; border: 1px solid #ccc; padding: 4px 6px; font-size: 11px; margin: 4px 0; }
  .total  { font-size: 14px; font-weight: 700; }
  .cut    { text-align: center; margin-top: 8px; font-size: 10px; letter-spacing: 2px; }
  @media print { body { padding: 0; } .no-print { display: none !important; } }
  .no-print { text-align: center; margin-top: 12px; font-size: 11px; color: #666; }
  .no-print button { padding: 6px 12px; font-size: 12px; margin: 0 4px; }
</style>
</head>
<body>
  <div class="center bold">${title}</div>
  <div class="center">${esc(dateStr)}</div>
  <hr />
  <div class="row"><span>Table</span><span class="bold">#${esc(order.table_number)}</span></div>
  <div class="row"><span>Server</span><span>${esc(order.server_name)}</span></div>
  <div class="row"><span>Status</span><span class="bold">${esc((order.status || '').toUpperCase())}</span></div>
  <div class="row"><span>Order</span><span style="font-size: 10px;">${esc(order.id)}</span></div>
  ${order.notes ? `<div class="note-block"><strong>Note:</strong> ${esc(order.notes)}</div>` : ''}
  <hr />
  <table>
    ${order.items.map((it) => `
      <tr>
        <td class="qty">${it.qty}x</td>
        <td class="name">${esc(it.name)}</td>
      </tr>
      ${it.notes ? `<tr><td></td><td class="notes">- ${esc(it.notes)}</td></tr>` : ''}
    `).join('')}
  </table>
  <hr />
  ${kind === 'customer' ? `
    <div class="row"><span>Subtotal</span><span>${money(subtotal, cur)}</span></div>
    <div class="row"><span>Tax (8%)</span><span>${money(tax, cur)}</span></div>
    <div class="row total"><span>TOTAL</span><span>${money(total, cur)}</span></div>
    <hr />
    <div class="center bold">Thank you</div>
  ` : `
    <div class="center bold big">#${esc(order.table_number)}</div>
    <div class="center" style="margin-top:4px;">Started: ${esc((order.created_at || '').replace('T',' ').slice(0,19))}</div>
  `}
  <div class="cut">- - - - - - - - - - - -</div>
  <div class="no-print">
    <button onclick="window.print()">Print</button>
    <button onclick="window.close()">Close</button>
  </div>
</body>
</html>`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  })[c]);
}

function openAndPrint(html, title) {
  const w = window.open('', title, 'width=380,height=620,scrollbars=yes');
  if (!w) {
    alert('Pop-up blocked. Allow pop-ups for this site to print tickets.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    try { w.focus(); w.print(); } catch (_) {}
  }, 150);
}