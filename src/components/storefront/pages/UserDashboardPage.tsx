import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Eye,
  ArrowRight,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Clock,
  MapPin,
  Mail,
  CreditCard,
  Send,
  Star,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { CanonicalProduct, Currency } from '../../../types';
import { formatCurrency } from '../../../utils';
import { SupportChatConversation } from '../SupportChatConversation';
import {
  CustomerAddress,
  DEFAULT_STORE_FEATURE_SETTINGS,
  IRANIAN_PROVINCES,
  StoreFeatureSettings,
  containsProfanityOrAbuse,
  isValidEmail,
  isValidIranianNationalId,
  isValidIranianPostalCode,
  normalizeDigits,
  validateSafePreferredName,
} from '../../../utils/iranianValidators';
import {
  CustomerAccount,
  SupportChatSession,
  SUPPORT_UPDATED_EVENT,
  createFreshSession,
  fetchAndMergeSessions,
  fetchStoreFeatureSettings,
  formatPersianDate,
  getCachedCustomerAccount,
  getLocalSessionsForPhone,
  getSavedSupportPhone,
  identifyCustomerAccount,
  isValidIranianPhone,
  normalizeIranianPhone,
  processConversationalTurn,
  requestOtpCode,
  saveSessionLocallyAndRemote,
  setSavedSupportPhone,
  stripChatMarkdown,
  toPersianDigits,
  updateCustomerProfile,
  verifyOtpCode,
} from '../../../utils/supportChatStore';

interface UserDashboardPageProps {
  products: CanonicalProduct[];
  currency: Currency;
  onSelectProduct: (product: CanonicalProduct) => void;
  onAddToCart: (product: CanonicalProduct) => void;
  onBackToHome: () => void;
  initialTab?: 'orders' | 'chats' | 'profile' | 'addresses' | 'privacy';
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  products,
  currency,
  onSelectProduct,
  onAddToCart,
  onBackToHome,
  initialTab = 'orders',
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'chats' | 'profile' | 'addresses' | 'privacy'>(
    initialTab
  );
  const [orderSubFilter, setOrderSubFilter] = useState<'all' | 'processing' | 'delivered' | 'cancelled'>('all');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [featureSettings, setFeatureSettings] = useState<StoreFeatureSettings>(
    DEFAULT_STORE_FEATURE_SETTINGS
  );

  const [customerProfile] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    nationalId?: string;
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('commerce_os_last_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persistent Support Chat & Customer Account State
  const [supportPhone, setSupportPhone] = useState<string>(() => getSavedSupportPhone());
  const [supportPhoneInput, setSupportPhoneInput] = useState<string>(() => getSavedSupportPhone());
  const [supportPhoneError, setSupportPhoneError] = useState<string>('');
  const [isEditingSupportPhone, setIsEditingSupportPhone] = useState<boolean>(false);
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() => {
    const p = getSavedSupportPhone();
    return p ? getCachedCustomerAccount(p) : null;
  });

  // Profile Form State
  const [preferredNameInput, setPreferredNameInput] = useState<string>(() => {
    const p = getSavedSupportPhone();
    return p ? getCachedCustomerAccount(p)?.preferredName || '' : '';
  });
  const [fullNameInput, setFullNameInput] = useState<string>(() => {
    const p = getSavedSupportPhone();
    return p ? getCachedCustomerAccount(p)?.fullName || '' : '';
  });
  const [emailInput, setEmailInput] = useState<string>(() => {
    const p = getSavedSupportPhone();
    return p ? getCachedCustomerAccount(p)?.email || '' : '';
  });
  const [nationalIdInput, setNationalIdInput] = useState<string>(() => {
    const p = getSavedSupportPhone();
    return p ? getCachedCustomerAccount(p)?.nationalId || '' : '';
  });
  const [profileError, setProfileError] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // OTP Upgrade Flow State
  const [otpPanelOpen, setOtpPanelOpen] = useState<boolean>(false);
  const [otpRequested, setOtpRequested] = useState<boolean>(false);
  const [otpCodeInput, setOtpCodeInput] = useState<string>('');
  const [otpSending, setOtpSending] = useState<boolean>(false);
  const [otpVerifying, setOtpVerifying] = useState<boolean>(false);
  const [otpFeedback, setOtpFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Address Book State
  const [addresses, setAddresses] = useState<CustomerAddress[]>(() => {
    const p = getSavedSupportPhone();
    return (p ? getCachedCustomerAccount(p)?.addresses : undefined) || [];
  });
  const [isAddressFormOpen, setIsAddressFormOpen] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState('خانه');
  const [addrRecipientName, setAddrRecipientName] = useState('');
  const [addrRecipientPhone, setAddrRecipientPhone] = useState('');
  const [addrProvince, setAddrProvince] = useState('تهران');
  const [addrCity, setAddrCity] = useState('تهران');
  const [addrLine, setAddrLine] = useState('');
  const [addrPlaque, setAddrPlaque] = useState('');
  const [addrUnit, setAddrUnit] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(true);
  const [addrFormError, setAddrFormError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [supportSessions, setSupportSessions] = useState<SupportChatSession[]>(() => {
    const p = getSavedSupportPhone();
    return p ? getLocalSessionsForPhone(p) : [];
  });
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>('');
  const [isLoadingChats, setIsLoadingChats] = useState<boolean>(false);
  const [isChatTyping, setIsChatTyping] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    void fetchStoreFeatureSettings().then(setFeatureSettings);
  }, []);

