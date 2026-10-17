import React, { useRef, useState } from 'react';
import { X, Printer, Download, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    receiptNumber: string;
    receiptType?: string;
    customerName?: string;
    customerPhone?: string;
    items?: Array<{
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      total?: number;
    }>;
    subtotal?: number;
    totalDiscount?: number;
    grandTotal: number;
    amountPaid: number;
    balanceRemaining?: number;
    balanceDue?: number;
    paymentMethod?: string;
    notes?: string;
    createdAt?: string;
  };
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
  const { tenant } = useAuth();
  const [copied, setCopied] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currency = tenant?.currencySymbol || '$';
  const remainingDebt = receiptData.balanceRemaining ?? receiptData.balanceDue ?? 0;
  const isCredit = remainingDebt > 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    let text = `${tenant?.name || 'Maraayn Business'} - RECEIPT #${receiptData.receiptNumber}\n`;
    text += `Date: ${new Date(receiptData.createdAt || Date.now()).toLocaleDateString()}\n`;
    text += `Customer: ${receiptData.customerName || 'Customer'}\n`;
    text += `--------------------------------\n`;
    receiptData.items?.forEach((i) => {
      text += `${i.productName} (x${i.quantity || 1}) - ${currency}${i.total || i.unitPrice}\n`;
    });
    text += `--------------------------------\n`;
    text += `Total: ${currency}${receiptData.grandTotal}\n`;
    text += `Paid: ${currency}${receiptData.amountPaid}\n`;
    if (remainingDebt > 0) {
      text += `Remaining Debt: ${currency}${remainingDebt}\n`;
    }
    text += `Maraayn - Your Business, In One Place`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppLink = () => {
    let phone = (receiptData.customerPhone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '252' + phone.substring(1);
    } else if (phone.length === 9) {
      phone = '252' + phone;
    }

    let text = `*${(tenant?.name || 'Maraayn Business').toUpperCase()} — RECEIPT*\n`;
    text += `Receipt Number: *${receiptData.receiptNumber}*\n`;
    text += `Date: ${new Date(receiptData.createdAt || Date.now()).toLocaleDateString()}\n`;
    text += `Customer: *${receiptData.customerName || 'Customer'}*\n`;
    text += `--------------------------------\n`;
    receiptData.items?.forEach((item) => {
      text += `• ${item.productName} (x${item.quantity || 1}) — ${currency}${item.total || item.unitPrice}\n`;
    });
    text += `--------------------------------\n`;
    text += `Grand Total: *${currency}${receiptData.grandTotal}*\n`;
    text += `Amount Paid: *${currency}${receiptData.amountPaid}*\n`;
    if (remainingDebt > 0) {
      text += `Remaining Debt: *${currency}${remainingDebt}*\n`;
    }
    text += `Payment Method: ${receiptData.paymentMethod || 'CASH'}\n\n`;
    text += `${tenant?.receiptSettings?.footerMessage || 'Thank you for your business!'}\n`;
    text += `Maraayn — Your Business, In One Place`;

    return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const handleDownloadPdf = () => {
    window.open(`http://localhost:4000/api/v1/receipts/${receiptData.receiptNumber}/pdf`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="font-bold text-slate-800 text-sm">Receipt Preview</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Printable Container */}
        <div className="overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="w-full max-w-[320px] bg-white p-6 shadow-md rounded-lg font-mono text-xs text-slate-800 border border-slate-200"
          >
            {/* Business Logo & Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <img
                src={tenant?.logoUrl || '/logo.png'}
                alt="Logo"
                className="h-10 mx-auto object-contain mb-2"
                onError={(e) => {
                  (e.target as any).src = '/logo.png';
                }}
              />
              <h2 className="text-base font-extrabold uppercase text-slate-900 tracking-tight">
                {tenant?.name || 'Maraayn Business'}
              </h2>
              {tenant?.location && <p className="text-[11px] text-slate-600">{tenant.location}</p>}
              {tenant?.ownerPhone && <p className="text-[11px] text-slate-600">Tel: {tenant.ownerPhone}</p>}
              <p className="text-[10px] text-brand-amber font-semibold mt-1">Your Business, In One Place</p>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt No:</span>
                <span className="font-bold text-slate-900">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(receiptData.createdAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-900">{receiptData.customerName || 'Walk-in Customer'}</span>
              </div>
              {receiptData.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span>{receiptData.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[11px] font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                <span>Item</span>
                <div className="space-x-4">
                  <span>Qty</span>
                  <span>Total</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 py-1">
                {receiptData.items && receiptData.items.length > 0 ? (
                  receiptData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-[11px]">
                      <span className="truncate max-w-[150px] font-medium">{item.productName}</span>
                      <div className="space-x-4 text-right">
                        <span className="text-slate-500">x{item.quantity || 1}</span>
                        <span className="font-semibold">{currency}{item.total ?? item.unitPrice}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-1 text-center text-slate-400">Standard Transaction</div>
                )}
              </div>
            </div>

            {/* Calculations & Debt */}
            <div className="py-2.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Grand Total:</span>
                <span className="font-bold text-slate-900 text-xs">{currency}{receiptData.grandTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-600">{currency}{receiptData.amountPaid}</span>
              </div>

              {isCredit && (
                <div className="flex justify-between py-1 px-2 bg-rose-50 rounded border border-rose-200 text-rose-700 font-bold">
                  <span>Remaining Debt:</span>
                  <span>{currency}{remainingDebt}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                <span>Payment Method:</span>
                <span className="uppercase font-semibold">{receiptData.paymentMethod || 'CASH'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">
                {tenant?.receiptSettings?.footerMessage || 'Thank you for your business!'}
              </p>
              <p className="text-[9px] text-slate-400">Powered by Maraayn Management System</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 bg-brand-navy hover:bg-brand-navy-light text-white font-medium py-2 px-3 rounded-lg text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Share</span>
          </a>

          <button
            onClick={handleDownloadPdf}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleCopy}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs transition-colors"
            title="Copy Text"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

