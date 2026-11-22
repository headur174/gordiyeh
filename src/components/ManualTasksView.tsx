import React, { useState } from 'react';
import { ManualTask, ManualTaskCategory, ManualTaskPriority, ManualTaskStatus } from '../types';
import { 
  CreditCard, 
  MessageSquare, 
  PhoneCall, 
  FileText, 
  PackageCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  ShieldAlert, 
  Send,
  Building2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface ManualTasksViewProps {
  tasks: ManualTask[];
  onCompleteTask: (id: string, note?: string) => void;
  onCancelTask: (id: string) => void;
  onAddTask: (task: Omit<ManualTask, 'id' | 'createdAt' | 'status'>) => void;
}

export const ManualTasksView: React.FC<ManualTasksViewProps> = ({
  tasks,
  onCompleteTask,
  onCancelTask,
  onAddTask,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Task Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<ManualTaskCategory>('CARD_TO_CARD');
  const [newTaskPriority, setNewTaskPriority] = useState<ManualTaskPriority>('HIGH');
  const [newTaskCustomer, setNewTaskCustomer] = useState('');
  const [newTaskPhone, setNewTaskPhone] = useState('');
  const [newTaskAmount, setNewTaskAmount] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAction, setNewTaskAction] = useState('');
  const [newTaskTemplate, setNewTaskTemplate] = useState('');

  // Store's official banking details for quick copy-pasting to customers during network disruptions
  const storeBankDetails = {
    bank: 'بانک پاسارگاد / سامان',
    cardNumber: '۵۰۲۲-۲۹۱۰-۸۴۷۵-۳۳۱۹',
    shaba: 'IR840570029180001928374001',
    accountHolder: 'فروشگاه بازرگانی آنلاین تجارت (حساب شرکتی شاپرک)'
  };
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyBankDetails = () => {
    const text = `شماره کارت جهت واریز:\n${storeBankDetails.cardNumber}\n${storeBankDetails.bank} - به نام: ${storeBankDetails.accountHolder}\nشماره شبا: ${storeBankDetails.shaba}\nلطفاً پس از واریز، شماره پیگیری یا تصویر فیش را ارسال نمایید.`;
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle,
      category: newTaskCategory,
      priority: newTaskPriority,
      customerName: newTaskCustomer.trim() || undefined,
      customerPhone: newTaskPhone.trim() || undefined,
      amount: newTaskAmount ? parseInt(newTaskAmount.replace(/\D/g, ''), 10) : undefined,
      description: newTaskDesc || 'ثبت دستی در زمان اختلال شبکه',
      actionRequired: newTaskAction || 'بررسی دستی و تایید ناظر',
      templateText: newTaskTemplate || undefined,
    });

    // Reset
    setNewTaskTitle('');
    setNewTaskCustomer('');
    setNewTaskPhone('');
    setNewTaskAmount('');
    setNewTaskDesc('');
    setNewTaskAction('');
    setNewTaskTemplate('');
    setIsAddModalOpen(false);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      t.title.toLowerCase().includes(q) ||
      (t.orderNumber && t.orderNumber.toLowerCase().includes(q)) ||
      (t.customerName && t.customerName.toLowerCase().includes(q)) ||
      (t.customerPhone && t.customerPhone.includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const pendingCount = tasks.filter(t => t.status === 'PENDING').length;
  const criticalCount = tasks.filter(t => t.status === 'PENDING' && t.priority === 'CRITICAL').length;
  const c2cCount = tasks.filter(t => t.status === 'PENDING' && t.category === 'CARD_TO_CARD').length;
  const smsCount = tasks.filter(t => t.status === 'PENDING' && t.category === 'SMS_DISPATCH').length;
  const supplierCallCount = tasks.filter(t => t.status === 'PENDING' && t.category === 'SUPPLIER_CALL').length;

  const getCategoryIcon = (cat: ManualTaskCategory) => {
    switch (cat) {
      case 'CARD_TO_CARD': return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'SMS_DISPATCH': return <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'SUPPLIER_CALL': return <PhoneCall className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'OFFLINE_INVOICE': return <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'OFFLINE_ORDER_SYNC': return <PackageCheck className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    }
  };

  const getCategoryTitle = (cat: ManualTaskCategory) => {
    switch (cat) {
      case 'CARD_TO_CARD': return 'تایید کارت‌به‌کارت (شاپرک)';
      case 'SMS_DISPATCH': return 'ارسال دستی پیامک/بله/ایتا';
      case 'SUPPLIER_CALL': return 'استعلام تلفنی تامین‌کننده';
      case 'OFFLINE_INVOICE': return 'فاکتور رسمی سامانه مودیان';
      case 'OFFLINE_ORDER_SYNC': return 'تایید سفارشات آفلاین';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Sovereign Explanation */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Iran Resilience Operations Engine</span>
              </span>
              <span className="text-xs text-[var(--text-muted)]">| تضمین صفر درصد قطعی فروش در شرایط اختلال شبکه</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)] flex flex-wrap items-center gap-2">
              <span>📋 صف کارهای دستی و جایگزین</span>
              <span className="text-xs sm:text-sm font-normal text-[var(--text-muted)]">(Manual Fallback Tasks Queue)</span>
            </h1>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-3xl">
              هنگامی که اینترنت بین‌الملل، وب‌سرویس‌های درگاه بانکی شاپرک، کراولرهای آنلاین یا پنل‌های پیامکی دچار اختلال یا قطعی می‌شوند، سیستم به طور خودکار اقدامات وابسته را به این صف هدایت می‌کند تا پرسنل فروشگاه بدون وقفه سفارشات را پردازش کنند.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            <button
              onClick={handleCopyBankDetails}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--text-main)] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="کپی شماره کارت و شبا برای ارسال به مشتری"
            >
              {copiedBankInfo ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Building2 className="w-4 h-4 text-[var(--accent-text)]" />}
              <span>{copiedBankInfo ? 'کپی شد!' : 'کپی حساب بانکی واریز'}</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت کار دستی جدید</span>
            </button>
          </div>
        </div>

        {/* Real-time Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--border-color)]">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-xl flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">کارهای در انتظار اقدام</div>
              <div className="text-xl font-black text-[var(--text-main)]">{pendingCount}</div>
            </div>
            <Clock className="w-7 h-7 text-[var(--accent-text)] opacity-60 shrink-0" />
          </div>

          <div className="bg-[var(--bg-card)] border border-amber-500/35 p-3 rounded-xl flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300">موارد بحرانی و فوری</div>
              <div className="text-xl font-black text-amber-700 dark:text-amber-400">{criticalCount}</div>
            </div>
            <AlertTriangle className="w-7 h-7 text-amber-600/60 dark:text-amber-400/50 shrink-0" />
          </div>

          <div className="bg-[var(--bg-card)] border border-emerald-500/35 p-3 rounded-xl flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300">تایید فیش کارت‌به‌کارت</div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{c2cCount}</div>
            </div>
            <CreditCard className="w-7 h-7 text-emerald-600/60 dark:text-emerald-400/50 shrink-0" />
          </div>

          <div className="bg-[var(--bg-card)] border border-sky-500/35 p-3 rounded-xl flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-sky-800 dark:text-sky-300">پیامک و استعلام تلفنی</div>
              <div className="text-xl font-black text-sky-700 dark:text-sky-400">{smsCount + supplierCallCount}</div>
            </div>
            <MessageSquare className="w-7 h-7 text-sky-600/60 dark:text-sky-400/50 shrink-0" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'ALL', label: 'همه دسته‌ها' },
            { id: 'CARD_TO_CARD', label: '💳 کارت‌به‌کارت' },
            { id: 'SMS_DISPATCH', label: '💬 پیامک و بومی' },
            { id: 'SUPPLIER_CALL', label: '📞 تماس تامین‌کننده' },
            { id: 'OFFLINE_ORDER_SYNC', label: '📦 سفارشات آفلاین' },
            { id: 'OFFLINE_INVOICE', label: '📄 فاکتور مودیان' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA] shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Toggle & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => setSelectedStatus('PENDING')}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              در انتظار ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('COMPLETED')}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              انجام شده
            </button>
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === 'ALL'
                  ? 'bg-[var(--accent-primary)] text-[#F7F3EA]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              همه ({tasks.length})
            </button>
          </div>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در وظایف..."
              className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl pr-8 pl-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600/50 dark:text-emerald-400/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[var(--text-main)]">هیچ وظیفه‌ای در این دسته‌بندی یافت نشد</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">کلیه کارهای دستی با موفقیت انجام شده یا فیلترهای جاری منطبق نیستند.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';
            const isCritical = task.priority === 'CRITICAL';

            return (
              <div
                key={task.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all bg-[var(--bg-surface)] ${
                  isCompleted
                    ? 'border-[var(--border-color)] opacity-70'
                    : isCritical
                    ? 'border-amber-500/50 shadow-sm'
                    : 'border-[var(--border-color)] hover:border-[var(--border-active)]'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left (Main info in RTL) */}
                  <div className="space-y-2 flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)]">
                        {getCategoryIcon(task.category)}
                        <span>{getCategoryTitle(task.category)}</span>
                      </span>

                      {task.priority === 'CRITICAL' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/35 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                          بحرانی / فوری
                        </span>
                      )}

                      {task.priority === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35">
                          اولویت بالا
                        </span>
                      )}

                      {task.orderNumber && (
                        <span className="text-xs font-mono font-bold text-[var(--accent-text)] bg-[var(--accent-soft)] px-2 py-0.5 rounded border border-[var(--border-active)]">
                          {task.orderNumber}
                        </span>
                      )}

                      <span className="text-xs text-[var(--text-muted)] mr-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{task.createdAt}</span>
                      </span>
                    </div>

                    <h3 className={`text-base font-bold ${isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}>
                      {task.title}
                    </h3>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {task.description}
                    </p>

                    {/* Context Data Boxes */}
                    <div className="flex flex-wrap gap-2 text-xs pt-1">
                      {task.customerName && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)]">خریدار:</span>
                          <span className="font-bold text-[var(--text-main)]">{task.customerName}</span>
                        </div>
                      )}

                      {task.customerPhone && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)]">تلفن:</span>
                          <a href={`tel:${task.customerPhone}`} className="font-mono text-sky-700 dark:text-sky-400 hover:underline dir-ltr">
                            {task.customerPhone}
                          </a>
                        </div>
                      )}

                      {task.amount && (
                        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/35 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <span className="opacity-80">مبلغ:</span>
                          <span className="font-bold font-mono">{task.amount.toLocaleString()} تومان</span>
                        </div>
                      )}

                      {task.metadata?.cardLast4 && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)]">۴ رقم آخر کارت:</span>
                          <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{task.metadata.cardLast4}</span>
                        </div>
                      )}

                      {task.metadata?.trackingCode && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)]">کد رهگیری:</span>
                          <span className="font-mono text-[var(--accent-text)]">{task.metadata.trackingCode}</span>
                        </div>
                      )}

                      {task.metadata?.supplierName && (
                        <div className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)] flex items-center gap-1.5">
                          <span className="text-[var(--text-muted)]">تامین‌کننده:</span>
                          <span className="font-bold text-amber-700 dark:text-amber-300">{task.metadata.supplierName}</span>
                          {task.metadata?.supplierPhone && (
                            <a href={`tel:${task.metadata.supplierPhone}`} className="font-mono text-sky-700 dark:text-sky-400 hover:underline mr-1">
                              ({task.metadata.supplierPhone})
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pre-formatted message template for instant copy */}
                    {task.templateText && !isCompleted && (
                      <div className="mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-[var(--text-main)] font-mono truncate min-w-0">
                          <span className="text-sky-700 dark:text-sky-400 font-bold ml-1">قالب پیامک/بله/ایتا:</span>
                          {task.templateText}
                        </div>
                        <button
                          onClick={() => handleCopy(task.templateText!, task.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-surface)] hover:bg-[var(--bg-card-hover)] text-[var(--text-main)] flex items-center gap-1 shrink-0 transition-all border border-[var(--border-color)] cursor-pointer self-end sm:self-auto"
                        >
                          {copiedId === task.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-700 dark:text-emerald-400">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span>کپی پیام</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions (Complete / Cancel) */}
                  <div className="flex flex-row lg:flex-col items-center gap-2 shrink-0 w-full lg:w-auto pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--border-color)]">
                    {!isCompleted ? (
                      <>
                        <button
                          onClick={() => onCompleteTask(task.id, 'انجام شد توسط اپراتور')}
                          className="flex-1 lg:w-36 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تکمیل و تایید</span>
                        </button>

                        <button
                          onClick={() => onCancelTask(task.id)}
                          className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all border border-[var(--border-color)] cursor-pointer"
                        >
                          لغو / نادیده
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/35">
                        <Check className="w-4 h-4" />
                        <span>انجام شده</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--accent-text)]" />
                <span>ثبت کار دستی جدید در صف اختلال شبکه</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-lg font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-main)] font-bold mb-1">عنوان کار دستی *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="مثال: استعلام تلفنی قیمت رم از بازار، تایید فیش کارت‌به‌کارت..."
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-main)] font-bold mb-1">دسته‌بندی</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as ManualTaskCategory)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                  >
                    <option value="CARD_TO_CARD">💳 تایید کارت‌به‌کارت (جایگزین شاپرک)</option>
                    <option value="SMS_DISPATCH">💬 ارسال پیامک / بله / ایتا</option>
                    <option value="SUPPLIER_CALL">📞 استعلام تلفنی تامین‌کننده</option>
                    <option value="OFFLINE_ORDER_SYNC">📦 تایید سفارشات آفلاین</option>
                    <option value="OFFLINE_INVOICE">📄 فاکتور رسمی سامانه مودیان</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-main)] font-bold mb-1">اولویت</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as ManualTaskPriority)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                  >
                    <option value="CRITICAL">🔴 بحرانی / فوری</option>
                    <option value="HIGH">🟡 اولویت بالا</option>
                    <option value="NORMAL">🟢 اولویت عادی</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-main)] font-bold mb-1">نام خریدار / تامین‌کننده</label>
                  <input
                    type="text"
                    value={newTaskCustomer}
                    onChange={(e) => setNewTaskCustomer(e.target.value)}
                    placeholder="مثال: رضا محمدی"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-main)] font-bold mb-1">شماره تماس مستقیم</label>
                  <input
                    type="text"
                    value={newTaskPhone}
                    onChange={(e) => setNewTaskPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)] dir-ltr text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-main)] font-bold mb-1">مبلغ واریزی / فاکتور (تومان)</label>
                <input
                  type="text"
                  value={newTaskAmount}
                  onChange={(e) => setNewTaskAmount(e.target.value)}
                  placeholder="مثال: ۲,۵۰۰,۰۰۰"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-main)] font-bold mb-1">شرح ماجرا و علت دستی شدن</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="مثال: مشتری هنگام قطعی شاپرک واریز کرده، نیازمند تطبیق پیامک بانک..."
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-main)] font-bold mb-1">متن پیشنهادی پیامک / پیام بله و ایتا (اختیاری)</label>
                <textarea
                  rows={2}
                  value={newTaskTemplate}
                  onChange={(e) => setNewTaskTemplate(e.target.value)}
                  placeholder="متنی که با ۱ کلیک قابل کپی و ارسال باشد..."
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold shadow-md cursor-pointer"
                >
                  افزودن به صف دستی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