  const syncAccountToLocalForm = (account: CustomerAccount | null) => {
    if (!account) return;
    setCustomerAccount(account);
    if (account.preferredName !== undefined) setPreferredNameInput(account.preferredName || '');
    if (account.fullName !== undefined) setFullNameInput(account.fullName || '');
    if (account.email !== undefined) setEmailInput(account.email || '');
    if (account.nationalId !== undefined) setNationalIdInput(account.nationalId || '');
    if (Array.isArray(account.addresses)) setAddresses(account.addresses);
  };

  const loadChatsForPhone = async (phone: string) => {
    if (!isValidIranianPhone(phone)) return;
    setIsLoadingChats(true);
    try {
      const [{ account }, merged] = await Promise.all([
        identifyCustomerAccount(phone),
        fetchAndMergeSessions(phone),
      ]);
      syncAccountToLocalForm(account);
      if (merged.length > 0) {
        setSupportSessions(merged);
        setActiveChatSessionId((prev) =>
          prev && merged.some((s) => s.id === prev) ? prev : merged[0].id
        );
      } else {
        setSupportSessions([]);
        setActiveChatSessionId('');
      }
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    if (supportPhone && isValidIranianPhone(supportPhone)) {
      void loadChatsForPhone(supportPhone);
    }
  }, [supportPhone]);

  useEffect(() => {
    const onSync = () => {
      const saved = getSavedSupportPhone();
      if (saved && saved !== supportPhone && !isEditingSupportPhone) {
        setSupportPhone(saved);
        setSupportPhoneInput(saved);
      }
      if (saved) {
        const cachedAcc = getCachedCustomerAccount(saved);
        syncAccountToLocalForm(cachedAcc);
        const latest = getLocalSessionsForPhone(saved);
        setSupportSessions(latest);
        if (latest.length > 0) {
          setActiveChatSessionId((prev) =>
            prev && latest.some((s) => s.id === prev) ? prev : latest[0].id
          );
        }
      }
    };
    window.addEventListener(SUPPORT_UPDATED_EVENT, onSync);
    return () => window.removeEventListener(SUPPORT_UPDATED_EVENT, onSync);
  }, [supportPhone, isEditingSupportPhone]);

  const handleVerifySupportPhone = async (raw: string) => {
    const normalized = normalizeIranianPhone(raw);
    if (!isValidIranianPhone(normalized)) {
      setSupportPhoneError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
      return;
    }
    setSupportPhoneError('');
    setChatError('');
    setSavedSupportPhone(normalized);
    setSupportPhone(normalized);
    setSupportPhoneInput(normalized);
    setIsEditingSupportPhone(false);
    await loadChatsForPhone(normalized);
  };

  const handleStartNewPanelChat = async () => {
    if (!supportPhone) return;
    setChatError('');
    const account = customerAccount || getCachedCustomerAccount(supportPhone);
    const fresh = createFreshSession(supportPhone, account);
    const updated = await saveSessionLocallyAndRemote(fresh);
    setSupportSessions(updated);
    setActiveChatSessionId(fresh.id);
  };

