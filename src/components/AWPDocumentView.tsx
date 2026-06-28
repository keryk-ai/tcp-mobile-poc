'use client';

import Image from 'next/image';
import type { DemoSite } from '@/lib/demoData';

interface AWPDocumentViewProps {
  site: DemoSite;
  mode: 'estimate' | 'invoice';
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export default function AWPDocumentView({ site, mode }: AWPDocumentViewProps) {
  const docLabel = mode === 'invoice' ? 'INVOICE' : 'ESTIMATE';
  const idLabel = mode === 'invoice' ? 'Invoice ID' : 'Estimate ID';
  const dateLabel = mode === 'invoice' ? 'Invoice Date' : 'Estimate Date';
  const totalLabel = mode === 'invoice' ? 'INVOICE TOTAL' : 'ESTIMATE TOTAL';

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>AWP ${docLabel} ${site.documentId}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; color: #111; }
  h1 { font-size: 22px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #f0f0f0; text-align: left; padding: 4px 6px; font-size: 10px; border: 1px solid #ccc; }
  td { padding: 4px 6px; border-bottom: 1px solid #eee; }
  .right { text-align: right; }
  .total-row { font-weight: bold; font-size: 13px; }
</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;">
  <div><strong style="color:#e5520a;font-size:18px;">AWP</strong><br/><small>Safety</small></div>
  <div style="text-align:center;">
    <strong>AWP, Inc.</strong><br/>
    dba AWP Safety 2533 W Holly St.<br/>
    Phoenix, AZ 85009<br/>
    602-431-0911 · Fax 602-272-2827
  </div>
  <div style="text-align:right;">
    <h1>${docLabel}</h1>
    <table style="width:auto;margin:0;">
      <tr><th>${dateLabel}</th><th>${idLabel}</th></tr>
      <tr><td>${site.documentDate}</td><td>${site.documentId}</td></tr>
    </table>
    ${site.validThrough ? `<small>Valid Through: ${site.validThrough}</small>` : ''}
  </div>
</div>
<hr/>
<div style="display:flex;justify-content:space-between;">
  <div><strong>${site.customer}</strong></div>
  <div>
    <strong>Job Name:</strong> ${site.jobName}<br/>
    <strong>Job Location:</strong> ${site.address}, ${site.city}<br/>
    Estimated Days: ${site.estimatedDays}
  </div>
</div>
<table>
  <thead><tr>
    <th>Item Description</th><th class="right">Price</th><th>UOM</th>
    <th class="right">Qty/Day</th><th class="right">Days</th>
    <th class="right">Total Qty.</th><th class="right">Total</th>
  </tr></thead>
  <tbody>
    ${site.lineItems.map(i => `<tr>
      <td>${i.description}</td>
      <td class="right">${fmt(i.price)}</td>
      <td>${i.uom}</td>
      <td class="right">${i.qtyPerDay}</td>
      <td class="right">${i.days}</td>
      <td class="right">${i.totalQty}</td>
      <td class="right">${fmt(i.total)}</td>
    </tr>`).join('')}
  </tbody>
</table>
<p>${site.notes}</p>
<p>${site.planDescription}</p>
<div style="text-align:right;margin-top:12px;">
  <table style="width:auto;margin-left:auto;">
    <tr><td>EQUIPMENT</td><td class="right">${fmt(site.equipment)}</td></tr>
    <tr><td>ONE TIME CHARGES</td><td class="right">${fmt(site.oneTimeCharges)}</td></tr>
    <tr><td>LABOR</td><td class="right">${fmt(site.labor)}</td></tr>
    <tr><td>SUBTOTAL</td><td class="right">${fmt(site.subtotal)}</td></tr>
    <tr><td>SALES TAX (9.1%/6.3%)</td><td class="right">${fmt(site.salesTax)}</td></tr>
    <tr class="total-row"><td>${totalLabel}</td><td class="right">${fmt(site.total)}</td></tr>
  </table>
</div>
</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="bg-white">
      {/* Document header */}
      <div className="border border-gray-200 rounded-xl mx-4 mt-3 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-gray-200 gap-2">
          <div className="flex-shrink-0">
            <Image src="/awp-logo-horizontal.jpg" alt="AWP Safety" width={70} height={22} className="object-contain" />
            <div className="text-[9px] text-gray-400 mt-0.5">Safety</div>
          </div>
          <div className="text-center flex-1 text-[10px] text-gray-500 leading-snug">
            <div className="font-bold text-gray-800 text-xs">AWP, Inc.</div>
            <div>dba AWP Safety 2533 W Holly St.</div>
            <div>Phoenix, AZ 85009</div>
            <div>602-431-0911 · Fax 602-272-2827</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-gray-900 text-base">{docLabel}</div>
            <div className="mt-1 border border-gray-300 rounded text-[10px] overflow-hidden">
              <div className="flex">
                <div className="px-2 py-1 border-r border-gray-300 font-semibold bg-gray-50">{dateLabel}</div>
                <div className="px-2 py-1 font-semibold bg-gray-50">{idLabel}</div>
              </div>
              <div className="flex border-t border-gray-300">
                <div className="px-2 py-1 border-r border-gray-300">{site.documentDate}</div>
                <div className="px-2 py-1">{site.documentId}</div>
              </div>
            </div>
            {site.validThrough && (
              <div className="text-[9px] text-gray-400 mt-1">Valid Through: {site.validThrough}</div>
            )}
          </div>
        </div>

        {/* Customer + Job info */}
        <div className="flex gap-4 px-4 py-3 border-b border-gray-200 text-[11px]">
          <div className="flex-1">
            <div className="font-bold text-gray-900">{site.customer}</div>
          </div>
          <div className="flex-1 text-gray-700 space-y-0.5">
            <div><span className="font-semibold">Job Name:</span> {site.jobName}</div>
            <div><span className="font-semibold">Job Location:</span></div>
            <div>{site.address}, {site.city}</div>
            <div>Estimated Days: {site.estimatedDays}</div>
          </div>
        </div>

        {/* Line items — horizontally scrollable */}
        <div className="overflow-x-auto">
          <table className="text-[10px] w-full min-w-[560px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Item Description</th>
                <th className="text-right px-2 py-2 font-semibold text-gray-700">Price</th>
                <th className="px-2 py-2 font-semibold text-gray-700">UOM</th>
                <th className="text-right px-2 py-2 font-semibold text-gray-700">Qty/Day</th>
                <th className="text-right px-2 py-2 font-semibold text-gray-700">Days</th>
                <th className="text-right px-2 py-2 font-semibold text-gray-700">Total Qty.</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {site.lineItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="px-3 py-1.5 text-gray-800">{item.description}</td>
                  <td className="px-2 py-1.5 text-right text-gray-700">{fmt(item.price)}</td>
                  <td className="px-2 py-1.5 text-gray-500">{item.uom}</td>
                  <td className="px-2 py-1.5 text-right text-gray-700">{item.qtyPerDay}</td>
                  <td className="px-2 py-1.5 text-right text-gray-700">{item.days}</td>
                  <td className="px-2 py-1.5 text-right text-gray-700">{item.totalQty}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-gray-900">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes + Totals */}
        <div className="flex items-end justify-between px-4 py-3 gap-4 border-t border-gray-200">
          <div className="text-[10px] text-gray-500 flex-1">
            <div>{site.notes}</div>
            <div className="mt-1">{site.planDescription}</div>
          </div>
          <div className="text-[11px] space-y-0.5 text-right">
            <div className="flex justify-between gap-6"><span className="text-gray-500">EQUIPMENT</span><span>{fmt(site.equipment)}</span></div>
            <div className="flex justify-between gap-6"><span className="text-gray-500">ONE TIME CHARGES</span><span>{fmt(site.oneTimeCharges)}</span></div>
            <div className="flex justify-between gap-6"><span className="text-gray-500">LABOR</span><span>{fmt(site.labor)}</span></div>
            <div className="flex justify-between gap-6 border-t border-gray-200 pt-1"><span className="text-gray-500">SUBTOTAL</span><span>{fmt(site.subtotal)}</span></div>
            <div className="flex justify-between gap-6"><span className="text-gray-500">SALES TAX (9.1%/6.3%)</span><span>{fmt(site.salesTax)}</span></div>
            <div className="flex justify-between gap-6 border-t border-gray-800 pt-1 font-bold text-gray-900">
              <span>{totalLabel}</span><span>{fmt(site.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="px-4 py-3">
        <button
          onClick={handlePrint}
          className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold text-sm"
        >
          Download {mode === 'invoice' ? 'Invoice' : 'Estimate'} (.pdf)
        </button>
      </div>
    </div>
  );
}
