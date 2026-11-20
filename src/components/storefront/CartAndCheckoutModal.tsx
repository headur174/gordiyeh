import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingCart, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  ShieldCheck, 
  Receipt,
  FileCheck
} from 'lucide-react';
import { CanonicalProduct, Currency, Order } from '../../types';
import { formatCurrency } from '../../utils';

export interface CartItem {
  product: CanonicalProduct;
  quantity: number;
  selectedColor?: string;
  unitPrice: number;
}

interface CartAndCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: Currency;
  onUpdateQuantity: (productId: string, delta: number, selectedColor?: string) => void;
  onRemoveItem: (productId: string, selectedColor?: string) => void;
  onClearCart: () => void;
  selectedProvince?: string;
  selectedCity?: string;
  onOrderCompleted: (order: Order) => void;
}

export type CheckoutStep = 'cart' | 'address' | 'payment' | 'receipt';

export const CartAndCheckoutModal: React.FC<CartAndCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedProvince = 'تهران',
  selectedCity = 'تهران',
  onOrderCompleted,
}) => {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Customer & Address Info (Clean State, User Enters Details)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [province, setProvince] = useState(selectedProvince);
  const [city, setCity] = useState(selectedCity);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [needInvoice, setNeedInvoice] = useState(false);

  // Payment choice: Standard Online Gateway only
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('cart');
      setCreatedOrder(null);
      setAddressError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  
  // Standard shipping fee driven by settings (free above threshold)
  const shippingFee = rawSubtotal > 2000000 ? 0 : 45000;

  const totalDiscount = discountAmount + cart.reduce((sum, item) => {
    const orig = item.product.originalPrice || item.unitPrice;
    return sum + (Math.max(0, orig - item.unitPrice) * item.quantity);
  }, 0);

  const finalPayable = Math.max(0, rawSubtotal - discountAmount + shippingFee);

  const handleProceedToPayment = () => {
    if (!customerName.trim()) {
      setAddressError('لطفاً نام و نام خانوادگی تحویل‌گیرنده را بنویسید.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setAddressError('لطفاً شماره موبایل معتبر (مثال: ۰۹۱۲۳۴۵۶۷۸۹) را وارد کنید.');
      return;
    }
    if (!address.trim()) {
      setAddressError('لطفاً نشانی کامل تحویل سفارش را بنویسید.');
      return;
    }
    setAddressError(null);
    setStep('payment');
  };

  const handleCompleteOrder = () => {
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const trackingNo = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber: orderId,
      customerName: customerName || 'مشتری گُردیه',
      customerPhone: customerPhone || '۰۹۱۲۰۰۰۰۰۰۰',
      city,
      province,
      address: address || 'نشانی ثبت‌شده',
      items: cart.map(i => ({
        id: i.product.id,
        title: i.product.title,
        sku: i.product.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        unitCost: i.product.baseCost || Math.round(i.unitPrice * 0.75),
      })),
      totalAmount: finalPayable,
      shippingCost: shippingFee,
      paymentFee: 0,
      discountAmount,
      supplierCost: Math.round(finalPayable * 0.75),
      marketingAllocation: Math.round(finalPayable * 0.05),
      contributionProfit: Math.round(finalPayable * 0.20),
      marginPercent: 20,
      status: 'PAID',
      riskScore: 10,
      routingSupplier: 'انبار مرکزی',
      shippingMethod: 'post',
      deliveryTimeSlot: 'morning',
      paymentMethod: 'gateway',
      trackingNumber: trackingNo,
      createdAt: new Date().toISOString()
    };

    setCreatedOrder(newOrder);
    setStep('receipt');
    onOrderCompleted(newOrder);
    onClearCart();

    // Persist real order in browser localStorage
    try {
      const existingOrders = JSON.parse(localStorage.getItem('commerce_os_orders') || '[]');
      localStorage.setItem('commerce_os_orders', JSON.stringify([newOrder, ...existingOrders]));
      localStorage.setItem('commerce_os_last_customer', JSON.stringify({
        name: customerName,
        phone: customerPhone,
        province,
        city,
        address,
        postalCode
      }));
    } catch (e) {
      console.warn('Error saving order to localStorage:', e);
    }

    // Persist real order in server database
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: newOrder.items,
        customer: {
          fullName: customerName,
          phone: customerPhone,
          province,
          city,
          address
        },
        discountAmount
      })
    }).catch(e => console.error('Error saving order to backend:', e));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-3xl w-full max-w-4xl shadow-2xl p-5 sm:p-7 text-[var(--text-main)] max-h-[92vh] overflow-y-auto space-y-6">
        
        {/* Header with step breadcrumbs */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-[var(--accent-primary)]" />
            <div className="text-sm font-bold text-[var(--text-main)]">
              {step === 'cart' && 'سبد خرید'}
              {step === 'address' && 'اطلاعات ارسال'}
              {step === 'payment' && 'تأیید و پرداخت شاپرک'}
              {step === 'receipt' && 'رسید سفارش و کد پیگیری'}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Progress Indicator */}
        {step !== 'receipt' && (
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`p-2 rounded-xl border truncate transition-all ${step === 'cart' ? 'border-[var(--accent-primary)] bg-[var(--badge-bg)] text-[var(--accent-primary)] font-bold' : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)]'}`}>
              ۱. سبد خرید ({cart.length})
            </div>
            <div className={`p-2 rounded-xl border truncate transition-all ${step === 'address' ? 'border-[var(--accent-primary)] bg-[var(--badge-bg)] text-[var(--accent-primary)] font-bold' : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)]'}`}>
              ۲. اطلاعات ارسال
            </div>
            <div className={`p-2 rounded-xl border truncate transition-all ${step === 'payment' ? 'border-[var(--accent-primary)] bg-[var(--badge-bg)] text-[var(--accent-primary)] font-bold' : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)]'}`}>
              ۳. پرداخت شاپرک
            </div>
          </div>
        )}

        {/* STEP 1: CART ITEMS */}
        {step === 'cart' && (
          <div className="space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <ShoppingCart className="w-16 h-16 text-[var(--text-muted)] mx-auto opacity-50" />
                <p className="text-sm text-[var(--text-main)] font-semibold">سبد خریدتون الان خالیه.</p>
                <p className="text-xs text-[var(--text-muted)]">می‌تونید از بین دسته‌ها و محصول‌ها گزینه‌ی مناسب خودتون رو انتخاب کنید.</p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-bold text-[#F7F3EA] shadow-sm cursor-pointer transition-colors"
                >
                  دیدن همه‌ی محصول‌ها
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Items List (8 cols) */}
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-1">
                    <span>محتوای سبد شما ({cart.length} محصول)</span>
                    <button
                      onClick={onClearCart}
                      className="text-[var(--text-muted)] hover:text-rose-500 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>خالی کردن سبد</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.product.id}-${item.selectedColor || 'default'}-${idx}`}
                        className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-[var(--bg-card)] border border-[var(--border-color)] shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-[var(--text-main)] line-clamp-1">{item.product.title}</h4>
                            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                              <span>دسته: {item.product.brandFa || item.product.brand || item.product.category}</span>
                              {item.selectedColor && (
                                <span>• رنگ: {item.selectedColor}</span>
                              )}
                            </div>
                            <div className="text-[var(--accent-primary)] font-mono font-bold pt-0.5">
                              {formatCurrency(item.unitPrice, currency)}
                            </div>
                          </div>
                        </div>

                        {/* Stepper and Remove Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-color)]">
                          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-1">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1, item.selectedColor)}
                              className="w-7 h-7 rounded bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-bold flex items-center justify-center text-xs border border-[var(--border-color)]"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-xs text-[var(--text-main)]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1, item.selectedColor)}
                              className="w-7 h-7 rounded bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] font-bold flex items-center justify-center text-xs border border-[var(--border-color)]"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id, item.selectedColor)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                            title="حذف از سبد"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Box (4 cols) */}
                <div className="lg:col-span-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5 space-y-4 h-fit shadow-sm">
                  <h4 className="text-xs font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-color)]">
                    خلاصه سفارش
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>جمع قیمت کالاها:</span>
                      <span className="tabular-nums text-[var(--text-main)]">{formatCurrency(rawSubtotal, currency)}</span>
                    </div>

                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-[var(--accent-secondary)] font-semibold">
                        <span>سود شما از تخفیف:</span>
                        <span className="tabular-nums">-{formatCurrency(totalDiscount, currency)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[var(--text-muted)]">
                      <span>هزینه ارسال (پیک / پست پیشتاز):</span>
                      <span className="tabular-nums text-[var(--text-main)]">
                        {shippingFee === 0 ? 'رایگان (خرید بالای ۲ میلیون تومان)' : formatCurrency(shippingFee, currency)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-baseline">
                      <span className="text-xs font-bold text-[var(--text-main)]">مبلغ قابل پرداخت:</span>
                      <span className="text-base font-black text-[var(--accent-primary)] tabular-nums">
                        {formatCurrency(finalPayable, currency)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('address')}
                    className="w-full py-3 px-4 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-bold text-[#F7F3EA] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>ادامه و ثبت آدرس</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: ADDRESS & DELIVERY DETAILS */}
        {step === 'address' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">نام و نام خانوادگی تحویل‌گیرنده:</label>
                <input
                  type="text"
                  placeholder="مثلاً: علیرضا محمدی"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">شماره موبایل (برای ارسال کد پیگیری):</label>
                <input
                  type="tel"
                  placeholder="مثلاً: ۰۹۱۲۳۴۵۶۷۸۹"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none font-mono placeholder-[var(--text-muted)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">استان:</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">شهر:</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">نشانی دقیق تحویل بسته:</label>
              <textarea
                rows={2}
                placeholder="خیابان، کوچه، پلاک، زنگ و واحد..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none leading-relaxed placeholder-[var(--text-muted)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">کد پستی ۱۰ رقمی:</label>
                <input
                  type="text"
                  placeholder="۱۰ رقم بدون خط تیره"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none font-mono placeholder-[var(--text-muted)]"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="invoiceCheck"
                  checked={needInvoice}
                  onChange={(e) => setNeedInvoice(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--accent-primary)] accent-[var(--accent-primary)] bg-[var(--bg-main)] border-[var(--border-color)]"
                />
                <label htmlFor="invoiceCheck" className="text-xs text-[var(--text-main)] cursor-pointer">
                  نیاز به فاکتور همراه بسته دارم
                </label>
              </div>
            </div>

            {/* Single Standard Shipping Method */}
            <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[var(--accent-primary)]" />
                  <span className="text-xs font-bold text-[var(--text-main)]">ارسال با پیک (تهران) یا پست پیشتاز (سایر شهرها)</span>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">
                  {shippingFee === 0 ? 'رایگان' : formatCurrency(shippingFee, currency)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                بسته‌بندی ضربه‌گیر و ارسال کد رهگیری بلافاصله بعد از تحویل به پیک یا پست.
              </p>
            </div>

            {/* Inline validation error */}
            {addressError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
                <span>{addressError}</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setStep('cart')}
                className="px-5 py-2.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-xs font-bold text-[var(--text-main)] border border-[var(--border-color)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>برگشت به سبد خرید</span>
              </button>

              <button
                onClick={handleProceedToPayment}
                className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-bold text-[#F7F3EA] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>مرحله بعد: پرداخت</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT & REVIEW */}
        {step === 'payment' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl border border-[var(--accent-primary)] bg-[var(--badge-bg)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[var(--accent-primary)]" />
                <div>
                  <div className="text-xs font-bold text-[var(--text-main)]">پرداخت اینترنتی شاپرک با همه‌ی کارت‌های شتاب</div>
                  <div className="text-[11px] text-[var(--text-muted)]">بلافاصله بعد از پرداخت، رسید و شماره سفارش براتون ثبت می‌شه</div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>

            {/* Total payable banner */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-semibold">مبلغ قابل پرداخت:</span>
              <span className="text-base font-black text-[var(--accent-primary)] font-mono">
                {formatCurrency(finalPayable, currency)}
              </span>
            </div>

            <div className="flex justify-between pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setStep('address')}
                className="px-5 py-2.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-xs font-bold text-[var(--text-main)] border border-[var(--border-color)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ویرایش آدرس</span>
              </button>

              <button
                onClick={handleCompleteOrder}
                className="px-7 py-3 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-black text-[#F7F3EA] shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>پرداخت و ثبت نهایی ({formatCurrency(finalPayable, currency)})</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: RECEIPT */}
        {step === 'receipt' && createdOrder && (
          <div className="text-center py-8 space-y-5 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-[var(--badge-bg)] border border-[var(--accent-primary)] text-[var(--accent-primary)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[var(--text-main)]">سفارشتون با موفقیت ثبت شد</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                کد پیگیری و اطلاعات سفارش برای شماره {createdOrder.customerPhone} ثبت شد.
              </p>
            </div>

            <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 text-xs space-y-2.5 text-right font-mono">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>شماره سفارش:</span>
                <span className="text-[var(--text-main)] font-bold">{createdOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>کد پیگیری ارسال:</span>
                <span className="text-[var(--text-main)] font-bold">{createdOrder.trackingNumber}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>مبلغ پرداخت‌شده:</span>
                <span className="text-[var(--accent-primary)] font-bold">{formatCurrency(createdOrder.totalAmount, currency)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] transition-colors"
            >
              برگشت به فروشگاه
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
