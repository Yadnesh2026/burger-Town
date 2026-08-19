import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';

export type Transaction = { billNo: string; outlet: string; brand: string; date: string; group: string; item: string; orderType: string; settlement: string; price: number; quantity: number; revenue: number };
type Filter = { start?: string; end?: string; outlet?: string; brand?: string; group?: string; orderType?: string };
let rows: Transaction[] | null = null;
const cache = new Map<string, unknown>();

const asText = (value: unknown) => String(value ?? '').trim();
const number = (value: unknown) => Number(String(value ?? 0).replace(/[^0-9.-]/g, '')) || 0;
function dateValue(value: unknown): string {
  if (value instanceof Date && !isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') { const d = XLSX.SSF.parse_date_code(value); return d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : ''; }
  const raw = asText(value); const match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  const parsed = new Date(raw); return isNaN(parsed.valueOf()) ? '' : parsed.toISOString().slice(0, 10);
}
function demo(): Transaction[] {
  const outlets = ['HSR Layout', 'Koramangala', 'Indiranagar', 'Whitefield']; const groups = ['Burgers', 'Sides', 'Drinks', 'Combos']; const types = ['Dine-In', 'Takeaway', 'Delivery']; const pay = ['Cash/Card/Coupon', 'Online', 'Swiggy', 'Zomato'];
  return Array.from({ length: 3000 }, (_, i) => { const d = new Date(2025, 0, 1 + (i % 180)); const price = 80 + (i * 17) % 320; const quantity = 1 + (i % 3); return { billNo: `DEMO-${Math.floor(i / 2)}`, outlet: outlets[i % 4], brand: 'Burger Town', date: d.toISOString().slice(0, 10), group: groups[i % 4], item: `${groups[i % 4]} item`, orderType: types[i % 3], settlement: pay[i % 4], price, quantity, revenue: price * quantity }; });
}
export function getRows(): Transaction[] {
  if (rows) return rows;
  const configured = process.env.DATA_FILE;
  const file = configured || path.join(process.cwd(), 'data', 'transactions.xlsx');
  if (!fs.existsSync(file)) return (rows = demo());
  // Read with Node's fs rather than XLSX.readFile so this also works in Next's server bundle.
  const workbook = XLSX.read(fs.readFileSync(file), { type: 'buffer', cellDates: true, dense: true });
  const source = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  rows = source.map(r => { const price = number(r.Price); const quantity = number(r.Quantity); return { billNo: asText(r.BillNo), outlet: asText(r.Outlet_Name), brand: asText(r.Brand), date: dateValue(r.Order_Datetime), group: asText(r.Group), item: asText(r.Item), orderType: asText(r.Order_Type), settlement: asText(r.Settlement), price, quantity, revenue: price * quantity }; }).filter(r => r.billNo && r.date);
  return rows;
}
const sumBy = (data: Transaction[], key: keyof Transaction) => Object.entries(data.reduce<Record<string, number>>((a, r) => { const label = String(r[key] || 'Unknown'); a[label] = (a[label] || 0) + r.revenue; return a; }, {})).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
export function filters() { const data = getRows(); const unique = (field: keyof Transaction) => [...new Set(data.map(x => String(x[field])).filter(Boolean))].sort(); return { outlets: unique('outlet'), brands: unique('brand'), groups: unique('group'), orderTypes: unique('orderType'), range: { start: data.reduce((m, r) => !m || r.date < m ? r.date : m, ''), end: data.reduce((m, r) => r.date > m ? r.date : m, '') }, rows: data.length, mode: process.env.DATA_FILE || fs.existsSync(path.join(process.cwd(), 'data', 'transactions.xlsx')) ? 'Workbook' : 'Demo data' }; }
export function dashboard(filter: Filter) {
  const key = JSON.stringify(filter); if (cache.has(key)) return cache.get(key);
  const data = getRows().filter(r => (!filter.start || r.date >= filter.start) && (!filter.end || r.date <= filter.end) && (!filter.outlet || r.outlet === filter.outlet) && (!filter.brand || r.brand === filter.brand) && (!filter.group || r.group === filter.group) && (!filter.orderType || r.orderType === filter.orderType));
  const orders = new Set(data.map(r => r.billNo)); const revenue = data.reduce((total, r) => total + r.revenue, 0); const quantities = data.reduce((total, r) => total + r.quantity, 0);
  const byDay = Object.entries(data.reduce<Record<string, number>>((a, r) => { a[r.date] = (a[r.date] || 0) + r.revenue; return a; }, {})).map(([date, value]) => ({ date, revenue: Math.round(value) })).sort((a, b) => a.date.localeCompare(b.date));
  const result = { metrics: { records: data.length, orders: orders.size, revenue: Math.round(revenue), averageOrder: orders.size ? Math.round(revenue / orders.size) : 0, items: quantities }, charts: { byDay, byCategory: sumBy(data, 'group').slice(0, 8), byOutlet: sumBy(data, 'outlet').slice(0, 8), bySettlement: sumBy(data, 'settlement').slice(0, 6) } };
  cache.set(key, result); if (cache.size > 50) cache.delete(cache.keys().next().value!); return result;
}
