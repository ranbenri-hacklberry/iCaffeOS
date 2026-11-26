/**
 * Report aggregation helpers for the manager Reports screen (דוחות).
 *
 * Pure functions only (no React / Supabase) so they can be unit-tested.
 *
 * ── Time zone ──
 * All period boundaries are computed in Asia/Jerusalem, independent of the
 * device time zone, and returned as absolute Date instants (UTC) suitable for
 * `created_at` range filters. DST transitions are handled via Intl.
 *
 * ── Payment model (from the `orders` table + submit_order_v3 / KDSPaymentModal) ──
 *  - One payment method per order (`payment_method`); split tenders are not
 *    stored by the POS today. If `paid_amount` > 0 on an order that is not yet
 *    fully paid, that partial amount is counted as received under the order's
 *    method and the remainder is shown as open.
 *  - `total_amount` is the FINAL total after edits/refunds (p_final_total).
 *    `refund_amount` is the amount that was returned to the customer and
 *    `refund_method` (fallback `payment_method`) is how it was returned.
 *    Because the refund is already netted out of `total_amount`, refunds are
 *    reported for information only and are NOT subtracted a second time.
 *  - Cancelled orders (`order_status = 'cancelled'`) are excluded from revenue,
 *    KPIs and the method breakdown; their count (and any refund on them) is
 *    reported separately.
 *  - `oth` = "על חשבון הבית" (on the house): ₪0 received, consistent with the
 *    existing revenue KPI. Shown separately with its menu value.
 *  - Unpaid orders (`is_paid = false`) are shown as "open" and are not counted
 *    as received.
 *  Reconciliation: received + open === revenue KPI (sum of non-OTH,
 *  non-cancelled order totals).
 */

export const REPORT_TZ = 'Asia/Jerusalem';
const DAY_MS = 24 * 60 * 60 * 1000;

// ───────────────────────── Time-zone helpers ─────────────────────────

const partsFormatterCache = {};
const getPartsFormatter = (tz) => {
  if (!partsFormatterCache[tz]) {
    partsFormatterCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short'
    });
  }
  return partsFormatterCache[tz];
};

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock parts of an instant in the given zone. month is 1-12. */
export const getZonedParts = (date, tz = REPORT_TZ) => {
  const out = {};
  getPartsFormatter(tz)
    .formatToParts(new Date(date))
    .forEach(({ type, value }) => { out[type] = value; });
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour) % 24,
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: WEEKDAY_INDEX[out.weekday]
  };
};

/** Offset (ms) of the zone from UTC at the given instant. */
const getZoneOffsetMs = (date, tz) => {
  const p = getZonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const ms = new Date(date).getTime();
  return asUtc - (ms - (ms % 1000));
};

/** The instant of a wall-clock time in the zone. Handles out-of-range day/month (normalised). */
export const zonedWallTimeToDate = (year, month1, day, hour = 0, minute = 0, second = 0, ms = 0, tz = REPORT_TZ) => {
  const guess = Date.UTC(year, month1 - 1, day, hour, minute, second, ms);
  let offset = getZoneOffsetMs(new Date(guess), tz);
  let result = guess - offset;
  // Re-check once around DST transitions.
  const offset2 = getZoneOffsetMs(new Date(result), tz);
  if (offset2 !== offset) result = guess - offset2;
  return new Date(result);
};

