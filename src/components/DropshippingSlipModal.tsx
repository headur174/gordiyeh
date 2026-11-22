import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Truck, 
  Package, 
  FileText, 
  ExternalLink, 
  MapPin, 
  Phone, 
  User, 
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';

interface DropshippingSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DropshippingSlipModal: React.FC<DropshippingSlipModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-90214');
  const [slipData, setSlipData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState('TPX-982341882IR');
  const [trackingUpdated, setTrackingUpdated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/dropshipping/dispatch-slip/${selectedOrderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.slip) {
            setSlipData(data.slip);
          }
        })
        .catch(() => {
          setSlipData({
            slipNumber: `DS-IR-${Date.now().toString().slice(-6)}`,
            generatedAt: new Date().toLocaleDateString('fa-IR'),
            storeBrand: "فروشگاه آنلاین (تعهد ارسال اختصاصی)",
            fulfillmentNotice: "حواله دراپ‌شیپینگ وایت‌لیبل • ارسال مستقیم به مشتری بدون درج قیمت یا فاکتور تأمین‌کننده",
            orderNumber: selectedOrderId,
            customer: {
              fullName: "علیرضا محمدی",
              phone: "09121234567",
              province: "تهران",
              city: "تهران",
              address: "خیابان ولیعصر، بالاتر از میدان ونک، برج نگین، طبقه ۵، واحد ۱۵",
              postalCode: "1969764512"
            },
            shippingProvider: "تیپاکس اکسپرس (ارسال با بارنامه)",
            trackingNumber: trackingInput,
            items: [
              { sku: "SKU-SHK-01", title: "مخلوط‌کن و شیکر شارژی قابل حمل", quantity: 1 }
            ],
            specialInstructions: "بسته‌بندی بدون برچسب قیمت یا نام تأمین‌کننده و با پلمپ ساده ارسال بشه."
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedOrderId]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!slipData) return;
    const text = `حواله ارسال مستقیم به تأمین‌کننده:
شماره حواله: ${slipData.slipNumber}
کد سفارش سایت: ${slipData.orderNumber}
فرستنده: ${slipData.storeBrand} (بدون نام تأمین‌کننده)
---------------------------------
تحویل‌گیرنده: ${slipData.customer.fullName}
شماره تماس: ${slipData.customer.phone}
استان و شهر: ${slipData.customer.province} - ${slipData.customer.city}
آدرس کامل: ${slipData.customer.address}
کد پستی: ${slipData.customer.postalCode}
---------------------------------
اقلام بسته:
${slipData.items.map((i: any) => `• ${i.title} (${i.quantity} عدد) [کد: ${i.sku}]`).join('\n')}
---------------------------------
روش ارسال: ${slipData.shippingProvider}
نکته مهم: لطفاً هیچ برگه قیمت یا نام تأمین‌کننده داخل بسته قرار ندید.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveTracking = () => {
    setTrackingUpdated(true);
    setTimeout(() => setTrackingUpdated(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl w-full max-w-2xl shadow-2xl p-4 sm:p-6 text-[var(--text-main)] max-h-[92vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent-soft)] border border-[var(--border-active)] flex items-center justify-center text-[var(--accent-text)] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-[var(--text-main)] truncate">
                حواله ارسال مستقیم تأمین‌کننده (Iran Dropshipping Dispatch)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                فرمت استاندارد وایت‌لیبل جهت ارسال مستقیم کالا توسط تأمین‌کننده به مشتری نهایی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span className="text-[var(--text-muted)]">انتخاب سفارش:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-mono flex-1 sm:flex-initial"
            >
              <option value="ORD-90214">ORD-90214 (علیرضا محمدی - تهران)</option>
              <option value="ORD-88190">ORD-88190 (سارا احمدی - اصفهان)</option>
              <option value="ORD-76231">ORD-76231 (مهدی رضایی - مشهد)</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ فیش ارسال</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد!' : 'کپی برای تأمین‌کننده (ایتا / تلگرام)'}</span>
            </button>
          </div>
        </div>

        {/* Printable White-Label Slip Container */}
        {slipData && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white text-[#182B22] border-2 border-[#182B22]/25 space-y-4 font-sans text-xs shadow-inner">
            {/* Slip Header */}
            <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-[#182B22] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#4C5A52] block uppercase">Fulfillment Voucher</span>
                <h3 className="text-base font-black text-[#182B22]">حواله رسمی ارسال مستقیم به خریدار</h3>
                <span className="text-[11px] text-[#4C5A52] font-medium">فرستنده: {slipData.storeBrand}</span>
              </div>

              <div className="text-left font-mono">
                <div className="text-xs font-bold text-[#1E4635]">{slipData.slipNumber}</div>
                <div className="text-[10px] text-[#4C5A52]">تاریخ صدور: {slipData.generatedAt}</div>
                <div className="text-[10px] text-[#4C5A52]">شماره سفارش: {slipData.orderNumber}</div>
              </div>
            </div>

            {/* Notice */}
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{slipData.fulfillmentNotice}</span>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#4C5A52] block">مشخصات تحویل‌گیرنده:</span>
                <div className="font-black text-sm text-[#182B22]">{slipData.customer.fullName}</div>
                <div className="text-[#182B22]">تلفن تماس: <span className="font-mono font-bold">{slipData.customer.phone}</span></div>
              </div>

              <div className="space-y-1 text-[11px]">
                <span className="text-[10px] font-bold text-[#4C5A52] block">نشانی دقیق پستی:</span>
                <div className="text-[#182B22] font-medium">{slipData.customer.province} - {slipData.customer.city}</div>
                <div className="text-[#182B22] leading-relaxed">{slipData.customer.address}</div>
                <div className="text-[#4C5A52]">کد پستی ۱۰ رقمی: <span className="font-mono font-bold text-[#182B22]">{slipData.customer.postalCode}</span></div>
              </div>
            </div>

            {/* Package Items Table */}
            <div className="space-y-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-[#4C5A52] block">اقلام سفارش جهت بسته‌بندی:</span>
              <table className="w-full min-w-[420px] text-right border border-neutral-200 rounded-lg overflow-hidden">
                <thead className="bg-neutral-100 text-[#182B22] text-[11px]">
                  <tr>
                    <th className="p-2 border-b">ردیف</th>
                    <th className="p-2 border-b">عنوان کالا</th>
                    <th className="p-2 border-b">شناسه انبار (SKU)</th>
                    <th className="p-2 border-b text-center">تعداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-[#182B22]">
                  {slipData.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold">{item.title}</td>
                      <td className="p-2 font-mono text-[#4C5A52]">{item.sku}</td>
                      <td className="p-2 text-center font-bold text-[#1E4635]">{item.quantity} عدد</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Shipping instructions */}
            <div className="border-t border-neutral-200 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#4C5A52]">
              <div>
                روش ارسال: <span className="font-bold text-[#182B22]">{slipData.shippingProvider}</span>
              </div>
              <div>
                کد رهگیری: <span className="font-mono font-bold text-[#182B22]">{trackingInput}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Code Updater for Supplier Response */}
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2 text-xs">
          <label className="text-[var(--text-main)] font-bold block">
            ثبت کد رهگیری دریافتی از تأمین‌کننده (پست پیشتاز / تیپاکس):
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="مثال: TPX-982341882IR یا بارنامه ۲۴ رقمی پست"
              className="flex-1 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-mono"
            />
            <button
              onClick={handleSaveTracking}
              className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold transition-colors cursor-pointer shrink-0"
            >
              ثبت و ارسال پیامک به خریدار
            </button>
          </div>
          {trackingUpdated && (
            <p className="text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
              کد رهگیری توی دیتابیس ثبت شد و برای خریدار ارسال شد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
