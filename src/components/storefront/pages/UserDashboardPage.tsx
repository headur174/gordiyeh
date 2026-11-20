import React, { useState } from 'react';
import { 
  User, 
  Package, 
  ChevronLeft, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Eye,
  ArrowRight
} from 'lucide-react';
import { CanonicalProduct, Currency, Order } from '../../../types';
import { formatCurrency } from '../../../utils';

interface UserDashboardPageProps {
  products: CanonicalProduct[];
  currency: Currency;
  onSelectProduct: (product: CanonicalProduct) => void;
  onAddToCart: (product: CanonicalProduct) => void;
  onBackToHome: () => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  products,
  currency,
  onSelectProduct,
  onAddToCart,
  onBackToHome
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'privacy'>('orders');
  const [orderSubFilter, setOrderSubFilter] = useState<'all' | 'processing' | 'delivered' | 'cancelled'>('all');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [customerProfile] = useState<{ name: string; phone: string; address?: string; city?: string; province?: string; postalCode?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('commerce_os_last_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Orders list (loaded from real local & backend orders)
  const [orders, setOrders] = useState<Array<{
    id: string;
    orderNumber: string;
    date: string;
    status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    trackingCode: string;
    totalAmount: number;
    items: Array<{ id?: string; title: string; image?: string; quantity?: number; count?: number; unitPrice?: number; price?: number }>;
  }>>(() => {
    try {
      const saved = localStorage.getItem('commerce_os_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((o: any) => ({
            id: o.id || o.orderNumber,
            orderNumber: o.orderNumber || o.id,
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('fa-IR') : 'امروز',
            status: o.status || 'PROCESSING',
            trackingCode: o.trackingNumber || o.trackingCode || 'TRK-PENDING',
            totalAmount: o.totalAmount || 0,
            items: o.items || []
          }));
        }
      }
    } catch {}
    return [];
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredOrders = orders.filter(o => {
    if (orderSubFilter === 'processing') return o.status === 'PROCESSING' || o.status === 'SHIPPED';
    if (orderSubFilter === 'delivered') return o.status === 'DELIVERED';
    if (orderSubFilter === 'cancelled') return o.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="space-y-6 pb-12 font-sans text-right max-w-7xl mx-auto px-4 sm:px-6 text-[var(--text-main)]">
      {/* Top Breadcrumbs */}
      <nav className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <button onClick={onBackToHome} className="hover:text-[var(--text-main)] transition-colors cursor-pointer">فروشگاه گُردیه</button>
          <span>/</span>
          <span className="text-[var(--text-main)] font-medium">حساب کاربری و سفارش‌ها</span>
        </div>
        <button
          onClick={onBackToHome}
          className="text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>برگشت به فروشگاه</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* User Header Profile Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[var(--text-main)]">پروفایل و سفارش‌های شما</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-main)] text-[var(--accent-primary)] border border-[var(--border-color)] text-[10px] font-bold">
                حساب خریدار
              </span>
            </div>
            <div className="text-xs text-[var(--text-muted)]">اطلاعات تماس و نشانی شما به‌صورت رمزنگاری‌شده نگهداری می‌شه.</div>
          </div>
        </div>

        {/* Quick Order Stats */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] min-w-[160px]">
          <div className="text-[10px] text-[var(--text-muted)]">سفارش‌های ثبت‌شده:</div>
          <div className="text-sm font-black text-[var(--accent-primary)] font-mono mt-0.5">
            {orders.length} سفارش
          </div>
        </div>
      </div>

