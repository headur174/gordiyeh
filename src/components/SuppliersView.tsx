import React, { useState } from 'react';
import { Supplier } from '../types';
import { 
  Truck, 
  Star, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Ban, 
  ThumbsUp, 
  TrendingDown, 
  PackageCheck,
  Search,
  FileText,
  Phone,
  ExternalLink,
  Database,
  Building2,
  Layers,
  Filter,
  Check,
  Calculator,
  Percent,
  ShieldCheck
} from 'lucide-react';
import { DropshippingSlipModal } from './DropshippingSlipModal';
import { SOURCED_SUPPLIERS_DATA, SourcedSupplierOffer } from '../data/procurementSuppliers';

interface SuppliersViewProps {
  suppliers: Supplier[];
  onToggleSupplierStatus: (supplierId: string, newStatus: Supplier['status']) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  onToggleSupplierStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'scorecards'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('ALL');
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Extract unique products for matrix filter
  const uniqueProducts = Array.from(new Set(SOURCED_SUPPLIERS_DATA.map(item => item.productName)));

  // Filtered Matrix data
  const filteredMatrix = SOURCED_SUPPLIERS_DATA.filter(item => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm) ||
      (item.website && item.website.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProduct = selectedProductFilter === 'ALL' || item.productName === selectedProductFilter;
    return matchesSearch && matchesProduct;
  });

  // Filtered Suppliers for Scorecard
  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)] text-[var(--accent-text)] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)]">مدیریت زنجیره تأمین و بانک منابع کالا (Procurement OS)</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                بانک اطلاعاتی تأمین‌کنندگان، شماره‌های تماس مستقیم، درگاه‌های استعلام و کارت‌های عملکرد
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Dispatch Slip Button */}
          <button
            onClick={() => setIsSlipModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>صدور حواله ارسال وایت‌لیبل</span>
          </button>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="جستجو در تأمین‌کننده، کالا، تلفن..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pr-10 pl-4 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
            />
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher: Procurement Matrix vs Scorecards */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-color)] pb-3 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ماتریس تأمین‌کنندگان و منابع کالا ({SOURCED_SUPPLIERS_DATA.length} منبع)</span>
          </button>

          <button
            onClick={() => setActiveTab('scorecards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'scorecards'
                ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>کارت‌های ارزیابی و امتیاز عملکرد ({suppliers.length} شرکت)</span>
          </button>
        </div>

        {activeTab === 'matrix' && (
          <div className="text-xs text-[var(--text-muted)] hidden sm:block">
            منبع: جدول استخراجی اسناد بازرگانی و تأمین داخلی
          </div>
        )}
      </div>

      {/* VIEW A: PROCUREMENT SOURCING MATRIX TABLE */}
      {activeTab === 'matrix' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Pricing Standard & Transparency Box */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                <h3 className="text-xs font-bold text-[var(--text-main)]">
                  استاندارد فرمول قیمت‌گذاری کاتالوگ و ماتریس ارزش‌افزوده (سند TAMIN_ONE)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/35">
                فرمول بازرگانی: استعلام دست‌اول + هزینه‌های عملیات + حاشیه سود مصوب
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-[var(--text-main)]">
              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                <span className="font-bold text-[var(--text-main)] text-[11px] block">۱. منبع استعلام هزینه (Base Cost):</span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  قیمت پایه عمده‌فروشی مستقیماً از تأمین‌کنندگان جدول ۱ (آرین کالا، هوم شاپ، بایت استور، گجت‌یار و...) دریافت و ثبت می‌شود.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                <span className="font-bold text-[var(--text-main)] text-[11px] block">۲. فرمول قیمت نهایی (Retail Price):</span>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">
                  قیمت = (خرید عمده × ۱.۰۵ هندلینگ + ۱.۵٪ شاپرک) ÷ (۱ - سود ناخالص٪)
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-1">
                <span className="font-bold text-[var(--text-main)] text-[11px] block">۳. تطبیق با بازار (ترب و ایمالز):</span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  قیمت نهایی همواره پایین‌تر از میانه بازار ترب تنظیم می‌شود تا جایگاه فروشگاه در جعبه خرید (Buy Box) تضمین گردد.
                </p>
              </div>
            </div>
          </div>

          {/* Filter by Product Name tabs */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5 font-bold text-[var(--text-main)]">
                <Filter className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                <span>فیلتر بر اساس کالای مورد نیاز:</span>
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                نمایش {filteredMatrix.length} از {SOURCED_SUPPLIERS_DATA.length} ردیف تأمین
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-none pr-0.5">
              <button
                onClick={() => setSelectedProductFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedProductFilter === 'ALL'
                    ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                همه کالاها ({uniqueProducts.length})
              </button>
              {uniqueProducts.map((pName) => {
                const count = SOURCED_SUPPLIERS_DATA.filter(i => i.productName === pName).length;
                return (
                  <button
                    key={pName}
                    onClick={() => setSelectedProductFilter(pName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                      selectedProductFilter === pName
                        ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold'
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <span>{pName}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sourcing Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-right text-xs">
                <thead>
                  <tr className="bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-bold">
                    <th className="py-3.5 px-4 w-12 text-center">ردیف</th>
                    <th className="py-3.5 px-4">نام کالا / گروه بازرگانی</th>
                    <th className="py-3.5 px-4">نام برند / تأمین‌کننده</th>
                    <th className="py-3.5 px-4">شماره تماس مستقیم</th>
                    <th className="py-3.5 px-4">وب‌سایت / آدرس اینترنتی</th>
                    <th className="py-3.5 px-4 text-center">اقدام سریع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredMatrix.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                        موردی با این مشخصات در بانک تأمین‌کنندگان یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrix.map((item, index) => (
                      <tr 
                        key={index}
                        className="hover:bg-[var(--bg-card)] transition-colors"
                      >
                        <td className="py-3 px-4 text-center font-mono text-[var(--text-muted)]">
                          {item.row}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[var(--text-main)]">{item.productName}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{item.productCategory}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[var(--text-main)]">{item.supplierName}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${item.phone}`}
                              className="font-mono text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 dir-ltr"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{item.phone}</span>
                            </a>
                            <button
                              onClick={() => handleCopyPhone(item.phone)}
                              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 cursor-pointer"
                              title="کپی شماره"
                            >
                              {copiedPhone === item.phone ? (
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                'کپی'
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.website ? (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[var(--accent-text)] hover:underline font-mono flex items-center gap-1 truncate max-w-[200px]"
                            >
                              <span className="truncate">{item.website.replace('https://', '').replace('http://', '')}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">تأمین تلفنی / حضوری</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <a
                              href={`tel:${item.phone}`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 hover:text-white text-[11px] font-bold transition-colors"
                            >
                              تماس
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: PERFORMANCE SCORECARDS */}
      {activeTab === 'scorecards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-150">
          {filteredSuppliers.map((s) => {
            const isLimited = s.status === 'LIMITED';
            const isBlacklisted = s.status === 'BLACK_LISTED';

            return (
              <div
                key={s.id}
                id={`supplier-card-${s.id}`}
                className={`p-4 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between gap-5 ${
                  isBlacklisted
                    ? 'bg-rose-500/10 border-rose-500/40 opacity-80'
                    : isLimited
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-active)]'
                }`}
              >
                <div>
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-0.5">{s.code}</span>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">{s.name}</h3>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35'
                        : s.status === 'LIMITED'
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/35'
                    }`}>
                      {s.status === 'ACTIVE' ? '🟢 فعال' : s.status === 'LIMITED' ? '🟡 محدود شده' : '🔴 لیست سیاه'}
                    </span>
                  </div>

                  {/* Scorecard Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">نرخ تعهد تحویل:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm font-mono">{s.fulfillmentRate}٪</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">دقت موجودی:</span>
                      <span className="font-bold text-[var(--text-main)] text-sm font-mono">{s.stockAccuracy}٪</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">میانگین زمان ارسال:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-400 text-sm font-mono">{s.avgDispatchHours} ساعت</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">رقابت‌پذیری قیمت:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-sm font-mono">{s.priceCompetitiveness} / ۱۰۰</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">نرخ مرجوعی کالا:</span>
                      <span className={`font-bold text-sm font-mono ${s.returnRate > 5 ? 'text-rose-700 dark:text-rose-400' : 'text-[var(--text-main)]'}`}>
                        {s.returnRate}٪
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[11px]">نرخ نارضایتی:</span>
                      <span className={`font-bold text-sm font-mono ${s.complaintRate > 3 ? 'text-rose-700 dark:text-rose-400' : 'text-[var(--text-main)]'}`}>
                        {s.complaintRate}٪
                      </span>
                    </div>
                  </div>

                  {/* Failure Rate & Note */}
                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">نرخ خطای تأمین (Failure Rate):</span>
                      <span className={`font-bold font-mono ${s.failureRate > 8 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {s.failureRate}٪ (سقف مجاز: ۸٪)
                      </span>
                    </div>
                    {s.notes && (
                      <p className="text-[var(--text-muted)] text-[11px] leading-relaxed pt-1">
                        {s.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
                  {s.status !== 'ACTIVE' && (
                    <button
                      onClick={() => onToggleSupplierStatus(s.id, 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      فعال‌سازی مجدد
                    </button>
                  )}

                  {s.status !== 'LIMITED' && (
                    <button
                      onClick={() => onToggleSupplierStatus(s.id, 'LIMITED')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      محدود کردن (آفر پشتیبان)
                    </button>
                  )}

                  {s.status !== 'BLACK_LISTED' && (
                    <button
                      onClick={() => onToggleSupplierStatus(s.id, 'BLACK_LISTED')}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      انتقال به لیست سیاه
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropshipping White-Label Dispatch Slip Modal */}
      <DropshippingSlipModal
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
      />
    </div>
  );
};
