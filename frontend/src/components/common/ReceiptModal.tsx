import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  FileText,
  Loader2,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext.js';
import { resolveApiAssetUrl } from '../../api/client.js';

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
    isCancelled?: boolean;
  };
}

// Somali amount-in-words text for the voucher receipt.
const numberToWords = (num: number, currencyName: string = 'Dollar'): string => {
  if (!Number.isFinite(num) || num < 0) return '';

  const small = [
    'eber', 'kow', 'laba', 'saddex', 'afar', 'shan', 'lix', 'toddoba', 'siddeed', 'sagaal',
    'toban', 'kow iyo toban', 'laba iyo toban', 'saddex iyo toban', 'afar iyo toban',
    'shan iyo toban', 'lix iyo toban', 'toddoba iyo toban', 'siddeed iyo toban', 'sagaal iyo toban',
  ];
  const tens = ['', '', 'labaatan', 'soddon', 'afartan', 'konton', 'lixdan', 'toddobaatan', 'siddeetan', 'sagaashan'];

  const underThousand = (value: number): string => {
    if (value < 20) return small[value];
    if (value < 100) {
      const remainder = value % 10;
      return `${tens[Math.floor(value / 10)]}${remainder ? ` iyo ${small[remainder]}` : ''}`;
    }
    const hundreds = Math.floor(value / 100);
    const remainder = value % 100;
    const prefix = hundreds === 1 ? 'boqol' : `${small[hundreds]} boqol`;
    return `${prefix}${remainder ? ` iyo ${underThousand(remainder)}` : ''}`;
  };

  const wholeNumber = (value: number): string => {
    if (value < 1000) return underThousand(value);
    if (value < 1_000_000) {
      const thousands = Math.floor(value / 1000);
      const remainder = value % 1000;
      return `${thousands === 1 ? 'kun' : `${wholeNumber(thousands)} kun`}${remainder ? ` iyo ${wholeNumber(remainder)}` : ''}`;
    }
    const millions = Math.floor(value / 1_000_000);
    const remainder = value % 1_000_000;
    return `${wholeNumber(millions)} milyan${remainder ? ` iyo ${wholeNumber(remainder)}` : ''}`;
  };

  const totalCents = Math.round(num * 100);
  const integerPart = Math.floor(totalCents / 100);
  const centsPart = totalCents % 100;
  const currency = currencyName === 'Dollar' ? 'doollar' : 'shilin';
  const wholeText = wholeNumber(integerPart);
  const centsText = centsPart ? ` iyo ${wholeNumber(centsPart)} senti` : '';
  const result = `${wholeText} ${currency}${centsText}`;
  return result.charAt(0).toLocaleUpperCase() + result.slice(1);
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptData }) => {
  const { tenant } = useAuth();
  const [viewMode, setViewMode] = useState<'voucher' | 'thermal'>('voucher');
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showWhatsAppGuide, setShowWhatsAppGuide] = useState(false);
  const [guideMessage, setGuideMessage] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currency = tenant?.currencySymbol || '$';
  const remainingDebt = receiptData.balanceRemaining ?? receiptData.balanceDue ?? 0;
  const isCredit = remainingDebt > 0;
  const isVoided = !!(receiptData.isCancelled || (receiptData.notes && receiptData.notes.includes('CANCELLED')));

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
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1000,
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
          });
          setLoadingAction(null);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setLoadingAction(null);
            return;
          }
          console.warn('Web Share API aborted or failed, switching to desktop flow:', shareErr);
        }
      }

      // Desktop or fallback flow:
      try {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
      } catch (clipboardErr) {
        console.warn('Clipboard image write failed:', clipboardErr);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);

      const waUrl = customerPhoneClean
        ? `https://web.whatsapp.com/send?phone=${customerPhoneClean}`
        : `https://web.whatsapp.com/`;

      window.open(waUrl, '_blank');

      setGuideMessage(
        'Sawirka recite-ka waa la soo dejiyey oo Clipboard-ka ayaa lagu koobiyeeyay! WhatsApp Web ayaa furmay — kaliya riix Paste (Ctrl + V) si aad macmiilka ugu dirto.'
      );
      setShowWhatsAppGuide(true);
    } catch (err) {
      console.error('Error sharing receipt image:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. SHARE DOCUMENT (PDF) ON WHATSAPP
  const handleWhatsAppShareDocument = async () => {
    setLoadingAction('whatsapp-pdf');
    try {
      const canvas = await generateReceiptCanvas();
      if (!canvas) throw new Error('Could not render receipt canvas');

      const imgData = canvas.toDataURL('image/png');
      const isVoucher = viewMode === 'voucher';
      const mmWidth = isVoucher ? 210 : 80;
      const mmHeight = (canvas.height / canvas.width) * mmWidth;

      const pdf = new jsPDF({
        orientation: isVoucher ? 'landscape' : 'portrait',
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
            title: `${tenant?.name || 'Maraayn'} Receipt #${receiptData.receiptNumber}`,
          });
          setLoadingAction(null);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setLoadingAction(null);
            return;
          }
          console.warn('Web Share PDF failed, switching to desktop flow:', shareErr);
        }
      }

      pdf.save(fileName);

      const waUrl = customerPhoneClean
        ? `https://web.whatsapp.com/send?phone=${customerPhoneClean}`
        : `https://web.whatsapp.com/`;

      window.open(waUrl, '_blank');

      setGuideMessage(
        'Document-ka PDF ee recite-ka waa la soo dejiyey! WhatsApp Web ayaa furmay — kaliya lifaaq (Attach Document) oo u dir macmiilka.'
      );
      setShowWhatsAppGuide(true);
    } catch (err) {
      console.error('Error sharing receipt document:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. DOWNLOAD IMAGE (PNG)
  const handleDownloadImage = async () => {
    setLoadingAction('download-image');
    try {
      const canvas = await generateReceiptCanvas();
      if (!canvas) return;

      const link = document.createElement('a');
      link.download = `Receipt-${receiptData.receiptNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error downloading image:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. DOWNLOAD PDF
  const handleDownloadPdf = async () => {
    setLoadingAction('download-pdf');
    try {
      const canvas = await generateReceiptCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const isVoucher = viewMode === 'voucher';
      const mmWidth = isVoucher ? 210 : 80;
      const mmHeight = (canvas.height / canvas.width) * mmWidth;

      const pdf = new jsPDF({
        orientation: isVoucher ? 'landscape' : 'portrait',
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

  // Items string for the "For" row of the voucher
  const itemsDescription =
    receiptData.items && receiptData.items.length > 0
      ? receiptData.items.map((i) => `${i.productName || 'Item'} (x${i.quantity || 1})`).join(', ')
      : receiptData.notes || 'Goods & Services Transaction';

  const amountInWords = numberToWords(receiptData.grandTotal, currency === '$' ? 'Dollar' : 'Shilling');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl sm:max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[96vh] animate-scaleUp">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-black text-slate-800 text-sm hidden sm:inline">Receipt Voucher</h3>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/90 px-2.5 py-0.5 rounded">
              #{receiptData.receiptNumber}
            </span>
          </div>

          {/* Toggle Voucher vs Thermal View */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('voucher')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'voucher'
                  ? 'bg-[#0f233a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Money Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('thermal')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'thermal'
                  ? 'bg-[#0f233a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal (80mm)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Xir (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop WhatsApp Instruction Toast */}
        {showWhatsAppGuide && (
          <div className="bg-emerald-50 border-b border-emerald-200 py-2 px-4 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn shrink-0">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="leading-snug">{guideMessage}</span>
            </div>
            <button
              onClick={() => setShowWhatsAppGuide(false)}
              className="text-emerald-700 hover:text-emerald-950 px-2 py-0.5 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Printable Receipt Container Scroll View (items-start avoids flexbox clipping at top/bottom) */}
        <div className="overflow-y-auto p-3 sm:p-5 bg-slate-100 flex justify-center items-start flex-1 min-h-0">
          {viewMode === 'voucher' ? (
            /* ============================================================ */
            /* 1. MONEY RECEIPT VOUCHER (Exact Proportions, Fully Visible)   */
            /* ============================================================ */
            <div
              id="printable-receipt"
              ref={receiptRef}
              className="w-full max-w-[640px] bg-white rounded-xl shadow-md border border-slate-300 relative select-none font-sans text-slate-900 overflow-hidden my-auto"
            >
              {/* Voided Stamp Overlay */}
              {isVoided && (
                <div className="absolute top-10 right-10 z-20 pointer-events-none">
                  <span className="inline-block px-4 py-1.5 bg-rose-50 border-2 border-rose-600 text-rose-700 font-black text-xs uppercase tracking-widest rounded-lg rotate-[-10deg] shadow-lg">
                    ⚠ KANSAL (VOIDED)
                  </span>
                </div>
              )}

              {/* Top Geometric Ribbon (Deep Navy & Golden Amber) */}
              <div className="relative h-6 w-full bg-amber-500 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full w-52 bg-[#0f233a]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)' }}
                />
              </div>

              {/* Header Content Row */}
              <div className="px-6 pt-3 pb-2 flex items-center justify-between gap-2">
                {/* Left: Brand Logo & System Info */}
                <div className="flex items-center space-x-2.5 max-w-[190px]">
                  <img
                    src={resolveApiAssetUrl(tenant?.logoUrl)}
                    alt="Logo"
                    crossOrigin="anonymous"
                    className="h-8 object-contain shrink-0"
                    onError={(e) => {
                      (e.target as any).src = '/logo.png';
                    }}
                  />
                  <div className="min-w-0">
                    <span className="font-black text-xs text-[#0f233a] uppercase tracking-wider block leading-tight">
                      {tenant?.name || 'Dukaanka'}
                    </span>
                  </div>
                </div>

                {/* Cinwaanka rasiidka */}
                <div className="text-center shrink-0">
                  <h1 className="font-black text-lg sm:text-xl text-[#0f233a] tracking-wider uppercase leading-tight">
                    RASIIDKA LACAGTA
                  </h1>
                  <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-600 font-bold mt-0.5">
                    {tenant?.ownerPhone && <span>📞 {tenant.ownerPhone}</span>}
                    {(tenant?.ownerEmail || (tenant as any)?.email) && (
                      <span>✉ {tenant?.ownerEmail || (tenant as any)?.email}</span>
                    )}
                  </div>
                </div>

                {/* Right: Business Name & Address */}
                <div className="text-right max-w-[190px]">
                  <h3 className="font-black text-xs sm:text-sm text-[#0f233a] uppercase leading-tight truncate">
                    {tenant?.name || 'Maraayn Business'}
                  </h3>
                  <p className="text-[10px] text-slate-600 font-semibold leading-normal mt-0.5 truncate">
                    {tenant?.location || 'Mogadishu'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono font-bold leading-normal">
                    Rasiid #{receiptData.receiptNumber}
                  </p>
                </div>
              </div>

              {/* Bold Golden Amber Divider Line */}
              <div className="h-1 bg-amber-500 w-full" />

              {/* Sub-header Meta Line (NO. & Date) */}
              <div className="flex items-center justify-between px-6 py-1.5 text-xs font-bold text-[#0f233a] bg-slate-50/70 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-slate-900 pb-1">Lr.</span>
                  <span className="font-mono font-bold text-[#0f233a] border-b border-dotted border-slate-400 px-2 pb-1 min-w-[120px]">
                    {receiptData.receiptNumber}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-slate-900 pb-1">Taariikh</span>
                  <span className="font-medium text-slate-800 border-b border-dotted border-slate-400 px-2 pb-1 min-w-[140px] text-center">
                    {new Date(receiptData.createdAt || Date.now()).toLocaleString('so-SO')}
                  </span>
                </div>
              </div>

              {/* Voucher Form Rows */}
              <div className="px-6 py-3.5 space-y-2.5 text-xs text-slate-900">
                {/* Row 1: Received with thanks from */}
                <div className="flex items-end space-x-2 min-h-[28px]">
                  <span className="font-black text-slate-800 shrink-0 pb-1.5">
                    Waxaa lacagta laga qabtay
                  </span>
                  <div className="flex-1 min-h-[26px] border-b border-dotted border-slate-400 pb-1.5 leading-normal font-black text-slate-950 px-2 truncate bg-white">
                    {receiptData.customerName || 'Macmiil toos ah'}
                    {receiptData.customerPhone ? ` (${receiptData.customerPhone})` : ''}
                  </div>
                </div>

                {/* Row 2: Amount in numbers */}
                <div className="flex items-end space-x-2 min-h-[28px]">
                  <span className="font-black text-slate-800 shrink-0 pb-1.5">Qaddarka</span>
                  <div className="flex-1 min-h-[26px] border-b border-dotted border-slate-400 pb-1.5 leading-normal font-mono font-black text-emerald-700 text-sm px-2 bg-white">
                    {currency}
                    {receiptData.grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* Row 3: Amount written in words */}
                <div className="flex items-end space-x-2 min-h-[28px]">
                  <span className="shrink-0 pb-1.5 font-black text-slate-800">Qaddarka lacagta oo qoraal ah</span>
                  <div className="flex-1 min-h-[26px] border-b border-dotted border-slate-400 pb-1.5 leading-normal italic font-bold text-slate-800 px-2 truncate bg-white">
                    ({amountInWords})
                  </div>
                </div>

                {/* Row 4: For & Branch */}
                <div className="flex items-end space-x-3 min-h-[28px]">
                  <div className="flex-1 flex items-end space-x-2 min-w-0">
                    <span className="font-black text-slate-800 shrink-0 pb-1.5">Alaabta</span>
                    <div className="flex-1 min-h-[26px] border-b border-dotted border-slate-400 pb-1.5 leading-normal font-bold text-slate-900 px-2 truncate bg-white">
                      {itemsDescription}
                    </div>
                  </div>
                  <div className="w-1/3 flex items-end space-x-2 min-w-0">
                    <span className="font-black text-slate-800 shrink-0 pb-1.5">Laanta</span>
                    <div className="flex-1 min-h-[26px] border-b border-dotted border-slate-400 pb-1.5 leading-normal font-bold text-slate-800 px-2 truncate bg-white">
                      {tenant?.location || 'Laanta guud'}
                    </div>
                  </div>
                </div>

                {/* Row 5: ACCT, PAID, DUE */}
              <div className="flex items-end justify-between pt-1 text-slate-800 min-h-[30px]">
                  <div className="flex items-end space-x-1.5 flex-1 min-w-0">
                    <span className="font-black shrink-0 pb-1.5">Habka</span>
                    <span className="inline-flex min-h-[26px] items-end border-b border-dotted border-slate-400 px-2 pb-1 font-bold text-slate-900 bg-white">
                      {receiptData.paymentMethod === 'MOBILE_MONEY' ? 'Lacagta telefoonka'
                        : receiptData.paymentMethod === 'BANK_TRANSFER' ? 'Wareejin bangi'
                          : receiptData.paymentMethod === 'CASH' ? 'Caddaan' : 'Hab kale'}
                    </span>
                  </div>
                  <div className="flex items-end space-x-1.5 flex-1 justify-center min-w-0">
                    <span className="font-black shrink-0 pb-1.5">La bixiyay</span>
                    <span className="inline-flex min-h-[26px] items-end border-b border-dotted border-slate-400 px-2 pb-1 font-bold text-emerald-700 bg-white">
                      {currency}
                      {receiptData.amountPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-end space-x-1.5 flex-1 justify-end min-w-0">
                    <span className="font-black shrink-0 pb-1.5">Hadhay</span>
                    <span
                      className={`inline-flex min-h-[26px] items-end border-b border-dotted border-slate-400 px-2 pb-1 font-bold bg-white ${
                        remainingDebt > 0 ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {currency}
                      {remainingDebt.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voucher Signatures & Amount Box Footer */}
              <div className="px-6 pb-4 pt-1 flex items-end justify-between gap-3">
                {/* Left: Boxed Amount */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="font-black text-xs text-slate-900">Lacagta</span>
                  <div className="border-2 border-slate-800 bg-slate-50 px-3.5 py-1 rounded font-mono font-black text-base text-slate-950 shadow-xs">
                    {currency}
                    {receiptData.grandTotal.toFixed(2)}
                  </div>
                </div>

                {/* Center: Received by */}
                <div className="text-center w-32 shrink-0">
                  <div className="border-b border-dotted border-slate-400 h-6 flex items-end justify-center pb-0.5 font-bold text-[11px] text-slate-800 truncate">
                    {tenant?.name || 'Maraayn'}
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mt-1">
                    Lacagta qabtay
                  </span>
                </div>

                {/* Right: Authorized Signature */}
                <div className="text-center w-36 shrink-0">
                  <div className="border-b border-dotted border-slate-400 h-6 flex items-end justify-center pb-0.5 font-mono font-bold text-[11px] text-slate-500 italic">
                    Saxiixa
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mt-1">
                    Saxiixa masuulka
                  </span>
                </div>
              </div>

              {/* System branding and developer credit */}
              <div className="flex flex-col items-center justify-center pb-2 text-center">
                <div className="flex items-center gap-1.5">
                  <img
                    src="/logo.png"
                    alt="Logo-ga Maraayn"
                    crossOrigin="anonymous"
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <span className="text-[9px] font-bold tracking-wide text-slate-600">
                    Maraayn Management Business
                  </span>
                </div>
                <span className="mt-0.5 text-[7px] text-slate-400">Developer By Anas Abdiwahid</span>
              </div>

              {/* Bottom Decorative Geometric Ribbons */}
              <div className="relative h-3.5 w-full bg-slate-50 overflow-hidden">
                <div className="absolute bottom-0 left-0 h-2 w-1/3 bg-amber-500" />
                <div
                  className="absolute bottom-0 right-0 h-4.5 w-44 bg-amber-500"
                  style={{ clipPath: 'polygon(15% 100%, 0% 0%, 100% 0%, 100% 100%)' }}
                />
                <div
                  className="absolute bottom-0 right-0 h-4.5 w-32 bg-[#0f233a]"
                  style={{ clipPath: 'polygon(20% 100%, 0% 0%, 100% 0%, 100% 100%)' }}
                />
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 2. CLASSIC THERMAL SLIP (80mm) */
            /* ============================================================ */
            <div
              id="printable-receipt"
              ref={receiptRef}
              className="w-full max-w-[320px] bg-white p-6 shadow-md rounded-lg font-mono text-xs text-slate-800 border border-slate-200 select-none my-auto"
            >
              {/* Business Logo & Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                {isVoided && (
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 bg-rose-100 border-2 border-rose-500 text-rose-700 font-black text-[11px] uppercase tracking-wider rounded-md rotate-[-2deg] shadow-xs">
                      ⚠ KANSAL (VOIDED)
                    </span>
                  </div>
                )}
                <img
                  src={resolveApiAssetUrl(tenant?.logoUrl)}
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
              </div>

              {/* Receipt Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rasiid Lr:</span>
                  <span className="font-bold text-slate-900">{receiptData.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Taariikh:</span>
                  <span>{new Date(receiptData.createdAt || Date.now()).toLocaleString('so-SO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Macmiil:</span>
                  <span className="font-semibold text-slate-900">
                    {receiptData.customerName || 'Macmiil toos ah'}
                  </span>
                </div>
                {receiptData.customerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Telefoon:</span>
                    <span className="font-mono">{receiptData.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[11px] font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                  <span>Alaab</span>
                  <div className="space-x-4">
                    <span>Tiro</span>
                    <span>Wadarta</span>
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
                    <div className="py-1 text-center text-slate-400">Iibka caadiga ah</div>
                  )}
                </div>
              </div>

              {/* Calculations & Debt */}
              <div className="py-2.5 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Wadarta guud:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {currency}
                    {receiptData.grandTotal}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Lacagta la bixiyay:</span>
                  <span className="font-bold text-emerald-600">
                    {currency}
                    {receiptData.amountPaid}
                  </span>
                </div>

                {isCredit && (
                  <div className="flex justify-between py-1 px-2 bg-rose-50 rounded border border-rose-200 text-rose-700 font-bold">
                    <span>Daynta hadhay:</span>
                    <span>
                      {currency}
                      {remainingDebt}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                  <span>Habka lacag-bixinta:</span>
                  <span className="uppercase font-semibold">{receiptData.paymentMethod || 'CASH'}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">
                  {tenant?.receiptSettings?.footerMessage || 'Waad ku mahadsan tahay, macaamiil, iibsigaaga.'}
                </p>
                <div className="flex flex-col items-center pt-1">
                  <div className="flex items-center gap-1">
                    <img
                      src="/logo.png"
                      alt="Logo-ga Maraayn"
                      crossOrigin="anonymous"
                      className="h-4 w-4 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                    <span className="text-[9px] font-semibold text-slate-500">Maraayn Management Business</span>
                  </div>
                  <span className="text-[8px] text-slate-400">Developer By Anas Abdiwahid</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls Section */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex flex-col gap-2 shrink-0">
          {/* PRIMARY WHATSAPP ACTIONS (SAWIR & DOCUMENT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* WhatsApp Share Real Image (Sawirka Dhabta Ah) */}
            <button
              type="button"
              onClick={handleWhatsAppShareImage}
              disabled={loadingAction !== null}
              className="flex items-center justify-center space-x-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
              className="flex items-center justify-center space-x-2 bg-[#128C7E] hover:bg-[#0c6b60] active:scale-[0.98] text-white font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
              className="flex-1 min-w-[85px] flex items-center justify-center space-x-1.5 bg-[#0f233a] hover:bg-[#1a3a60] text-white font-bold py-2 px-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Download Image (PNG) */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={loadingAction !== null}
              className="flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
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
              className="flex items-center space-x-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="Degso Faylka PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF</span>
            </button>

            {/* Copy Plain Text */}
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
              title="Koobiyeey Fariin Qoraal Ah"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Share the receipt image instead of opening a plain-text WhatsApp message */}
            <button
              type="button"
              onClick={handleWhatsAppShareImage}
              disabled={loadingAction !== null}
              className="p-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs transition-colors disabled:opacity-50"
              title="U dir sawirka rasiidka WhatsApp"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