/** Calendar date {year, month, day} in the zone, shifted by `days`. */
export const addZonedDays = ({ year, month, day }, days) => {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

const startOfZonedDay = (ymd, tz) => zonedWallTimeToDate(ymd.year, ymd.month, ymd.day, 0, 0, 0, 0, tz);
const endOfZonedDay = (ymd, tz) => new Date(startOfZonedDay(addZonedDays(ymd, 1), tz).getTime() - 1);

/**
 * Period range for the reports screen.
 *  - daily:   offset 0 = today (Jerusalem), -1 = yesterday ...
 *  - weekly:  Sunday 00:00 → Friday 23:59:59.999 (existing behaviour), offset 0 = this week
 *  - monthly: 1st → last day (capped to end of today for the current month)
 * Returns { start, end, startYmd, endYmd } with start/end as Date instants.
 */
export const getReportPeriodRange = (offset, mode, now = new Date(), tz = REPORT_TZ) => {
  const today = getZonedParts(now, tz);
  const todayYmd = { year: today.year, month: today.month, day: today.day };

  if (mode === 'daily') {
    const ymd = addZonedDays(todayYmd, offset);
    return { start: startOfZonedDay(ymd, tz), end: endOfZonedDay(ymd, tz), startYmd: ymd, endYmd: ymd };
  }

  if (mode === 'monthly') {
    const first = new Date(Date.UTC(today.year, today.month - 1 + offset, 1));
    const startYmd = { year: first.getUTCFullYear(), month: first.getUTCMonth() + 1, day: 1 };
    const last = new Date(Date.UTC(startYmd.year, startYmd.month, 0));
    let endYmd = { year: last.getUTCFullYear(), month: last.getUTCMonth() + 1, day: last.getUTCDate() };
    if (startYmd.year === today.year && startYmd.month === today.month) endYmd = todayYmd;
    return { start: startOfZonedDay(startYmd, tz), end: endOfZonedDay(endYmd, tz), startYmd, endYmd };
  }

  // weekly (Sun–Fri)
  const sundayYmd = addZonedDays(todayYmd, -today.weekday + offset * 7);
  const fridayYmd = addZonedDays(sundayYmd, 5);
  return { start: startOfZonedDay(sundayYmd, tz), end: endOfZonedDay(fridayYmd, tz), startYmd: sundayYmd, endYmd: fridayYmd };
};

export const isWithinRange = (date, range) => {
  const t = new Date(date).getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
};

// ───────────────────────── Matrix columns ─────────────────────────

export const DAYS_OF_WEEK = [
  { index: 0, label: 'א׳', key: 'sun' },
  { index: 1, label: 'ב׳', key: 'mon' },
  { index: 2, label: 'ג׳', key: 'tue' },
  { index: 3, label: 'ד׳', key: 'wed' },
  { index: 4, label: 'ה׳', key: 'thu' },
  { index: 5, label: 'ו׳', key: 'fri' }
];

export const WEEKS_OF_MONTH = [
  { index: 1, label: 'שב׳ 1', key: 'w1' },
  { index: 2, label: 'שב׳ 2', key: 'w2' },
  { index: 3, label: 'שב׳ 3', key: 'w3' },
  { index: 4, label: 'שב׳ 4', key: 'w4' },
  { index: 5, label: 'שב׳ 5', key: 'w5' }
];

/** Daily report columns: Jerusalem hour slots. */
export const HOURS_OF_DAY = [
  { label: '0–9', key: 'h0', fromHour: 0 },
  { label: '9–12', key: 'h1', fromHour: 9 },
  { label: '12–15', key: 'h2', fromHour: 12 },
  { label: '15–18', key: 'h3', fromHour: 15 },
  { label: '18+', key: 'h4', fromHour: 18 }
];

export const getColumnsForMode = (mode) =>
  mode === 'monthly' ? WEEKS_OF_MONTH : mode === 'daily' ? HOURS_OF_DAY : DAYS_OF_WEEK;

export const ALL_COLUMN_KEYS = [...DAYS_OF_WEEK, ...WEEKS_OF_MONTH, ...HOURS_OF_DAY].map(c => c.key);

export const getPeriodColumnKey = (date, periodStart, mode, tz = REPORT_TZ) => {
  if (mode === 'monthly') {
    const p = getZonedParts(date, tz);
    const s = getZonedParts(periodStart, tz);
    const diffDays = Math.round((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(s.year, s.month - 1, s.day)) / DAY_MS);
    const weekNum = Math.floor(diffDays / 7) + 1;
    return `w${Math.min(5, Math.max(1, weekNum))}`;
  }
  if (mode === 'daily') {
    const { hour } = getZonedParts(date, tz);
    let key = HOURS_OF_DAY[0].key;
    HOURS_OF_DAY.forEach(col => { if (hour >= col.fromHour) key = col.key; });
    return key;
  }
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  return dayKeys[getZonedParts(date, tz).weekday] || 'fri';
};

// ───────────────────────── Payment methods ─────────────────────────

export const PAYMENT_BUCKETS = [
  { key: 'cash', label: 'מזומן' },
  { key: 'credit', label: 'אשראי' },
  { key: 'gift', label: 'שוברים / גיפט' },
  { key: 'bit', label: 'Bit' },
  { key: 'paybox', label: 'PayBox' },
  { key: 'other', label: 'אחר' }
];

const METHOD_ALIASES = {
  cash: 'cash', 'מזומן': 'cash',
  credit_card: 'credit', credit: 'credit', card: 'credit', cc: 'credit', 'אשראי': 'credit',
  gift_card: 'gift', gift: 'gift', giftcard: 'gift', voucher: 'gift', coupon: 'gift', 'שובר': 'gift', 'שוברים': 'gift',
  bit: 'bit', 'ביט': 'bit',
  paybox: 'paybox', pay_box: 'paybox', 'פייבוקס': 'paybox',
  oth: 'oth', on_the_house: 'oth'
};

/** Raw `payment_method` → bucket key ('cash' | 'credit' | 'gift' | 'bit' | 'paybox' | 'oth' | 'other'). */
export const normalizePaymentMethod = (raw) => {
  if (raw === null || raw === undefined) return 'other';
  const key = String(raw).trim().toLowerCase();
  return METHOD_ALIASES[key] || 'other';
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;

export const isCancelledOrder = (order) => order?.order_status === 'cancelled';

/**
 * Aggregate orders (already filtered to the period) into a payment breakdown.
 * Orders: { total_amount|total, payment_method, is_paid, paid_amount, is_refund,
 *           refund_amount, refund_method, order_status }
 */
export const aggregatePayments = (orders = []) => {
  const buckets = {};
  PAYMENT_BUCKETS.forEach(b => { buckets[b.key] = { ...b, amount: 0, count: 0, pct: 0 }; });
  const open = { amount: 0, count: 0 };
  const oth = { count: 0, value: 0 };
  const refunds = { amount: 0, count: 0, byMethod: {} };
  const cancelled = { count: 0 };
  let revenue = 0;

  orders.forEach(order => {
    const total = num(order.total_amount ?? order.total);
    const refundAmt = num(order.refund_amount);
    const hasRefund = refundAmt > 0;

    if (hasRefund) {
      const rKey = normalizePaymentMethod(order.refund_method || order.payment_method);
      refunds.amount += refundAmt;
      refunds.count += 1;
      refunds.byMethod[rKey] = round2((refunds.byMethod[rKey] || 0) + refundAmt);
    }

    if (isCancelledOrder(order)) {
      cancelled.count += 1;
      return;
    }

    const method = normalizePaymentMethod(order.payment_method);
    if (method === 'oth') {
      oth.count += 1;
      oth.value += total;
      return;
    }

    revenue += total;

    if (order.is_paid) {
      if (total !== 0 || !hasRefund) {
        buckets[method].amount += total;
        buckets[method].count += 1;
      }
      return;
    }

    // Unpaid / open. A partial payment (paid_amount) is counted as received.
    const partial = Math.min(Math.max(num(order.paid_amount), 0), total);
    if (partial > 0) {
      buckets[method].amount += partial;
      buckets[method].count += 1;
    }
    const remaining = total - partial;
    if (remaining > 0) {
      open.amount += remaining;
      open.count += 1;
    }
  });

  const list = PAYMENT_BUCKETS.map(b => buckets[b.key]);
  const received = list.reduce((s, b) => s + b.amount, 0);
  list.forEach(b => {
    b.amount = round2(b.amount);
    b.pct = received > 0 ? round2((b.amount / received) * 100) : 0;
  });
  const transactions = list.reduce((s, b) => s + b.count, 0);

  return {
    buckets: list,
    received: round2(received),
    transactions,
    open: { amount: round2(open.amount), count: open.count },
    oth: { count: oth.count, value: round2(oth.value) },
    refunds: { ...refunds, amount: round2(refunds.amount) },
    cancelled,
    revenue: round2(revenue),
    reconciledTotal: round2(received + open.amount),
    isReconciled: Math.abs(round2(received + open.amount) - round2(revenue)) < 0.01
  };
};

/** Revenue / order KPIs consistent with the payment breakdown (cancelled excluded, OTH = ₪0). */
export const computeKpis = (orders = []) => {
  const active = orders.filter(o => !isCancelledOrder(o));
  const totalRevenue = active.reduce(
    (s, o) => s + (normalizePaymentMethod(o.payment_method) === 'oth' ? 0 : num(o.total_amount ?? o.total)),
    0
  );
  const totalOrders = active.length;
  return {
    totalRevenue: round2(totalRevenue),
    totalOrders,
    aov: totalOrders > 0 ? totalRevenue / totalOrders : 0
  };
};