  const handleSendOtpForAccount = async () => {
    const targetPhone = supportPhone || customerProfile?.phone || '';
    if (!isValidIranianPhone(targetPhone)) {
      setOtpFeedback({ ok: false, text: 'ابتدا شماره موبایل معتبر خود را ثبت کنید.' });
      return;
    }
    setOtpSending(true);
    setOtpFeedback(null);
    try {
      const res = await requestOtpCode(targetPhone);
      if (res.ok) {
        setOtpRequested(true);
        setOtpFeedback({
          ok: true,
          text: `کد تایید ۶ رقمی به شماره ${toPersianDigits(targetPhone)} ارسال شد.`,
        });
      } else {
        setOtpFeedback({
          ok: false,
          text:
            res.error ||
            'درگاه ارسال پیامک از پنل مدیریت پیکربندی نشده است؛ اطلاعات شما تا یک سال محفوظ می‌ماند.',
        });
      }
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAccountOtp = async () => {
    const targetPhone = supportPhone || customerProfile?.phone || '';
    const digits = normalizeDigits(otpCodeInput).replace(/\D/g, '');
    if (!digits || digits.length < 4) {
      setOtpFeedback({ ok: false, text: 'لطفاً کد تایید پیامکی دریافتی را وارد کنید.' });
      return;
    }
    setOtpVerifying(true);
    setOtpFeedback(null);
    try {
      const res = await verifyOtpCode(targetPhone, digits);
      if (res.ok && res.account) {
        syncAccountToLocalForm(res.account);
        setOtpPanelOpen(false);
        setOtpRequested(false);
        setOtpCodeInput('');
        showToast('حساب کاربری دائمی شما با نام کاربری شماره موبایل تایید و فعال شد.');
      } else {
        setOtpFeedback({ ok: false, text: res.error || 'کد تایید نادرست یا منقضی است.' });
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSaveProfile = async () => {
    const targetPhone = supportPhone || customerProfile?.phone || '';
    if (!isValidIranianPhone(targetPhone)) {
      showToast('ابتدا شماره موبایل (نام کاربری) خود را ثبت کنید.');
      return;
    }
    setProfileError('');
    const cleanPreferredRaw = preferredNameInput.trim();
    let finalPreferredName = cleanPreferredRaw;
    if (cleanPreferredRaw.length > 0) {
      const prefCheck = validateSafePreferredName(cleanPreferredRaw);
      if (!prefCheck.ok) {
        setProfileError(prefCheck.reason || 'نام دلخواه واردشده مجاز یا محترمانه نیست.');
        return;
      }
      finalPreferredName = prefCheck.cleaned;
    }

    const cleanFull = fullNameInput.trim();
    if (cleanFull.length > 0 && containsProfanityOrAbuse(cleanFull)) {
      setProfileError('نام و نام خانوادگی واردشده حاوی عبارات نامناسب یا غیرمجاز است.');
      return;
    }

    const cleanEmail = emailInput.trim();
    if (featureSettings.enableEmail && cleanEmail.length > 0 && !isValidEmail(cleanEmail)) {
      setProfileError('فرمت آدرس ایمیل واردشده معتبر نیست (مثال: ali@example.com).');
      return;
    }

    const cleanNationalId = normalizeDigits(nationalIdInput).replace(/[\s\-]/g, '');
    if (featureSettings.enableNationalId) {
      if (featureSettings.requireNationalId && !cleanNationalId) {
        setProfileError('تکمیل فیلد کد ملی طبق تنظیمات فروشگاه الزامی است.');
        return;
      }
      if (cleanNationalId.length > 0 && !isValidIranianNationalId(cleanNationalId)) {
        setProfileError('کد ملی باید ۱۰ رقم و مطابق الگوریتم رسمی صحت‌سنجی کد ملی ایران باشد.');
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const res = await updateCustomerProfile(targetPhone, {
        ...(finalPreferredName ? { preferredName: finalPreferredName } : {}),
        fullName: cleanFull,
        ...(featureSettings.enableEmail ? { email: cleanEmail } : {}),
        ...(featureSettings.enableNationalId ? { nationalId: cleanNationalId } : {}),
      });
      if (!res.ok) {
        setProfileError(res.error || 'خطا در ذخیره اطلاعات کاربری.');
        return;
      }
      if (res.account) {
        syncAccountToLocalForm(res.account);
      }
      showToast('مشخصات حساب کاربری با موفقیت در سرور ذخیره شد.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel('خانه');
    setAddrRecipientName(fullNameInput || preferredNameInput || customerProfile?.name || '');
    setAddrRecipientPhone(supportPhone || customerProfile?.phone || '');
    setAddrProvince('تهران');
    setAddrCity('تهران');
    setAddrLine('');
    setAddrPlaque('');
    setAddrUnit('');
    setAddrPostalCode('');
    setAddrIsDefault(addresses.length === 0);
    setAddrFormError('');
    setIsAddressFormOpen(true);
  };

  const openEditAddressForm = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrRecipientName(addr.recipientName);
    setAddrRecipientPhone(addr.recipientPhone);
    setAddrProvince(addr.province);
    setAddrCity(addr.city);
    setAddrLine(addr.addressLine);
    setAddrPlaque(addr.plaque || '');
    setAddrUnit(addr.unit || '');
    setAddrPostalCode(addr.postalCode);
    setAddrIsDefault(Boolean(addr.isDefault));
    setAddrFormError('');
    setIsAddressFormOpen(true);
  };

  const handleSaveAddress = async () => {
    const targetPhone = supportPhone || customerProfile?.phone || '';
    if (!isValidIranianPhone(targetPhone)) {
      setAddrFormError('ابتدا شماره موبایل (نام کاربری) خود را در حساب کاربری وارد کنید.');
      return;
    }
    if (addrRecipientName.trim().length < 2) {
      setAddrFormError('لطفاً نام و نام خانوادگی تحویل‌گیرنده را وارد کنید.');
      return;
    }
    const cleanRecPhone = normalizeIranianPhone(addrRecipientPhone);
    if (!isValidIranianPhone(cleanRecPhone)) {
      setAddrFormError('شماره موبایل تحویل‌گیرنده باید ۱۱ رقم معتبر باشد.');
      return;
    }
    if (addrLine.trim().length < 5) {
      setAddrFormError('لطفاً نشانی دقیق خیابان و کوچه را کامل‌تر وارد کنید.');
      return;
    }
    const cleanPostal = normalizeDigits(addrPostalCode).replace(/[\s\-]/g, '');
    if ((featureSettings.requirePostalCode || cleanPostal.length > 0) && !isValidIranianPostalCode(cleanPostal)) {
      setAddrFormError('کد پستی باید ۱۰ رقم معتبر بدون خط تیره (غیرتکراری و بدون صفر یا ۲ در ابتدا) باشد.');
      return;
    }

    const newItem: CustomerAddress = {
      id: editingAddressId || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: addrLabel.trim() || 'آدرس من',
      recipientName: addrRecipientName.trim(),
      recipientPhone: cleanRecPhone,
      province: addrProvince.trim() || 'تهران',
      city: addrCity.trim() || 'تهران',
      addressLine: addrLine.trim(),
      postalCode: cleanPostal,
      plaque: addrPlaque.trim() || undefined,
      unit: addrUnit.trim() || undefined,
      isDefault: addrIsDefault,
    };

    let nextList = editingAddressId
      ? addresses.map((a) => (a.id === editingAddressId ? newItem : a))
      : [newItem, ...addresses];

    if (newItem.isDefault) {
      nextList = nextList.map((a) => ({ ...a, isDefault: a.id === newItem.id }));
    } else if (!nextList.some((a) => a.isDefault) && nextList.length > 0) {
      nextList[0] = { ...nextList[0], isDefault: true };
    }

    setIsSavingAddress(true);
    setAddrFormError('');
    try {
      const res = await updateCustomerProfile(targetPhone, { addresses: nextList });
      if (!res.ok) {
        setAddrFormError(res.error || 'خطا در ذخیره آدرس.');
        return;
      }
      if (res.account) {
        syncAccountToLocalForm(res.account);
      } else {
        setAddresses(nextList);
      }
      setIsAddressFormOpen(false);
      showToast('آدرس در دفترچه آدرس‌های حساب کاربری ذخیره شد.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    const targetPhone = supportPhone || customerProfile?.phone || '';
    if (!isValidIranianPhone(targetPhone)) return;
    let nextList = addresses.filter((a) => a.id !== addrId);
    if (nextList.length > 0 && !nextList.some((a) => a.isDefault)) {
      nextList = [{ ...nextList[0], isDefault: true }, ...nextList.slice(1)];
    }
    const res = await updateCustomerProfile(targetPhone, { addresses: nextList });
    if (res.ok && res.account) {
      syncAccountToLocalForm(res.account);
      showToast('آدرس از دفترچه آدرس‌ها حذف شد.');
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    const targetPhone = supportPhone || customerProfile?.phone || '';
    if (!isValidIranianPhone(targetPhone)) return;
    const nextList = addresses.map((a) => ({ ...a, isDefault: a.id === addrId }));
    const res = await updateCustomerProfile(targetPhone, { addresses: nextList });
    if (res.ok && res.account) {
      syncAccountToLocalForm(res.account);
      showToast('آدرس پیش‌فرض تحویل بروزرسانی شد.');
    }
  };

  const activeChatSession: SupportChatSession | null =
    supportSessions.find((s) => s.id === activeChatSessionId) || supportSessions[0] || null;

  const handleSendPanelChatMessage = async (text: string) => {
    if (!supportPhone || !activeChatSession) return;
    setChatError('');
    setIsChatTyping(true);
    try {
      const result = await processConversationalTurn(activeChatSession, text, products);
      if (result.errorMessage) {
        setChatError(result.errorMessage);
        return;
      }
      const updated = await saveSessionLocallyAndRemote(result.updatedSession);
      setSupportSessions(updated);
      setActiveChatSessionId(result.updatedSession.id);
    } finally {
      setIsChatTyping(false);
    }
  };

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
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[var(--text-main)] leading-[1.5]">
                  {customerAccount?.preferredName
                    ? `سلام ${customerAccount.preferredName} عزیز!`
                    : customerProfile?.name
                    ? `سلام ${customerProfile.name} عزیز!`
                    : 'حساب کاربری و سفارش‌های شما'}
                </h1>
                {supportPhone && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      customerAccount?.isVerified
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {customerAccount?.isVerified
                      ? 'حساب دائمی تاییدشده با پیامک'
                      : `حساب موقت • محفوظ تا یک سال (${formatPersianDate(customerAccount?.expiresAt)})`}
                  </span>
                )}
              </div>
              <div className="text-xs text-[var(--text-secondary)] leading-[1.8]">
                {supportPhone
                  ? `نام کاربری شما: ${toPersianDigits(supportPhone)} — تمام گفتگوها، آدرس‌ها و سفارش‌ها با استانداردهای حفاظتی ذخیره می‌شن.`
                  : 'شماره موبایل شما به‌عنوان نام کاربری ثبت شده و گفتگوها و نشانی‌ها با امنیت کامل نگهداری می‌شن.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {supportPhone && !customerAccount?.isVerified && (
              <button
                type="button"
                onClick={() => setOtpPanelOpen((prev) => !prev)}
                className="px-4 py-2.5 rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>تایید پیامکی و ساخت حساب دائمی</span>
              </button>
            )}

            {/* Quick Order Stats */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] min-w-[140px]">
              <div className="text-[11px] text-[var(--text-muted)]">سفارش‌های ثبت‌شده:</div>
              <div className="text-sm font-bold text-[var(--accent-primary)] tabular-nums mt-0.5">
                {toPersianDigits(orders.length)} سفارش
              </div>
            </div>
          </div>
        </div>

        {/* Inline OTP Upgrade Box */}
        {otpPanelOpen && supportPhone && !customerAccount?.isVerified && (
          <div className="p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--accent-primary)]/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-[var(--text-main)]">
                ارسال کد تایید پیامکی برای نام کاربری{' '}
                <span className="font-mono tabular-nums" dir="ltr">
                  {toPersianDigits(supportPhone)}
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                بدون تایید پیامکی، اطلاعات اسم و شماره شما تا یک سال محفوظ می‌ماند.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                disabled={otpSending}
                onClick={() => void handleSendOtpForAccount()}
                className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 text-[#F7F3EA] text-xs font-bold cursor-pointer shrink-0"
              >
                {otpSending ? 'در حال ارسال...' : otpRequested ? 'ارسال مجدد کد' : 'ارسال کد پیامکی'}
              </button>

              {otpRequested && (
                <>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={8}
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                    placeholder="کد ۶ رقمی"
                    className="sm:w-44 px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-xs font-bold text-center tabular-nums text-[var(--text-main)] outline-none"
                  />
                  <button
                    type="button"
                    disabled={otpVerifying}
                    onClick={() => void handleVerifyAccountOtp()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    {otpVerifying ? 'در حال بررسی...' : 'تایید و ساخت حساب دائمی'}
                  </button>
                </>
              )}
            </div>

            {otpFeedback && (
              <div
                className={`text-xs font-medium ${
                  otpFeedback.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                }`}
              >
                {otpFeedback.text}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Layout: 3-column Sidebar & 9-column Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1 h-fit shadow-md">
          <button
            onClick={() => {
              setActiveTab('orders');
              setSelectedOrderDetail(null);
            }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              <span>سفارش‌های من</span>
            </div>
            <span className="tabular-nums text-[11px] opacity-80">{toPersianDigits(orders.length)}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('chats');
              setSelectedOrderDetail(null);
            }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              activeTab === 'chats'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>چت‌ها و تاریخچه پشتیبانی</span>
            </div>
            <span className="tabular-nums text-[11px] opacity-80">
              {toPersianDigits(supportSessions.length)}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('addresses');
              setSelectedOrderDetail(null);
            }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              activeTab === 'addresses'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4" />
              <span>دفترچه آدرس‌ها و کد پستی</span>
            </div>
            <span className="tabular-nums text-[11px] opacity-80">
              {toPersianDigits(addresses.length)}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile');
              setSelectedOrderDetail(null);
            }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4" />
              <span>مشخصات حساب کاربری</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('privacy');
              setSelectedOrderDetail(null);
            }}
            className={`w-full p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[var(--accent-primary)] text-white shadow'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4" />
              <span>حفاظت از داده‌ها و حریم خصوصی</span>
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
                          <span className="font-bold text-[var(--text-main)]">سفارش <span className="font-mono">{order.orderNumber}</span></span>
                          <span className="opacity-40">•</span>
                          <span className="text-[var(--text-muted)] tabular-nums">{order.date}</span>
                        </div>
                        <span className="text-[var(--accent-primary)] font-bold tabular-nums">
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
                          <span className="text-[var(--text-muted)] tabular-nums">({item.quantity || item.count || 1} عدد)</span>
                        </div>
                        <span className="text-[var(--accent-primary)] tabular-nums font-bold">
                          {formatCurrency(item.unitPrice || item.price || 0, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1.5: SUPPORT CHATS & PERSISTENT HISTORY */}
          {activeTab === 'chats' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-sm flex flex-col">
              {/* Header Bar */}
              <div className="px-5 py-4 bg-[var(--bg-card)]/70 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-5 h-5 text-[var(--accent-primary)]" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)]">چت‌ها و تاریخچه پشتیبانی</h3>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {supportPhone && !isEditingSupportPhone
                        ? `متصل به شماره ${toPersianDigits(supportPhone)} • ذخیره دائمی و ادامه مستقیم چت`
                        : 'شماره موبایل خود را وارد کنید تا تاریخچه گفتگوها نمایش داده شود'}
                    </div>
                  </div>
                </div>

                {supportPhone && !isEditingSupportPhone && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void loadChatsForPhone(supportPhone)}
                      disabled={isLoadingChats}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChats ? 'animate-spin' : ''}`} />
                      <span>بروزرسانی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSupportPhoneInput(supportPhone);
                        setIsEditingSupportPhone(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      تغییر شماره
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStartNewPanelChat()}
                      className="px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>گفتگوی جدید</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Phone Gate Inside Panel (if no verified phone yet or changing) */}
              {!supportPhone || !isValidIranianPhone(supportPhone) || isEditingSupportPhone ? (
                <div className="p-8 max-w-md mx-auto w-full space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--badge-bg)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--accent-primary)]">
                    <Phone className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    ورود به حساب کاربری و تاریخچه گفتگوها
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-[1.8]">
                    با وارد کردن شماره موبایل، حساب کاربری شما ساخته یا بازیابی می‌شه و تمام گفتگوهای پشتیبانی ذخیره می‌شن.
                  </p>
                  <div className="space-y-2.5 text-right">
                    <input
                      type="tel"
                      dir="ltr"
                      value={supportPhoneInput}
                      onChange={(e) => {
                        setSupportPhoneInput(e.target.value);
                        if (supportPhoneError) setSupportPhoneError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          void handleVerifySupportPhone(supportPhoneInput);
                        }
                      }}
                      placeholder="09123456789"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-[var(--accent-primary)] text-sm font-bold text-center tabular-nums text-[var(--text-main)] outline-none"
                    />
                    {supportPhoneError && (
                      <div className="text-[11px] text-rose-500 font-bold">{supportPhoneError}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleVerifySupportPhone(supportPhoneInput)}
                      className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold cursor-pointer"
                    >
                      نمایش تاریخچه چت‌ها
                    </button>
                    {isEditingSupportPhone && supportPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingSupportPhone(false);
                          setSupportPhoneError('');
                        }}
                        className="w-full py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                      >
                        انصراف
                      </button>
                    )}
                  </div>
                </div>
              ) : supportSessions.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--accent-primary)]">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">
                    هنوز گفتگویی برای این شماره ذخیره نشده است
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-[1.8]">
                    همین الان می‌تونید اولین گفتگوی خودتون رو شروع کنید و با تایپ «/» از دستورهای هوشمند استفاده کنید.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleStartNewPanelChat()}
                    className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>شروع گفتگوی جدید</span>
                  </button>
                </div>
              ) : (
                /* Two-Pane Persistent History & Interactive Chatbot Inside Panel */
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
                  {/* Saved Conversations List (4 cols) */}
                  <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-l border-[var(--border-color)] bg-[var(--bg-card)]/40 p-3 space-y-2 max-h-[260px] lg:max-h-[560px] overflow-y-auto">
                    {supportSessions.map((sess) => {
                      const isSelected = sess.id === activeChatSession?.id;
                      const lastMsg = sess.messages[sess.messages.length - 1];
                      return (
                        <button
                          key={sess.id}
                          type="button"
                          onClick={() => setActiveChatSessionId(sess.id)}
                          className={`w-full text-right p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                            isSelected
                              ? 'bg-[var(--badge-bg)] border-[var(--accent-primary)] shadow-sm'
                              : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--accent-primary)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--text-main)] truncate">
                              {sess.title}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(sess.updatedAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          {lastMsg && (
                            <div className="text-[11px] text-[var(--text-muted)] truncate">
                              {stripChatMarkdown(lastMsg.text)}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-[var(--text-muted)] tabular-nums">
                              {toPersianDigits(sess.messages.length)} پیام
                            </span>
                            {sess.status === 'OPERATOR_REQUESTED' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold">
                                ارجاع به اپراتور
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Chat Transcript & Slash-Command Composer (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col h-[540px] lg:h-[560px]">
                    {activeChatSession && (
                      <SupportChatConversation
                        session={activeChatSession}
                        products={products}
                        currency={currency}
                        isTyping={isChatTyping}
                        errorMessage={chatError}
                        onSendMessage={handleSendPanelChatMessage}
                        onSelectProduct={onSelectProduct}
                        onAddToCart={onAddToCart}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE WITH VALIDATED EMAIL & ADMIN-TOGGLED NATIONAL ID */}
          {activeTab === 'profile' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[var(--accent-primary)]" />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">مشخصات حساب کاربری</h3>
                </div>
                {supportPhone && (
                  <span className="text-xs text-[var(--text-muted)]">
                    نام کاربری:{' '}
                    <span className="font-mono font-bold text-[var(--text-main)] tabular-nums" dir="ltr">
                      {toPersianDigits(supportPhone)}
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Preferred Name */}
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[var(--text-main)] block font-bold">
                      نام دلخواه در گفتگوها (چی صداتون کنیم؟)
                    </label>
                    {preferredNameInput.trim().length > 0 && (
                      <span
                        className={`text-[11px] font-bold ${
                          validateSafePreferredName(preferredNameInput).ok
                            ? 'text-emerald-600'
                            : 'text-rose-500'
                        }`}
                      >
                        {validateSafePreferredName(preferredNameInput).ok
                          ? 'مناسب و مجاز'
                          : 'نام غیرمجاز / نامعتبر'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={preferredNameInput}
                    onChange={(e) => {
                      setPreferredNameInput(e.target.value);
                      if (profileError) setProfileError('');
                    }}
                    placeholder="مثلاً: علی، سارا یا جناب رضایی"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-xs font-bold text-[var(--text-main)] outline-none ${
                      preferredNameInput.trim().length > 0 &&
                      !validateSafePreferredName(preferredNameInput).ok
                        ? 'border-rose-500'
                        : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                    }`}
                  />
                </div>

                {/* Full Legal Name */}
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[var(--text-main)] block font-bold">
                      نام و نام خانوادگی (جهت صدور فاکتور و ارسال)
                    </label>
                    {fullNameInput.trim().length > 0 && containsProfanityOrAbuse(fullNameInput) && (
                      <span className="text-[11px] font-bold text-rose-500">عبارت غیرمجاز</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => {
                      setFullNameInput(e.target.value);
                      if (profileError) setProfileError('');
                    }}
                    placeholder="مثلاً: علیرضا محمدی"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-xs font-bold text-[var(--text-main)] outline-none ${
                      fullNameInput.trim().length > 0 && containsProfanityOrAbuse(fullNameInput)
                        ? 'border-rose-500'
                        : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                    }`}
                  />
                </div>

                {/* Email with Live Validation */}
                {featureSettings.enableEmail && (
                  <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[var(--text-main)] font-bold flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>ایمیل (با صحت‌سنجی فرمت)</span>
                      </label>
                      {emailInput.trim().length > 0 && (
                        <span
                          className={`text-[11px] font-bold ${
                            isValidEmail(emailInput) ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isValidEmail(emailInput) ? 'ایمیل معتبر است' : 'فرمت ایمیل نادرست است'}
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      dir="ltr"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        if (profileError) setProfileError('');
                      }}
                      placeholder="name@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-xs font-bold text-[var(--text-main)] outline-none ${
                        emailInput.trim().length > 0 && !isValidEmail(emailInput)
                          ? 'border-rose-500'
                          : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                      }`}
                    />
                  </div>
                )}

                {/* Conditional National ID Field controlled by Admin Panel Toggle */}
                {featureSettings.enableNationalId && (
                  <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[var(--text-main)] font-bold flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>
                          کد ملی {featureSettings.requireNationalId ? '(الزامی)' : '(اختیاری)'}
                        </span>
                      </label>
                      {nationalIdInput.trim().length > 0 && (
                        <span
                          className={`text-[11px] font-bold ${
                            isValidIranianNationalId(nationalIdInput)
                              ? 'text-emerald-600'
                              : 'text-rose-500'
                          }`}
                        >
                          {isValidIranianNationalId(nationalIdInput)
                            ? 'کد ملی معتبر است'
                            : 'کد ملی ۱۰ رقمی معتبر نیست'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={10}
                      value={nationalIdInput}
                      onChange={(e) => {
                        setNationalIdInput(e.target.value);
                        if (profileError) setProfileError('');
                      }}
                      placeholder="0012345678"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] border text-xs font-bold tabular-nums text-[var(--text-main)] outline-none ${
                        nationalIdInput.trim().length > 0 &&
                        !isValidIranianNationalId(nationalIdInput)
                          ? 'border-rose-500'
                          : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                      }`}
                    />
                  </div>
                )}

                {/* Username & Account Retention Status */}
                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <span className="text-[var(--text-muted)]">نام کاربری (شماره موبایل):</span>
                  <div className="text-[var(--text-main)] tabular-nums font-bold" dir="ltr">
                    {supportPhone
                      ? toPersianDigits(supportPhone)
                      : customerProfile?.phone
                      ? toPersianDigits(customerProfile.phone)
                      : 'ثبت‌نشده'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1">
                  <span className="text-[var(--text-muted)]">وضعیت حساب کاربری:</span>
                  <div className="text-[var(--text-main)] font-bold">
                    {customerAccount?.isVerified
                      ? 'دائمی (احراز هویت پیامکی انجام شده)'
                      : `موقت (نگهداری اسم و شماره تا ${formatPersianDate(customerAccount?.expiresAt)})`}
                  </div>
                </div>
              </div>

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {supportPhone && !customerAccount?.isVerified && (
                  <button
                    type="button"
                    onClick={() => setOtpPanelOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تایید حساب با پیامک</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSavingProfile}
                  onClick={() => void handleSaveProfile()}
                  className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 text-[#F7F3EA] text-xs font-bold cursor-pointer mr-auto shadow-sm"
                >
                  {isSavingProfile ? 'در حال ذخیره...' : 'ذخیره مشخصات حساب کاربری'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2.5: SAVED ADDRESSES BOOK & POSTAL CODE VALIDATION */}
          {activeTab === 'addresses' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--accent-primary)]" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)]">دفترچه آدرس‌ها و کد پستی</h3>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      ثبت نشانی دقیق همراه با کد پستی ۱۰ رقمی برای ارسال سریع‌تر سفارش‌ها
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openNewAddressForm}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن آدرس جدید</span>
                </button>
              </div>

              {isAddressFormOpen && (
                <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--accent-primary)]/40 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                    <h4 className="font-bold text-[var(--text-main)]">
                      {editingAddressId ? 'ویرایش آدرس' : 'ثبت آدرس جدید تحویل سفارش'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddressFormOpen(false)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">عنوان آدرس</label>
                      <input
                        type="text"
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="مثلاً خانه یا محل کار"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">نام تحویل‌گیرنده</label>
                      <input
                        type="text"
                        value={addrRecipientName}
                        onChange={(e) => setAddrRecipientName(e.target.value)}
                        placeholder="نام و نام خانوادگی"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">موبایل تحویل‌گیرنده</label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={addrRecipientPhone}
                        onChange={(e) => setAddrRecipientPhone(e.target.value)}
                        placeholder="09123456789"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] tabular-nums text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">استان</label>
                      <select
                        value={addrProvince}
                        onChange={(e) => setAddrProvince(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      >
                        {IRANIAN_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">شهر</label>
                      <input
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">پلاک</label>
                      <input
                        type="text"
                        value={addrPlaque}
                        onChange={(e) => setAddrPlaque(e.target.value)}
                        placeholder="مثلاً ۱۲"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">واحد</label>
                      <input
                        type="text"
                        value={addrUnit}
                        onChange={(e) => setAddrUnit(e.target.value)}
                        placeholder="مثلاً ۴"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-[var(--text-main)] block">نشانی کامل (خیابان و کوچه)</label>
                      <input
                        type="text"
                        value={addrLine}
                        onChange={(e) => setAddrLine(e.target.value)}
                        placeholder="خیابان، کوچه، جزئیات تکمیلی مسیر"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <label className="font-bold text-[var(--text-main)]">کد پستی ۱۰ رقمی</label>
                        {addrPostalCode.trim().length > 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              isValidIranianPostalCode(addrPostalCode)
                                ? 'text-emerald-600'
                                : 'text-rose-500'
                            }`}
                          >
                            {isValidIranianPostalCode(addrPostalCode) ? 'معتبر' : 'نامعتبر'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={10}
                        value={addrPostalCode}
                        onChange={(e) => setAddrPostalCode(e.target.value)}
                        placeholder="1983963113"
                        className={`w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border tabular-nums text-[var(--text-main)] outline-none ${
                          addrPostalCode.trim().length > 0 &&
                          !isValidIranianPostalCode(addrPostalCode)
                            ? 'border-rose-500'
                            : 'border-[var(--border-color)] focus:border-[var(--accent-primary)]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="addrDefaultCheck"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent-primary)]"
                    />
                    <label htmlFor="addrDefaultCheck" className="cursor-pointer font-medium">
                      تنظیم به‌عنوان آدرس پیش‌فرض در مرحله تسویه حساب
                    </label>
                  </div>

                  {addrFormError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                      {addrFormError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddressFormOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs font-bold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      disabled={isSavingAddress}
                      onClick={() => void handleSaveAddress()}
                      className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:opacity-50 text-[#F7F3EA] text-xs font-bold cursor-pointer"
                    >
                      {isSavingAddress ? 'در حال ذخیره...' : 'ذخیره آدرس'}
                    </button>
                  </div>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--accent-primary)]">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-main)]">هنوز آدرسی ذخیره نشده است</h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-[1.8]">
                    با ثبت نشانی و کد پستی ۱۰ رقمی در این بخش، در زمان خرید تنها با یک کلیک آدرس تحویل را انتخاب می‌کنید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl bg-[var(--bg-main)] border space-y-2.5 ${
                        addr.isDefault ? 'border-[var(--accent-primary)] shadow-sm' : 'border-[var(--border-color)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-[var(--text-main)]">
                          <MapPin className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                          <span>{addr.label}</span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--badge-bg)] text-[var(--accent-primary)] text-[10px]">
                              پیش‌فرض
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => void handleSetDefaultAddress(addr.id)}
                              title="تنظیم به‌عنوان پیش‌فرض"
                              className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddressForm(addr)}
                            title="ویرایش آدرس"
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteAddress(addr.id)}
                            title="حذف آدرس"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[var(--text-secondary)] leading-[1.8]">
                        {addr.province}، {addr.city} — {addr.addressLine}
                        {addr.plaque ? `، پلاک ${toPersianDigits(addr.plaque)}` : ''}
                        {addr.unit ? `، واحد ${toPersianDigits(addr.unit)}` : ''}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                        <span>
                          تحویل‌گیرنده: <strong className="text-[var(--text-main)]">{addr.recipientName}</strong> (
                          <span dir="ltr" className="tabular-nums">
                            {toPersianDigits(addr.recipientPhone)}
                          </span>
                          )
                        </span>
                        <span className="font-mono tabular-nums font-bold text-[var(--accent-primary)]">
                          کد پستی: {toPersianDigits(addr.postalCode)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRIVACY & DATA RIGHTS */}
          {activeTab === 'privacy' && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-6 shadow-md">
              <div className="flex items-center gap-2 pb-4 border-b border-[var(--border-color)]">
                <ShieldCheck className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">حفاظت از داده‌ها و حریم خصوصی</h3>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2 text-xs text-[var(--text-main)]">
                <div className="flex items-center gap-2 text-[var(--text-main)] font-bold">
                  <Lock className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>حاکمیت کاربر بر داده‌های شخصی</span>
                </div>
                <p className="leading-relaxed text-[var(--text-muted)]">
                  شماره موبایل، نشانی، کد ملی و گفتگوهای شما با استاندارد امنیتی AES-256 رمزنگاری و نگهداری می‌شن. برای حساب‌های بدون تایید پیامکی، نام و شماره فقط تا یک سال محفوظ می‌ماند و در هر زمان می‌توانید نسخه کامل داده‌ها را دریافت یا پاکسازی کنید.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => showToast('نسخه خروجی داده‌های شخصی شما آماده دریافت شد.')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] text-xs font-bold flex items-center gap-2 transition-colors border border-[var(--border-color)] cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span>دانلود نسخه کامل داده‌های شخصی من (JSON)</span>
                </button>
                <button
                  onClick={() => showToast('حافظه محلی و سابقه مرورگر شما پاکسازی شد.')}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-rose-500 text-xs font-bold flex items-center gap-2 transition-colors border border-[var(--border-color)] cursor-pointer"
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
