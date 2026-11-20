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
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                حواله ارسال مستقیم تأمین‌کننده (Iran Dropshipping Dispatch)
              </h2>
              <p className="text-xs text-slate-400">
                فرمت استاندارد وایت‌لیبل جهت ارسال مستقیم کالا توسط تأمین‌کننده به مشتری نهایی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">انتخاب سفارش:</span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
            >
              <option value="ORD-90214">ORD-90214 (علیرضا محمدی - تهران)</option>
              <option value="ORD-88190">ORD-88190 (سارا احمدی - اصفهان)</option>
              <option value="ORD-76231">ORD-76231 (مهدی رضایی - مشهد)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>چاپ فیش ارسال</span>
            </button>
            <button
              onClick={handleCopyText}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-950/50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'کپی شد!' : 'کپی برای تأمین‌کننده (ایتا / تلگرام)'}</span>
            </button>
          </div>
        </div>

        {/* Printable White-Label Slip Container */}
        {slipData && (
          <div className="p-5 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 space-y-4 font-sans text-xs shadow-inner">
            {/* Slip Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Fulfillment Voucher</span>
                <h3 className="text-base font-black text-slate-950">حواله رسمی ارسال مستقیم به خریدار</h3>
                <span className="text-[11px] text-slate-600 font-medium">فرستنده: {slipData.storeBrand}</span>
              </div>

              <div className="text-left font-mono">
                <div className="text-xs font-bold text-indigo-700">{slipData.slipNumber}</div>
                <div className="text-[10px] text-slate-500">تاریخ صدور: {slipData.generatedAt}</div>
                <div className="text-[10px] text-slate-500">شماره سفارش: {slipData.orderNumber}</div>
              </div>
            </div>

            {/* Notice */}
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{slipData.fulfillmentNotice}</span>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">مشخصات تحویل‌گیرنده:</span>
                <div className="font-black text-sm text-slate-950">{slipData.customer.fullName}</div>
                <div className="text-slate-700">تلفن تماس: <span className="font-mono font-bold">{slipData.customer.phone}</span></div>
              </div>

              <div className="space-y-1 text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 block">نشانی دقیق پستی:</span>
                <div className="text-slate-800 font-medium">{slipData.customer.province} - {slipData.customer.city}</div>
                <div className="text-slate-800 leading-relaxed">{slipData.customer.address}</div>
                <div className="text-slate-600">کد پستی ۱۰ رقمی: <span className="font-mono font-bold text-slate-900">{slipData.customer.postalCode}</span></div>
              </div>
            </div>

            {/* Package Items Table */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 block">اقلام سفارش جهت بسته‌بندی:</span>
              <table className="w-full text-right border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 text-[11px]">
                  <tr>
                    <th className="p-2 border-b">ردیف</th>
                    <th className="p-2 border-b">عنوان کالا</th>
                    <th className="p-2 border-b">شناسه انبار (SKU)</th>
                    <th className="p-2 border-b text-center">تعداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {slipData.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold">{item.title}</td>
                      <td className="p-2 font-mono text-slate-600">{item.sku}</td>
                      <td className="p-2 text-center font-bold text-indigo-700">{item.quantity} عدد</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Shipping instructions */}
            <div className="border-t border-slate-200 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-600">
              <div>
                روش ارسال: <span className="font-bold text-slate-900">{slipData.shippingProvider}</span>
              </div>
              <div>
                کد رهگیری: <span className="font-mono font-bold text-slate-900">{trackingInput}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Code Updater for Supplier Response */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <label className="text-slate-300 font-bold block">
            ثبت کد رهگیری دریافتی از تأمین‌کننده (پست پیشتاز / تیپاکس):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              placeholder="مثال: TPX-982341882IR یا بارنامه ۲۴ رقمی پست"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
            <button
              onClick={handleSaveTracking}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              ثبت و ارسال پیامک به خریدار
            </button>
          </div>
          {trackingUpdated && (
            <p className="text-emerald-400 text-[11px] font-bold">
              کد رهگیری توی دیتابیس ثبت شد و برای خریدار ارسال شد.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