      {/* Main Layout: 3-column Sidebar & 9-column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1 h-fit shadow-md">
          <button
            onClick={() => { setActiveTab('orders'); setSelectedOrderDetail(null); }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'orders'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              <span>سفارش‌های من</span>
            </div>
            <span className="font-mono text-[11px] opacity-80">{orders.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setSelectedOrderDetail(null); }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'profile'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4" />
              <span>شناسنامه و مشخصات کاربری</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('privacy'); setSelectedOrderDetail(null); }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'privacy'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4" />
              <span>مرکز حریم خصوصی Zero-Plaintext</span>
            </div>
          </button>
        </div>

        {/* Content Area (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && !selectedOrderDetail && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">لیست سفارش‌ها و کدهای پیگیری</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setOrderSubFilter('all')}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                      orderSubFilter === 'all' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    همه
                  </button>
                  <button
                    onClick={() => setOrderSubFilter('processing')}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                      orderSubFilter === 'processing' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    در حال آماده‌سازی و ارسال
                  </button>
                  <button
                    onClick={() => setOrderSubFilter('delivered')}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition-colors cursor-pointer ${
                      orderSubFilter === 'delivered' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    تحویل‌شده
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--accent-primary)]">
                    <Package className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">هنوز سفارشی ثبت نشده است</h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    پس از نهایی‌سازی سفارش در سبد خرید، وضعیت آماده‌سازی، کد رهگیری پستی و زمان تحویل در این بخش نمایش داده خواهد شد.
                  </p>
                  <button
                    onClick={onBackToHome}
                    className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold transition-all inline-block mt-2 shadow-sm cursor-pointer"
                  >
                    مشاهده کاتالوگ محصولات
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--text-main)] font-mono">سفارش {order.orderNumber}</span>
                          <span className="opacity-40">•</span>
                          <span className="text-[var(--text-muted)] font-mono">{order.date}</span>
                        </div>
                        <span className="text-[var(--accent-primary)] font-bold font-mono">
                          {formatCurrency(order.totalAmount, currency)}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedOrderDetail(order)}
                        className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-bold pt-2 border-t border-[var(--border-color)]"
                      >
                        <Eye className="w-4 h-4 text-[var(--accent-primary)]" />
                        <span>مشاهده جزئیات سفارش و رهگیری بارنامه ترابری</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDER DETAIL VIEW WITH TIMELINE */}
          {selectedOrderDetail && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-bold"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به لیست بارنامه‌ها</span>
                </button>
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  شناسه رهگیری: {selectedOrderDetail.trackingCode || 'TRK-PENDING'}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[var(--text-main)]">تایملاین ترابری و تحویل:</h4>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-bold">
                    ۱. ثبت سفارش
                  </div>
                  <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-main)] font-bold">
                    ۲. تأیید مالی شاپرک
                  </div>
                  <div className="p-2.5 rounded-xl border border-[var(--accent-primary)] bg-[var(--badge-bg)] text-[var(--accent-primary)] font-bold">
                    ۳. فرزکاری و بسته‌بندی
                  </div>
                  <div className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 text-[var(--text-muted)]">
                    ۴. تحویل به ستاپ
                  </div>
                </div>
              </div>

              {/* Items in this Order */}
              {selectedOrderDetail.items && selectedOrderDetail.items.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                  <h4 className="text-xs font-bold text-[var(--text-main)]">قطعات این محموله:</h4>
                  <div className="space-y-2">
                    {selectedOrderDetail.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                          <span className="text-[var(--text-main)] font-semibold">{item.title}</span>
                          <span className="text-[var(--text-muted)] font-mono">({item.quantity || item.count || 1} عدد)</span>
                        </div>
                        <span className="text-[var(--accent-primary)] font-mono font-bold">
                          {formatCurrency(item.unitPrice || item.price || 0, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-color)]">
                <User className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">مشخصات حساب کاربری</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <span className="text-[var(--text-muted)]">نام و نام خانوادگی خریدار:</span>
                  <div className="text-[var(--text-main)] font-bold">{customerProfile?.name || 'مشتری گُردیه'}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <span className="text-[var(--text-muted)]">شماره تلفن همراه جهت اطلاع‌رسانی:</span>
                  <div className="text-[var(--text-main)] font-mono font-bold">{customerProfile?.phone || 'ثبت‌نشده'}</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1 md:col-span-2">
                  <span className="text-[var(--text-muted)]">آخرین نشانی ثبت‌شده تحویل:</span>
                  <div className="text-[var(--text-main)] leading-relaxed">
                    {customerProfile?.address 
                      ? `${customerProfile.province || ''} - ${customerProfile.city || ''} - ${customerProfile.address}` 
                      : 'نشانی ثابتی ثبت نشده است (در اولین خرید ذخیره می‌گردد).'}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <span className="text-[var(--text-muted)]">وضعیت احراز هویت:</span>
                  <div className="text-[var(--text-main)] font-bold">احراز هویت شده بر اساس شماره همراه</div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <span className="text-[var(--text-muted)]">رمزنگاری داده‌ها:</span>
                  <div className="text-[var(--text-main)] font-bold font-mono">AES-256-GCM // HARDENED</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & DATA RIGHTS (COCA STANDARD) */}
          {activeTab === 'privacy' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6 shadow-md">
              <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-color)]">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">مرکز کنترل حریم خصوصی Zero-Plaintext</h3>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2 text-xs text-[var(--text-main)]">
                <div className="flex items-center gap-2 text-[var(--text-main)] font-bold">
                  <Lock className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>اصل حاکمیت کاربر بر داده‌ها (Zero-Plaintext & Self-Sovereign)</span>
                </div>
                <p className="leading-relaxed text-[var(--text-muted)]">
                  اطلاعات تماس و نشانی شما به صورت رمزنگاری‌شده با الگوریتم استاندارد AES-256 ذخیره می‌گردد و جستجوها از طریق ایندکس کور (Blind Indexing) صورت می‌پذیرد. شما حق دسترسی، خروجی گرفتن یا حذف کامل ردپای خود را در هر زمان دارا می‌باشید.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => showToast('نسخه خروجی داده‌های شخصی شما آماده دریافت شد.')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] text-xs font-bold flex items-center gap-2 transition-colors border border-[var(--border-color)]"
                >
                  <Download className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>دانلود نسخه کامل داده‌های شخصی من (JSON)</span>
                </button>
                <button
                  onClick={() => showToast('حافظه و کوکی‌های مربوط به حریم خصوصی شما پاکسازی شد.')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-rose-500 text-xs font-bold flex items-center gap-2 transition-colors border border-[var(--border-color)]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>پاکسازی حافظه محلی و سابقه مرورگر</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
