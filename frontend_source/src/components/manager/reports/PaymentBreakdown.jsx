import React from 'react';
import { Banknote, CreditCard, Gift, Smartphone, Wallet, CircleHelp, Clock, RotateCcw, Star, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

const fmt = (n, digits = 0) =>
  `₪${Number(n || 0).toLocaleString('he-IL', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

const BUCKET_STYLE = {
  cash: { icon: Banknote, color: 'text-green-700 bg-green-100', bar: 'bg-green-500' },
  credit: { icon: CreditCard, color: 'text-blue-700 bg-blue-100', bar: 'bg-blue-500' },
  gift: { icon: Gift, color: 'text-purple-700 bg-purple-100', bar: 'bg-purple-500' },
  bit: { icon: Smartphone, color: 'text-cyan-700 bg-cyan-100', bar: 'bg-cyan-500' },
  paybox: { icon: Wallet, color: 'text-pink-700 bg-pink-100', bar: 'bg-pink-500' },
  other: { icon: CircleHelp, color: 'text-slate-600 bg-slate-100', bar: 'bg-slate-400' }
};

const METHOD_LABEL = { cash: 'מזומן', credit: 'אשראי', gift: 'שובר', bit: 'Bit', paybox: 'PayBox', oth: 'OTH', other: 'אחר' };

/**
 * Financial breakdown by payment method (דוח פיננסי).
 * `data` is the output of aggregatePayments().
 */
export const PaymentBreakdown = ({ data, periodLabel }) => {
  if (!data) return null;
  const { buckets, received, transactions, open, oth, refunds, cancelled, reconciledTotal, revenue, isReconciled } = data;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" dir="rtl" data-testid="payment-breakdown">
      <div className="bg-slate-50 border-b border-gray-100 px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="font-black text-gray-800 text-sm sm:text-base flex items-center gap-2 whitespace-nowrap">
          <Wallet size={18} className="text-blue-600" />
          <span>פירוט כספי לפי אמצעי תשלום</span>
        </h3>
        {periodLabel && <span className="text-[11px] font-bold text-gray-500">{periodLabel}</span>}
      </div>

      <div className="overflow-x-auto sm:overflow-visible">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-slate-50/50">
              <th className="px-3 sm:px-5 py-3 text-right">אמצעי תשלום</th>
              <th className="px-2 sm:px-4 py-3 text-center">עסקאות</th>
              <th className="px-2 sm:px-4 py-3 text-center w-28 sm:w-48">% מהתקבולים</th>
              <th className="px-3 sm:px-5 py-3 text-left">סכום</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map(b => {
              const style = BUCKET_STYLE[b.key] || BUCKET_STYLE.other;
              const Icon = style.icon;
              const empty = b.count === 0 && b.amount === 0;
              return (
                <tr key={b.key} className={`border-b border-gray-100 text-[11px] sm:text-xs ${empty ? 'text-gray-300' : 'text-gray-700'}`} data-testid={`pay-row-${b.key}`}>
                  <td className="px-3 sm:px-5 py-3 font-bold">
                    <span className="inline-flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg ${empty ? 'bg-gray-50 text-gray-300' : style.color}`}><Icon size={14} /></span>
                      <span className={`whitespace-nowrap ${empty ? '' : 'text-slate-800'}`}>{b.label}</span>
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-center font-black">{b.count > 0 ? b.count.toLocaleString('he-IL') : '-'}</td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="hidden sm:block flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${style.bar} rounded-full`} style={{ width: `${Math.min(100, b.pct)}%` }} />
                      </div>
                      <span className="font-bold w-12 text-center" dir="ltr">{b.pct.toLocaleString('he-IL', { maximumFractionDigits: 1 })}%</span>
                    </div>
                  </td>
                  <td className={`px-3 sm:px-5 py-3 text-left font-black ${empty ? '' : 'text-slate-900'}`} dir="ltr">{fmt(b.amount, 2)}</td>
                </tr>
              );
            })}
            <tr className="bg-blue-50/60 font-black text-slate-900 text-[11px] sm:text-sm border-t-2 border-blue-100" data-testid="pay-row-received">
              <td className="px-3 sm:px-5 py-4">סה"כ התקבל</td>
              <td className="px-2 sm:px-4 py-4 text-center">{transactions.toLocaleString('he-IL')}</td>
              <td className="px-2 sm:px-4 py-4 text-center">100%</td>
              <td className="px-3 sm:px-5 py-4 text-left text-blue-700" dir="ltr">{fmt(received, 2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Not-received / informational lines */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50/40 border-t border-gray-100">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3" data-testid="pay-open">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-800"><Clock size={14} />פתוח / לא שולם</div>
          <div className="text-lg font-black text-amber-900 mt-1" dir="ltr">{fmt(open.amount, 2)}</div>
          <div className="text-[10px] text-amber-700">{open.count} הזמנות · לא נספר כתקבול</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3" data-testid="pay-refunds">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-rose-800"><RotateCcw size={14} />החזרים</div>
          <div className="text-lg font-black text-rose-900 mt-1" dir="ltr">{fmt(refunds.amount, 2)}</div>
          <div className="text-[10px] text-rose-700 flex flex-wrap gap-x-1">
            <span>{refunds.count} הזמנות</span>
            {Object.keys(refunds.byMethod).length > 0 && (
              <>{Object.entries(refunds.byMethod).map(([k, v]) => (
                  <span key={k} className="whitespace-nowrap">· {METHOD_LABEL[k] || k} <span dir="ltr">{fmt(v)}</span></span>
                ))}</>
            )}
          </div>
          <div className="text-[10px] text-rose-600/80">כבר מקוזז מסכום ההזמנה</div>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3" data-testid="pay-oth">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-orange-800"><Star size={14} />על חשבון הבית (OTH)</div>
          <div className="text-lg font-black text-orange-900 mt-1" dir="ltr">{fmt(oth.value, 2)}</div>
          <div className="text-[10px] text-orange-700">{oth.count} הזמנות · שווי, ₪0 התקבל</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3" data-testid="pay-cancelled">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-700"><XCircle size={14} />בוטלו</div>
          <div className="text-lg font-black text-slate-800 mt-1">{cancelled.count}</div>
          <div className="text-[10px] text-slate-500">לא נכללות בפדיון</div>
        </div>
      </div>

      {/* Reconciliation */}
      <div className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-[11px] sm:text-xs font-bold border-t ${isReconciled ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`} data-testid="pay-reconcile">
        <span className="flex items-center gap-1.5">
          {isReconciled ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          <span className="flex flex-wrap items-center gap-x-1"><span className="whitespace-nowrap">התאמה: התקבל <span dir="ltr">{fmt(received, 2)}</span></span><span className="whitespace-nowrap">+ פתוח <span dir="ltr">{fmt(open.amount, 2)}</span></span><span className="whitespace-nowrap">= <span dir="ltr">{fmt(reconciledTotal, 2)}</span></span></span>
        </span>
        <span className="whitespace-nowrap">סה"כ פדיון בדוח: <span dir="ltr">{fmt(revenue, 2)}</span> {isReconciled ? '✓' : '(פער)'}</span>
      </div>
    </div>
  );
};

export default PaymentBreakdown;
