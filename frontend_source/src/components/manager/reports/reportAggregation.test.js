import { describe, it, expect } from 'vitest';
import {
  getReportPeriodRange,
  getPeriodColumnKey,
  getZonedParts,
  isWithinRange,
  normalizePaymentMethod,
  aggregatePayments,
  computeKpis
} from './reportAggregation';

const order = (o) => ({
  total_amount: 0,
  payment_method: 'cash',
  is_paid: true,
  paid_amount: 0,
  is_refund: false,
  refund_amount: 0,
  refund_method: null,
  order_status: 'completed',
  ...o
});
const bucket = (res, key) => res.buckets.find(b => b.key === key);

describe('getReportPeriodRange – Asia/Jerusalem day boundaries', () => {
  it('daily: today in Jerusalem winter time (UTC+2)', () => {
    // 2026-11-26 21:30Z == 2026-11-26 23:30 in Jerusalem
    const now = new Date('2026-11-26T21:30:00Z');
    const r = getReportPeriodRange(0, 'daily', now);
    expect(r.start.toISOString()).toBe('2026-11-25T22:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-11-26T21:59:59.999Z');
    expect(r.startYmd).toEqual({ year: 2026, month: 11, day: 26 });
  });

  it('daily: just after Jerusalem midnight is already the next day', () => {
    // 2026-11-26 22:10Z == 2026-11-27 00:10 in Jerusalem
    const r = getReportPeriodRange(0, 'daily', new Date('2026-11-26T22:10:00Z'));
    expect(r.startYmd).toEqual({ year: 2026, month: 11, day: 27 });
    expect(r.start.toISOString()).toBe('2026-11-26T22:00:00.000Z');
  });

  it('daily: summer time (UTC+3) and negative offsets', () => {
    const r = getReportPeriodRange(-1, 'daily', new Date('2026-07-15T10:00:00Z'));
    expect(r.startYmd).toEqual({ year: 2026, month: 7, day: 14 });
    expect(r.start.toISOString()).toBe('2026-07-13T21:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-07-14T20:59:59.999Z');
  });

  it('daily: DST start day (27/03/2026) is 23 hours long', () => {
    const r = getReportPeriodRange(0, 'daily', new Date('2026-03-27T12:00:00Z'));
    expect(r.start.toISOString()).toBe('2026-03-26T22:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-03-27T20:59:59.999Z');
  });

  it('daily: crosses month/year boundary', () => {
    const r = getReportPeriodRange(-1, 'daily', new Date('2027-01-01T08:00:00Z'));
    expect(r.startYmd).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it('weekly: Sunday 00:00 → Friday 23:59 Jerusalem', () => {
    // Thursday 26/11/2026
    const r = getReportPeriodRange(-1, 'weekly', new Date('2026-11-26T10:00:00Z'));
    expect(r.startYmd).toEqual({ year: 2026, month: 11, day: 15 });
    expect(r.endYmd).toEqual({ year: 2026, month: 11, day: 20 });
    expect(r.start.toISOString()).toBe('2026-11-14T22:00:00.000Z');
  });

  it('monthly: current month is capped to end of today', () => {
    const r = getReportPeriodRange(0, 'monthly', new Date('2026-11-26T10:00:00Z'));
    expect(r.startYmd).toEqual({ year: 2026, month: 11, day: 1 });
    expect(r.endYmd).toEqual({ year: 2026, month: 11, day: 26 });
    const prev = getReportPeriodRange(-1, 'monthly', new Date('2026-11-26T10:00:00Z'));
    expect(prev.endYmd).toEqual({ year: 2026, month: 10, day: 31 });
    // October 31 is still summer time? No – DST ended 25/10/2026, so end is 21:59:59.999Z
    expect(prev.end.toISOString()).toBe('2026-10-31T21:59:59.999Z');
  });

  it('an order at 23:30 Jerusalem belongs to that day, not the next (UTC date differs)', () => {
    const r = getReportPeriodRange(0, 'daily', new Date('2026-09-13T09:00:00Z'));
    expect(isWithinRange('2026-09-13T20:30:00Z', r)).toBe(true); // 23:30 IDT
    expect(isWithinRange('2026-09-13T21:00:00Z', r)).toBe(false); // 00:00 next day
    expect(isWithinRange('2026-09-12T21:00:00Z', r)).toBe(true); // 00:00 IDT
  });
});

describe('getPeriodColumnKey', () => {
  it('daily mode buckets by Jerusalem hour', () => {
    const start = new Date('2026-11-25T22:00:00Z');
    expect(getPeriodColumnKey(new Date('2026-11-26T05:00:00Z'), start, 'daily')).toBe('h0'); // 07:00
    expect(getPeriodColumnKey(new Date('2026-11-26T07:00:00Z'), start, 'daily')).toBe('h1'); // 09:00
    expect(getPeriodColumnKey(new Date('2026-11-26T11:59:00Z'), start, 'daily')).toBe('h2'); // 13:59
    expect(getPeriodColumnKey(new Date('2026-11-26T16:00:00Z'), start, 'daily')).toBe('h4'); // 18:00
  });
  it('weekly mode uses the Jerusalem weekday (late-night UTC rollover)', () => {
    // Sat 21:30Z == Sun 00:30 Jerusalem (winter)? 2026-11-21 is Saturday; +2h => Sunday
    expect(getPeriodColumnKey(new Date('2026-11-21T22:30:00Z'), new Date(), 'weekly')).toBe('sun');
    expect(getZonedParts(new Date('2026-11-21T22:30:00Z')).weekday).toBe(0);
  });
  it('monthly mode week numbers', () => {
    const r = getReportPeriodRange(-1, 'monthly', new Date('2026-11-26T10:00:00Z'));
    expect(getPeriodColumnKey(new Date('2026-10-01T06:00:00Z'), r.start, 'monthly')).toBe('w1');
    expect(getPeriodColumnKey(new Date('2026-10-08T06:00:00Z'), r.start, 'monthly')).toBe('w2');
    expect(getPeriodColumnKey(new Date('2026-10-31T20:00:00Z'), r.start, 'monthly')).toBe('w5');
  });
});

describe('normalizePaymentMethod', () => {
  it('maps raw POS values to buckets', () => {
    expect(normalizePaymentMethod('cash')).toBe('cash');
    expect(normalizePaymentMethod('credit_card')).toBe('credit');
    expect(normalizePaymentMethod('credit')).toBe('credit');
    expect(normalizePaymentMethod('gift_card')).toBe('gift');
    expect(normalizePaymentMethod('gift')).toBe('gift');
    expect(normalizePaymentMethod('BIT')).toBe('bit');
    expect(normalizePaymentMethod('paybox')).toBe('paybox');
    expect(normalizePaymentMethod('oth')).toBe('oth');
    expect(normalizePaymentMethod(null)).toBe('other');
    expect(normalizePaymentMethod('crypto')).toBe('other');
  });
});

describe('aggregatePayments', () => {
  it('sums amounts, counts and percentages per method', () => {
    const res = aggregatePayments([
      order({ total_amount: 100, payment_method: 'cash' }),
      order({ total_amount: 50, payment_method: 'cash' }),
      order({ total_amount: 250, payment_method: 'credit_card' }),
      order({ total_amount: 40, payment_method: 'gift_card' }),
      order({ total_amount: 30, payment_method: 'bit' }),
      order({ total_amount: 20, payment_method: 'paybox' }),
      order({ total_amount: 10, payment_method: null })
    ]);
    expect(bucket(res, 'cash')).toMatchObject({ amount: 150, count: 2 });
    expect(bucket(res, 'credit')).toMatchObject({ amount: 250, count: 1, pct: 50 });
    expect(bucket(res, 'gift')).toMatchObject({ amount: 40, count: 1 });
    expect(bucket(res, 'bit')).toMatchObject({ amount: 30, count: 1 });
    expect(bucket(res, 'paybox')).toMatchObject({ amount: 20, count: 1 });
    expect(bucket(res, 'other')).toMatchObject({ amount: 10, count: 1, pct: 2 });
    expect(res.received).toBe(500);
    expect(res.transactions).toBe(7);
    expect(res.buckets.reduce((s, b) => s + b.pct, 0)).toBeCloseTo(100, 5);
    expect(res.isReconciled).toBe(true);
  });

  it('unpaid orders are open, not received; partial payments split', () => {
    const res = aggregatePayments([
      order({ total_amount: 100, payment_method: 'cash' }),
      order({ total_amount: 60, payment_method: null, is_paid: false }),
      order({ total_amount: 80, payment_method: 'credit_card', is_paid: false, paid_amount: 30 })
    ]);
    expect(res.received).toBe(130);
    expect(bucket(res, 'credit')).toMatchObject({ amount: 30, count: 1 });
    expect(res.open).toEqual({ amount: 110, count: 2 });
    expect(res.revenue).toBe(240);
    expect(res.reconciledTotal).toBe(240);
    expect(res.isReconciled).toBe(true);
  });

  it('refunds are reported but not double-subtracted (total_amount is already net)', () => {
    const res = aggregatePayments([
      // order edited from 50 → 32, ₪18 returned in cash
      order({ total_amount: 32, payment_method: 'cash', is_refund: true, refund_amount: 18 }),
      // fully refunded on credit, order kept with total 0
      order({ total_amount: 0, payment_method: 'credit_card', is_refund: true, refund_amount: 40, refund_method: 'credit_card' })
    ]);
    expect(bucket(res, 'cash').amount).toBe(32);
    expect(bucket(res, 'credit')).toMatchObject({ amount: 0, count: 0 });
    expect(res.received).toBe(32);
    expect(res.refunds.amount).toBe(58);
    expect(res.refunds.count).toBe(2);
    expect(res.refunds.byMethod).toEqual({ cash: 18, credit: 40 });
  });

  it('cancelled orders are excluded from received/revenue but counted (with their refunds)', () => {
    const res = aggregatePayments([
      order({ total_amount: 100, payment_method: 'cash' }),
      order({ total_amount: 0, payment_method: 'cash', order_status: 'cancelled', is_refund: true, refund_amount: 16 }),
      order({ total_amount: 45, payment_method: 'credit_card', order_status: 'cancelled' })
    ]);
    expect(res.received).toBe(100);
    expect(res.revenue).toBe(100);
    expect(res.cancelled.count).toBe(2);
    expect(res.refunds.amount).toBe(16);
    expect(bucket(res, 'credit').count).toBe(0);
  });

  it('OTH (on the house) is ₪0 received and reported by value', () => {
    const res = aggregatePayments([
      order({ total_amount: 100, payment_method: 'cash' }),
      order({ total_amount: 28, payment_method: 'oth' })
    ]);
    expect(res.received).toBe(100);
    expect(res.oth).toEqual({ count: 1, value: 28 });
    expect(bucket(res, 'other').amount).toBe(0);
    expect(res.revenue).toBe(100);
    expect(res.isReconciled).toBe(true);
  });

  it('handles decimals and empty input', () => {
    const res = aggregatePayments([
      order({ total_amount: '10.10', payment_method: 'cash' }),
      order({ total_amount: 20.2, payment_method: 'cash' })
    ]);
    expect(bucket(res, 'cash').amount).toBe(30.3);
    const empty = aggregatePayments([]);
    expect(empty.received).toBe(0);
    expect(empty.buckets.every(b => b.pct === 0)).toBe(true);
    expect(empty.isReconciled).toBe(true);
  });
});

describe('computeKpis', () => {
  it('matches the breakdown revenue (cancelled excluded, OTH as ₪0)', () => {
    const orders = [
      order({ total_amount: 100 }),
      order({ total_amount: 60, is_paid: false, payment_method: null }),
      order({ total_amount: 28, payment_method: 'oth' }),
      order({ total_amount: 45, order_status: 'cancelled' })
    ];
    const k = computeKpis(orders);
    expect(k.totalRevenue).toBe(160);
    expect(k.totalOrders).toBe(3);
    expect(k.aov).toBeCloseTo(160 / 3, 5);
    expect(aggregatePayments(orders).revenue).toBe(k.totalRevenue);
  });
});
