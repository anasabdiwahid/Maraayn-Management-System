import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../api/client.js';

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
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showWhatsAppGuide, setShowWhatsAppGuide] = useState(false);
  const [guideMessage, setGuideMessage] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currency = tenant?.currencySymbol || '$';
  const remainingDebt = receiptData.balanceRemaining ?? receiptData.balanceDue ?? 0;
  const isCredit = remainingDebt > 0;

  // Clean customer phone number
  const formatPhone = (phoneRaw?: string) => {
    let phone = (phoneRaw || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '252' + phone.substring(1);
    } else if (phone.length === 9) {
      phone = '252' + phone;
    }
    return phone;
  };

  const customerPhoneClean = formatPhone(receiptData.customerPhone);

  // Generate high-resolution Canvas from the receipt container
  const generateReceiptCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!receiptRef.current) return null;
    return await html2canvas(receiptRef.current, {
      scale: 3, // Ultra-sharp 3x Retina resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
  };

  // Convert canvas to Blob helper
  const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  };

  // 1. SHARE REAL RECEIPT IMAGE ON WHATSAPP
  const handleWhatsAppShareImage = async () => {
    setLoadingAction('whatsapp-image');
    try {
      const canvas = await generateReceiptCanvas();
      if (!canvas) throw new Error('Could not render receipt canvas');

      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('Could not convert receipt to image blob');

      const fileName = `Receipt-${receiptData.receiptNumber}.png`;
      const imageFile = new File([blob], fileName, { type: 'image/png' });

      // Check if browser supports Web Share API with image files (Mobile phones Android/iOS)
      if (
        navigator.canShare &&
        typeof navigator.share === 'function' &&
        navigator.canShare({ files: [imageFile] })
      ) {
        try {
          await navigator.share({
            files: [imageFile],
            title: `${tenant?.name || 'Maraayn'} Receipt #${receiptData.receiptNumber}`,
            text: `Receipt #${receiptData.receiptNumber} - ${tenant?.name || 'Maraayn Business'}`,
          });
          setLoadingAction(null);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            // User cancelled share sheet
            setLoadingAction(null);
            return;
          }
        }
      }

      // Desktop / Web Fallback:
      // A) Copy image to system clipboard so user can press Ctrl+V in WhatsApp Web
      let clipSuccess = false;
      try {
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          clipSuccess = true;
        }
      } catch (err) {
        console.warn('Clipboard writeImage not supported or denied:', err);
      }

      // B) Trigger automatic download of image file so user has it on disk
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // C) Open WhatsApp Web
      const waUrl = customerPhoneClean
        ? `https://wa.me/${customerPhoneClean}`
        : `https://web.whatsapp.com/`;

      setGuideMessage(
        clipSuccess
          ? 'Sawirka recite-ka waa la koobiyeeyay (Ctrl+V) waana la soo degsaday! WhatsApp markuu furmo, kaliya taabo Ctrl+V si aad sawirka ugu dirto macmiilka.'
          : 'Sawirka recite-ka waa la soo degsaday! WhatsApp markuu furmo, u jiid (drag) ama u dir sawirka macmiilka.'
      );
      setShowWhatsAppGuide(true);

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 500);
    } catch (err) {
      console.error('Failed to share receipt image:', err);
      alert('Khalad ayaa dhacay markii sawirka la diyaarinayay.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. SHARE RECEIPT AS DOCUMENT (PDF) ON WHATSAPP
  const handleWhatsAppShareDocument = async () => {
    setLoadingAction('whatsapp-pdf');
    try {
      const canvas = await generateReceiptCanvas();
      if (!canvas) throw new Error('Could not render receipt canvas');

      const imgData = canvas.toDataURL('image/png');
      const mmWidth = 80; // 80mm thermal receipt standard
      const mmHeight = (canvas.height / canvas.width) * mmWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight);

      const pdfBlob = pdf.output('blob');
      const fileName = `Receipt-${receiptData.receiptNumber}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Check if browser supports Web Share API with PDF documents
      if (
        navigator.canShare &&
        typeof navigator.share === 'function' &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Receipt #${receiptData.receiptNumber}`,
          });
          setLoadingAction(null);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setLoadingAction(null);
            return;
          }
        }
      }

      // Desktop: Save PDF and open WhatsApp Web
      pdf.save(fileName);
      setGuideMessage(
        'Document-ka PDF ee recite-ka waa la soo degsaday! WhatsApp-ka markuu furmo, u dir macmiilka faylka PDF-ka ah.'
      );
      setShowWhatsAppGuide(true);

      const waUrl = customerPhoneClean
        ? `https://wa.me/${customerPhoneClean}`
        : `https://web.whatsapp.com/`;

      setTimeout(() => {
        window.open(waUrl, '_blank');
      }, 500);
    } catch (err) {
      console.error('Failed to share PDF receipt:', err);
      alert('Khalad ayaa dhacay markii document-ka PDF la diyaarinayay.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. DIRECT DOWNLOAD IMAGE (PNG)
  const handleDownloadImage = async () => {
    setLoadingAction('download-image');
    try {
      const canvas = await generateReceiptCanvas();
      if (!canvas) return;

      const blob = await canvasToBlob(canvas);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt-${receiptData.receiptNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading image:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. DIRECT DOWNLOAD PDF DOCUMENT
  const handleDownloadPdf = async () => {
    setLoadingAction('download-pdf');
    try {
      // First try authenticated backend endpoint
      try {
        const res = await api.get(`/receipts/${receiptData.receiptNumber}/pdf`, {
          responseType: 'blob',
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${receiptData.receiptNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      } catch (backendErr) {
        console.warn('Backend PDF endpoint unavailable, generating via jsPDF:', backendErr);
      }

      // Fallback: Client-side jsPDF generation
      const canvas = await generateReceiptCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const mmWidth = 80;
      const mmHeight = (canvas.height / canvas.width) * mmWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight);
      pdf.save(`Receipt-${receiptData.receiptNumber}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. PRINT RECEIPT
  const handlePrint = () => {
    window.print();
  };

  // 6. COPY TEXT SUMMARY
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

  // WhatsApp plain text url (Optional fallback)
  const getWhatsAppTextUrl = () => {
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

    return customerPhoneClean
      ? `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-extrabold text-slate-800 text-sm">Receipt Preview</h3>
            <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
              #{receiptData.receiptNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            title="Xir (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop WhatsApp Instruction Toast */}
        {showWhatsAppGuide && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-4 flex items-start space-x-3 text-xs text-emerald-900 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block text-emerald-950">
                WhatsApp Diyaar Ah!
              </strong>
              <p className="mt-0.5 leading-relaxed">{guideMessage}</p>
            </div>
            <button
              onClick={() => setShowWhatsAppGuide(false)}
              className="text-emerald-700 hover:text-emerald-950 p-1 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Receipt Printable Container */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="w-full max-w-[320px] bg-white p-6 shadow-md rounded-lg font-mono text-xs text-slate-800 border border-slate-200 select-none"
          >
            {/* Business Logo & Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <img
                src={tenant?.logoUrl || '/logo.png'}
                alt="Logo"
                crossOrigin="anonymous"
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
              <p className="text-[10px] text-brand-amber font-semibold mt-1">
                Your Business, In One Place
              </p>
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
                <span className="font-semibold text-slate-900">
                  {receiptData.customerName || 'Walk-in Customer'}
                </span>
              </div>
              {receiptData.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono">{receiptData.customerPhone}</span>
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
                        <span className="font-semibold">
                          {currency}
                          {item.total ?? item.unitPrice}
                        </span>
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
                <span className="font-bold text-slate-900 text-xs">
                  {currency}
                  {receiptData.grandTotal}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-600">
                  {currency}
                  {receiptData.amountPaid}
                </span>
              </div>

              {isCredit && (
                <div className="flex justify-between py-1 px-2 bg-rose-50 rounded border border-rose-200 text-rose-700 font-bold">
                  <span>Remaining Debt:</span>
                  <span>
                    {currency}
                    {remainingDebt}
                  </span>
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

        {/* Action Controls Section */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {/* PRIMARY WHATSAPP ACTIONS (SAWIR & DOCUMENT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* WhatsApp Share Real Image (Sawirka Dhabta Ah) */}
            <button
              type="button"
              onClick={handleWhatsAppShareImage}
              disabled={loadingAction !== null}
              className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
              title="U dir macmiilka sawirka recite-ka oo dhammaystiran"
            >
              {loadingAction === 'whatsapp-image' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Diyaarinta Sawirka...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>WhatsApp Sawir (Image)</span>
                </>
              )}
            </button>

            {/* WhatsApp Share Document (PDF) */}
            <button
              type="button"
              onClick={handleWhatsAppShareDocument}
              disabled={loadingAction !== null}
              className="flex items-center justify-center space-x-2 bg-[#128C7E] hover:bg-[#0c6b60] active:scale-[0.98] text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
              title="U dir macmiilka recite-ka oo Document / PDF ah"
            >
              {loadingAction === 'whatsapp-pdf' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Diyaarinta PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>WhatsApp Document (PDF)</span>
                </>
              )}
            </button>
          </div>

          {/* SECONDARY ACTIONS ROW (PRINT, DOWNLOADS, COPY, TEXT) */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 min-w-[90px] flex items-center justify-center space-x-1.5 bg-brand-navy hover:bg-brand-navy-light text-white font-semibold py-2 px-3 rounded-lg text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Download Image (PNG) */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={loadingAction !== null}
              className="flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-2.5 rounded-lg text-xs font-medium transition-colors"
              title="Degso Sawirka Recite-ka (PNG)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>PNG</span>
            </button>

            {/* Download Document (PDF) */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loadingAction !== null}
              className="flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-2.5 rounded-lg text-xs font-medium transition-colors"
              title="Degso Faylka PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF</span>
            </button>

            {/* Copy Plain Text */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs transition-colors"
              title="Koobiyeey Fariin Qoraal Ah"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Quick Text WhatsApp Link (Fallback) */}
            <a
              href={getWhatsAppTextUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-emerald-600 rounded-lg text-xs transition-colors"
              title="Keliya Fariin Qoraal ah (Plain Text WhatsApp)"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};