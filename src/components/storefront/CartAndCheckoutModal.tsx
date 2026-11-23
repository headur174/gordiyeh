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
  MapPin,
} from 'lucide-react';
import { CanonicalProduct, Currency, Order } from '../../types';
import { formatCurrency } from '../../utils';
import {
  CustomerAddress,
  DEFAULT_STORE_FEATURE_SETTINGS,
  IRANIAN_PROVINCES,
  StoreFeatureSettings,
  containsProfanityOrAbuse,
  isValidEmail,
  isValidIranianNationalId,
  isValidIranianPhoneStrict,
  isValidIranianPostalCode,
  normalizeDigits,
  normalizeIranianPhoneStrict,
} from '../../utils/iranianValidators';
import {
  fetchStoreFeatureSettings,
  getCachedCustomerAccount,
  getSavedSupportPhone,
  identifyCustomerAccount,
  setSavedSupportPhone,
  toPersianDigits,
  updateCustomerProfile,
} from '../../utils/supportChatStore';

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
  const [discountAmount] = useState(0);
  const [featureSettings, setFeatureSettings] = useState<StoreFeatureSettings>(
    DEFAULT_STORE_FEATURE_SETTINGS
  );
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Customer & Address Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [province, setProvince] = useState(selectedProvince);
  const [city, setCity] = useState(selectedCity);
  const [address, setAddress] = useState('');
  const [plaque, setPlaque] = useState('');
  const [unit, setUnit] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [needInvoice, setNeedInvoice] = useState(false);

  // Payment choice: Standard Online Gateway only
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isSandboxReceipt, setIsSandboxReceipt] = useState(false);
  const [gatewayRedirectUrl, setGatewayRedirectUrl] = useState<string | null>(null);

  const applySavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    if (addr.recipientName) setCustomerName(addr.recipientName);
    if (addr.recipientPhone) setCustomerPhone(addr.recipientPhone);
    if (addr.province) setProvince(addr.province);
    if (addr.city) setCity(addr.city);
    if (addr.addressLine) setAddress(addr.addressLine);
    setPlaque(addr.plaque || '');
    setUnit(addr.unit || '');
    setPostalCode(addr.postalCode || '');
    setAddressError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      setStep('cart');
      setCreatedOrder(null);
      setAddressError(null);
      setCheckoutError(null);
      setIsSubmittingOrder(false);
      setIsSandboxReceipt(false);
      setGatewayRedirectUrl(null);
      return;
    }

    void fetchStoreFeatureSettings().then(setFeatureSettings);

    const savedPhone = getSavedSupportPhone();
    if (savedPhone) {
      const cached = getCachedCustomerAccount(savedPhone);
      if (cached) {
        if (!customerPhone) setCustomerPhone(cached.phone);
        if (!customerName && (cached.fullName || cached.preferredName)) {
          setCustomerName(cached.fullName || cached.preferredName || '');
        }
        if (!email && cached.email) setEmail(cached.email);
        if (!nationalId && cached.nationalId) setNationalId(cached.nationalId);
        if (Array.isArray(cached.addresses) && cached.addresses.length > 0) {
          setSavedAddresses(cached.addresses);
          const def = cached.addresses.find((a) => a.isDefault) || cached.addresses[0];
          if (def && !address) applySavedAddress(def);
        }
      }
      void identifyCustomerAccount(savedPhone).then(({ account }) => {
        if (!account) return;
        if (!customerPhone) setCustomerPhone(account.phone);
        if (!customerName && (account.fullName || account.preferredName)) {
          setCustomerName(account.fullName || account.preferredName || '');
        }
        if (!email && account.email) setEmail(account.email);
        if (!nationalId && account.nationalId) setNationalId(account.nationalId);
        if (Array.isArray(account.addresses) && account.addresses.length > 0) {
          setSavedAddresses(account.addresses);
          const def = account.addresses.find((a) => a.isDefault) || account.addresses[0];
          if (def && !address) applySavedAddress(def);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Standard shipping fee driven by settings (free above threshold)
  const shippingFee = rawSubtotal > 2000000 ? 0 : 45000;

  const totalDiscount =
    discountAmount +
    cart.reduce((sum, item) => {
      const orig = item.product.originalPrice || item.unitPrice;
      return sum + Math.max(0, orig - item.unitPrice) * item.quantity;
    }, 0);

  const finalPayable = Math.max(0, rawSubtotal - discountAmount + shippingFee);

  const handleProceedToPayment = () => {
    if (!customerName.trim() || customerName.trim().length < 2) {
      setAddressError('لطفاً نام و نام خانوادگی تحویل‌گیرنده را بنویسید.');
      return;
    }
    if (containsProfanityOrAbuse(customerName)) {
      setAddressError('نام تحویل‌گیرنده حاوی عبارات نامناسب یا غیرمجاز است.');
      return;
    }
    const cleanPhone = normalizeIranianPhoneStrict(customerPhone);
    if (!isValidIranianPhoneStrict(cleanPhone)) {
      setAddressError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
      return;
    }
    const cleanEmail = email.trim();
    if (featureSettings.enableEmail && cleanEmail.length > 0 && !isValidEmail(cleanEmail)) {
      setAddressError('فرمت ایمیل واردشده معتبر نیست (مثال: name@example.com).');
      return;
    }
    const cleanNationalId = normalizeDigits(nationalId).replace(/[\s\-]/g, '');
    if (featureSettings.enableNationalId) {
      if (featureSettings.requireNationalId && !cleanNationalId) {
        setAddressError('وارد کردن کد ملی ۱۰ رقمی معتبر الزامی است.');
        return;
      }
      if (cleanNationalId.length > 0 && !isValidIranianNationalId(cleanNationalId)) {
        setAddressError('کد ملی باید ۱۰ رقم و منطبق بر الگوریتم صحت‌سنجی رسمی باشد.');
        return;
      }
    }
    if (!address.trim() || address.trim().length < 5) {
      setAddressError('لطفاً نشانی کامل تحویل سفارش را بنویسید.');
      return;
    }
    const cleanPostal = normalizeDigits(postalCode).replace(/[\s\-]/g, '');
    if (
      (featureSettings.requirePostalCode || cleanPostal.length > 0) &&
      !isValidIranianPostalCode(cleanPostal)
    ) {
      setAddressError('کد پستی باید ۱۰ رقم معتبر بدون خط تیره (غیرتکراری و بدون صفر یا ۲ در ابتدا) باشد.');
      return;
    }

    setAddressError(null);
    setStep('payment');
  };

  const handleCompleteOrder = async () => {
    if (isSubmittingOrder) return;
    setCheckoutError(null);
    setIsSubmittingOrder(true);

    const cleanPhone = normalizeIranianPhoneStrict(customerPhone) || customerPhone || '09120000000';
    const cleanEmail = email.trim().toLowerCase();
    const cleanNationalId = normalizeDigits(nationalId).replace(/[\s\-]/g, '');
    const cleanPostal = normalizeDigits(postalCode).replace(/[\s\-]/g, '');

    const requestItems = cart.map((i) => ({
      id: i.product.id,
      title: i.product.title,
      sku: i.product.sku,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unitCost: 0,
    }));

    try {
      const orderRes = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: requestItems,
          customer: {
            fullName: customerName,
            phone: cleanPhone,
            email: cleanEmail || undefined,
            nationalId: cleanNationalId || undefined,
            province,
            city,
            address,
            plaque: plaque || undefined,
            unit: unit || undefined,
            postalCode: cleanPostal || undefined,
          },
          discountAmount,
        }),
      });

      const orderResp = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderResp?.order) {
        setCheckoutError(orderResp?.error || 'ثبت سفارش در سرور با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
        return;
      }

      const persistedOrder = orderResp.order;
      const persistedId = persistedOrder.id || persistedOrder.orderNumber;

      const payRes = await fetch('/api/v1/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: persistedId,
          phone: cleanPhone,
          email: cleanEmail || undefined,
        }),
      });
      const payData = await payRes.json().catch(() => ({}));
      if (!payRes.ok || !payData?.session) {
        setCheckoutError(payData?.error || 'ایجاد نشست پرداخت ناموفق بود. لطفاً مجدداً اقدام کنید.');
        return;
      }

      const isLiveGateway = Boolean(payData.session.liveGateway && payData.session.gatewayUrl);
      const nextStatus: Order['status'] = isLiveGateway ? 'PENDING_PAYMENT' : 'PAID';

      const newOrder: Order = {
        id: persistedOrder.id,
        orderNumber: persistedOrder.orderNumber || persistedOrder.id,
        customerName: persistedOrder.customerName || customerName || 'مشتری گُردیه',
        customerPhone: cleanPhone,
        city,
        province,
        address: address || 'نشانی ثبت‌شده',
        items: requestItems,
        totalAmount: Number(persistedOrder.totalAmount ?? finalPayable),
        shippingCost: shippingFee,
        paymentFee: 0,
        discountAmount,
        supplierCost: 0,
        marketingAllocation: 0,
        contributionProfit: 0,
        marginPercent: 0,
        status: nextStatus,
        riskScore: Number(persistedOrder.riskScore ?? 10),
        routingSupplier: 'انبار مرکزی',
        shippingMethod: 'post',
        deliveryTimeSlot: 'morning',
        paymentMethod: 'gateway',
        trackingNumber: persistedOrder.trackingCode || persistedOrder.orderNumber,
        createdAt: persistedOrder.createdAt || new Date().toISOString(),
      };

      if (isValidIranianPhoneStrict(cleanPhone)) {
        setSavedSupportPhone(cleanPhone);
        const nextAddr: CustomerAddress = {
          id: selectedAddressId || `addr_${Date.now()}`,
          label: savedAddresses.find((a) => a.id === selectedAddressId)?.label || 'آخرین نشانی ارسال',
          recipientName: customerName.trim(),
          recipientPhone: cleanPhone,
          province,
          city,
          addressLine: address.trim(),
          postalCode: cleanPostal,
          plaque: plaque.trim() || undefined,
          unit: unit.trim() || undefined,
          isDefault: true,
        };
        const mergedAddresses = [
          nextAddr,
          ...savedAddresses
            .filter((a) => a.id !== nextAddr.id && a.postalCode !== cleanPostal)
            .map((a) => ({ ...a, isDefault: false })),
        ];
        void updateCustomerProfile(cleanPhone, {
          fullName: customerName.trim(),
          ...(cleanEmail ? { email: cleanEmail } : {}),
          ...(cleanNationalId ? { nationalId: cleanNationalId } : {}),
          ...(isValidIranianPostalCode(cleanPostal) ? { addresses: mergedAddresses } : {}),
        });
      }

      try {
        const existingOrders = JSON.parse(localStorage.getItem('commerce_os_orders') || '[]');
        localStorage.setItem('commerce_os_orders', JSON.stringify([newOrder, ...existingOrders]));
        localStorage.setItem(
          'commerce_os_last_customer',
          JSON.stringify({
            name: customerName,
            phone: cleanPhone,
            email: cleanEmail || undefined,
            nationalId: cleanNationalId || undefined,
            province,
            city,
            address,
            plaque,
            unit,
            postalCode: cleanPostal,
          })
        );
      } catch (e) {
        console.warn('Error saving order to localStorage:', e);
      }

      setCreatedOrder(newOrder);
      setIsSandboxReceipt(!isLiveGateway);
      setGatewayRedirectUrl(isLiveGateway ? payData.session.gatewayUrl : null);
      setStep('receipt');
      onOrderCompleted(newOrder);
      onClearCart();

      if (isLiveGateway && payData.session.gatewayUrl) {
        window.location.assign(payData.session.gatewayUrl);
      }
    } catch (e) {
      console.error('Error completing checkout:', e);
      setCheckoutError('خطا در برقراری ارتباط با سرور برای ثبت سفارش و انتقال به درگاه.');
    } finally {
      setIsSubmittingOrder(false);
    }
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
                            <div className="text-[var(--accent-primary)] tabular-nums font-bold pt-0.5 text-[13px]">
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
                            <span className="w-6 text-center tabular-nums font-bold text-xs text-[var(--text-main)]">
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
                      <span className="text-base font-bold text-[var(--accent-primary)] tabular-nums">
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
            {/* Quick-select saved addresses if user has any */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                  <MapPin className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>انتخاب سریع از آدرس‌های ذخیره‌شده حساب شما:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applySavedAddress(addr)}
                      className={`text-right p-2.5 rounded-xl border text-[11px] transition-colors cursor-pointer ${
                        selectedAddressId === addr.id
                          ? 'bg-[var(--badge-bg)] border-[var(--accent-primary)]'
                          : 'bg-[var(--bg-main)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                      }`}
                    >
                      <div className="font-bold text-[var(--text-main)] flex items-center justify-between gap-2">
                        <span>{addr.label}</span>
                        <span className="font-mono text-[10px] text-[var(--accent-primary)] tabular-nums">
                          {toPersianDigits(addr.postalCode)}
                        </span>
                      </div>
                      <div className="text-[var(--text-muted)] truncate mt-0.5">
                        {addr.province}، {addr.city} — {addr.addressLine}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                <label className="text-xs font-bold text-[var(--text-main)]">
                  شماره موبایل (نام کاربری و ارسال کد پیگیری):
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="09123456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none tabular-nums placeholder-[var(--text-muted)]"
                />
              </div>
            </div>

            {(featureSettings.enableEmail || featureSettings.enableNationalId) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featureSettings.enableEmail && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[var(--text-main)]">ایمیل (جهت ارسال رسید):</label>
                      {email.trim().length > 0 && (
                        <span
                          className={`text-[10px] font-bold ${
                            isValidEmail(email) ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isValidEmail(email) ? 'معتبر' : 'فرمت نامعتبر'}
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      dir="ltr"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-[var(--bg-main)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none placeholder-[var(--text-muted)] ${
                        email.trim().length > 0 && !isValidEmail(email)
                          ? 'border-rose-500'
                          : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                      }`}
                    />
                  </div>
                )}

                {featureSettings.enableNationalId && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[var(--text-main)]">
                        کد ملی {featureSettings.requireNationalId ? '(الزامی)' : '(اختیاری)'}:
                      </label>
                      {nationalId.trim().length > 0 && (
                        <span
                          className={`text-[10px] font-bold ${
                            isValidIranianNationalId(nationalId) ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isValidIranianNationalId(nationalId) ? 'کد ملی معتبر' : 'کد ملی نامعتبر'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={10}
                      placeholder="0012345678"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className={`w-full bg-[var(--bg-main)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none tabular-nums placeholder-[var(--text-muted)] ${
                        nationalId.trim().length > 0 && !isValidIranianNationalId(nationalId)
                          ? 'border-rose-500'
                          : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                      }`}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">استان:</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  {IRANIAN_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">پلاک:</label>
                <input
                  type="text"
                  placeholder="مثلاً ۱۲"
                  value={plaque}
                  onChange={(e) => setPlaque(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">واحد:</label>
                <input
                  type="text"
                  placeholder="مثلاً ۴"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">نشانی دقیق تحویل بسته:</label>
              <textarea
                rows={2}
                placeholder="خیابان، کوچه، جزئیات تکمیلی مسیر..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:border-[var(--accent-primary)] focus:outline-none leading-relaxed placeholder-[var(--text-muted)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-[var(--text-main)]">
                    کد پستی ۱۰ رقمی {featureSettings.requirePostalCode ? '(الزامی)' : ''}:
                  </label>
                  {postalCode.trim().length > 0 && (
                    <span
                      className={`text-[10px] font-bold ${
                        isValidIranianPostalCode(postalCode) ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {isValidIranianPostalCode(postalCode) ? 'معتبر' : '۱۰ رقم نامعتبر'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  maxLength={10}
                  placeholder="1983963113"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={`w-full bg-[var(--bg-main)] border rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] focus:outline-none tabular-nums placeholder-[var(--text-muted)] ${
                    postalCode.trim().length > 0 && !isValidIranianPostalCode(postalCode)
                      ? 'border-rose-500'
                      : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                  }`}
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
                <span className="text-xs tabular-nums font-bold text-[var(--accent-primary)]">
                  {shippingFee === 0 ? 'رایگان' : formatCurrency(shippingFee, currency)}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
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
                  <div className="text-xs font-bold text-[var(--text-main)]">
                    {featureSettings.paymentConfigured && featureSettings.paymentProvider !== 'sandbox'
                      ? `درگاه پرداخت شاپرک (${
                          featureSettings.paymentProvider === 'zarinpal'
                            ? 'زرین‌پال'
                            : featureSettings.paymentProvider === 'zibal'
                            ? 'زیبال'
                            : 'آیدی‌پی'
                        })`
                      : 'درگاه شاپرک (حالت آزمایشی / ثبت سفارش فوری)'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {featureSettings.paymentConfigured && featureSettings.paymentProvider !== 'sandbox'
                      ? 'بلافاصله پس از ثبت نهایی، تراکنش با شناسه مرجع امن به درگاه بانکی متصل می‌شود'
                      : 'بلافاصله بعد از ثبت، رسید و شماره سفارش با تایید تراکنش شبیه‌سازی‌شده برایتون ثبت می‌شه'}
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>

            {/* Total payable banner */}
            <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">مبلغ قابل پرداخت:</span>
              <span className="text-base font-bold text-[var(--accent-primary)] tabular-nums">
                {formatCurrency(finalPayable, currency)}
              </span>
            </div>

            {checkoutError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {checkoutError}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => setStep('address')}
                disabled={isSubmittingOrder}
                className="px-5 py-2.5 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-xs font-bold text-[var(--text-main)] border border-[var(--border-color)] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ویرایش آدرس</span>
              </button>

              <button
                onClick={() => void handleCompleteOrder()}
                disabled={isSubmittingOrder}
                className="px-7 py-3 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-bold text-[#F7F3EA] shadow-sm flex items-center gap-2 transition-colors cursor-pointer tabular-nums disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmittingOrder
                    ? 'در حال ثبت سفارش و اتصال به درگاه...'
                    : `پرداخت و ثبت نهایی (${formatCurrency(finalPayable, currency)})`}
                </span>
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
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                {gatewayRedirectUrl
                  ? 'سفارش ثبت شد؛ در حال انتقال به درگاه بانکی'
                  : isSandboxReceipt
                  ? 'سفارشتون در حالت آزمایشی ثبت شد'
                  : 'سفارشتون با موفقیت ثبت شد'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                کد پیگیری و اطلاعات سفارش برای شماره <span className="tabular-nums font-bold">{createdOrder.customerPhone}</span> ثبت شد.
              </p>
            </div>

            <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-4 text-xs space-y-2.5 text-right tabular-nums">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>شماره سفارش:</span>
                <span className="text-[var(--text-main)] font-bold font-mono">{createdOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>کد پیگیری ارسال:</span>
                <span className="text-[var(--text-main)] font-bold font-mono">{createdOrder.trackingNumber}</span>
              </div>
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>{gatewayRedirectUrl ? 'مبلغ قابل پرداخت:' : 'مبلغ سفارش:'}</span>
                <span className="text-[var(--accent-primary)] font-bold">{formatCurrency(createdOrder.totalAmount, currency)}</span>
              </div>
            </div>

            {gatewayRedirectUrl && (
              <a
                href={gatewayRedirectUrl}
                className="w-full py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>انتقال به صفحه پرداخت بانکی</span>
              </a>
            )}

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
