import React, { useState, useEffect, useCallback } from 'react';
import { 
  CanonicalProduct, 
  Supplier, 
  BusinessRule, 
  AutomationMatrix, 
  ApprovalItem, 
  DecisionLog, 
  CalendarEvent, 
  StoreFinancialSummary,
  Currency,
  MarketMode,
  AutomationLevel,
  NetworkResilienceMode,
  ManualTask
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SUPPLIERS, 
  INITIAL_RULES, 
  INITIAL_AUTOMATION_MATRIX, 
  INITIAL_APPROVALS, 
  INITIAL_DECISION_LOGS, 
  INITIAL_CALENDAR_EVENTS, 
  INITIAL_FINANCIAL_SUMMARY,
  INITIAL_MANUAL_TASKS
} from './mockData';
import { Navigation } from './components/Navigation';
import { StorefrontView } from './components/StorefrontView';
import { GordiyehLoader } from './components/GordiyehLoader';
import type { ThemeConfig } from './components/VisualThemeModal';
import { SiteConfig, loadSiteConfig, saveSiteConfig } from './utils/cmsStore';

const DailyBriefing = React.lazy(() => import('./components/DailyBriefing').then(m => ({ default: m.DailyBriefing })));
const ApprovalQueueView = React.lazy(() => import('./components/ApprovalQueueView').then(m => ({ default: m.ApprovalQueueView })));
const RuleEngineView = React.lazy(() => import('./components/RuleEngineView').then(m => ({ default: m.RuleEngineView })));
const CatalogBrainView = React.lazy(() => import('./components/CatalogBrainView').then(m => ({ default: m.CatalogBrainView })));
const SuppliersView = React.lazy(() => import('./components/SuppliersView').then(m => ({ default: m.SuppliersView })));
const CampaignSimulatorView = React.lazy(() => import('./components/CampaignSimulatorView').then(m => ({ default: m.CampaignSimulatorView })));
const DecisionLogView = React.lazy(() => import('./components/DecisionLogView').then(m => ({ default: m.DecisionLogView })));
const AskCommerceView = React.lazy(() => import('./components/AskCommerceView').then(m => ({ default: m.AskCommerceView })));
const SecurityAndCocaView = React.lazy(() => import('./components/SecurityAndCocaView').then(m => ({ default: m.SecurityAndCocaView })));
const ExplainabilityModal = React.lazy(() => import('./components/ExplainabilityModal').then(m => ({ default: m.ExplainabilityModal })));
const VisualThemeModal = React.lazy(() => import('./components/VisualThemeModal').then(m => ({ default: m.VisualThemeModal })));
const ManualTasksView = React.lazy(() => import('./components/ManualTasksView').then(m => ({ default: m.ManualTasksView })));
const SiteVisualEditor = React.lazy(() => import('./components/storefront/SiteVisualEditor').then(m => ({ default: m.SiteVisualEditor })));
const VisualCmsStudio = React.lazy(() => import('./components/admin/VisualCmsStudio').then(m => ({ default: m.VisualCmsStudio })));
const AdminSettingsView = React.lazy(() => import('./components/AdminSettingsView').then(m => ({ default: m.AdminSettingsView })));

export default function App() {
  // Read initial view & active tab from URL or LocalStorage
  // Read initial view & active tab from URL pathname or params
  const getInitialNavigation = () => {
    let initialView: 'STOREFRONT' | 'SUPERVISOR' = 'STOREFRONT';
    let initialTab = 'briefing';

    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');

      // Admin / Supervisor is ONLY accessible via /admin path
      if (pathname.startsWith('/admin')) {
        initialView = 'SUPERVISOR';
      } else {
        initialView = 'STOREFRONT';
      }

      if (tabParam) {
        initialTab = tabParam;
      } else {
        const savedTab = localStorage.getItem('commerce_os_supervisor_tab');
        if (savedTab) initialTab = savedTab;
      }
    }

    return { initialView, initialTab };
  };

  const navInit = getInitialNavigation();

  // Global Commerce View Switcher: Storefront vs Supervisor (Admin)
  const [currentView, setCurrentView] = useState<'STOREFRONT' | 'SUPERVISOR'>(navInit.initialView);

  useEffect(() => {
    const handleLocationChange = () => {
      const isAdm = window.location.pathname.startsWith('/admin');
      setCurrentView(isAdm ? 'SUPERVISOR' : 'STOREFRONT');
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Supervisor Tab State
  const [activeTab, setActiveTab] = useState<string>(navInit.initialTab);
  const [currency, setCurrency] = useState<Currency>('TOMAN');
  const [marketMode, setMarketMode] = useState<MarketMode>('IRAN');
  const [autopilotActive, setAutopilotActive] = useState<boolean>(true);

  // Iran Network Resilience Mode: 'GLOBAL' | 'INTRANET' | 'AIRGAP_OFFLINE'
  const [networkMode, setNetworkMode] = useState<NetworkResilienceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('commerce_os_network_mode');
      if (saved === 'GLOBAL' || saved === 'INTRANET' || saved === 'AIRGAP_OFFLINE') {
        return saved;
      }
    }
    return 'INTRANET'; // Defaulting to sovereign resilient mode for Iran
  });

  const handleNetworkModeChange = (mode: NetworkResilienceMode) => {
    setNetworkMode(mode);
    try {
      localStorage.setItem('commerce_os_network_mode', mode);
    } catch {}
    if (mode !== 'GLOBAL') {
      setCurrency('TOMAN'); // Sovereign intranet mode enforces Toman strictly
    }
  };

  // Manual Tasks Queue State (Iran Resilience Operations)
  const [manualTasks, setManualTasks] = useState<ManualTask[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('commerce_os_manual_tasks');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_MANUAL_TASKS;
  });

  const handleCompleteManualTask = (id: string, note?: string) => {
    setManualTasks(prev => {
      const updated = prev.map(t => t.id === id ? { 
        ...t, 
        status: 'COMPLETED' as const, 
        completedAt: 'هم‌اکنون', 
        completionNote: note || 'تکمیل دستی توسط ناظر سیستم' 
      } : t);
      try {
        localStorage.setItem('commerce_os_manual_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (networkMode !== 'AIRGAP_OFFLINE') {
      fetch(`/api/manual-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', note: note || 'تکمیل دستی توسط ناظر سیستم' })
      }).catch(() => {});
    }

    // Log to decision memory
    const task = manualTasks.find(t => t.id === id);
    if (task) {
      const newLog: DecisionLog = {
        id: `log_task_${Date.now()}`,
        timestamp: 'هم‌اکنون',
        eventTrigger: `تکمیل کار دستی: ${task.title}`,
        decisionTaken: 'اقدام تایید و در سیستم اعمال شد.',
        reason: task.description,
        evidence: [
          `دسته‌بندی: ${task.category}`,
          `مشتری / طرف حساب: ${task.customerName || 'نامشخص'} (${task.customerPhone || '-'})`,
          `مبلغ: ${task.amount ? task.amount.toLocaleString() + ' تومان' : 'ندارد'}`,
          `وضعیت شبکه در لحظه: ${networkMode}`
        ],
        ruleMatched: 'Rule: Manual Fallback Operations Audit',
        status: 'APPROVED_BY_OPERATOR',
        outcome: `کار با موفقیت بسته شد. ${note || ''}`,
      };
      setDecisionLogs(prev => [newLog, ...prev]);
    }
  };

  const handleCancelManualTask = (id: string) => {
    setManualTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status: 'CANCELLED' as const } : t);
      try {
        localStorage.setItem('commerce_os_manual_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (networkMode !== 'AIRGAP_OFFLINE') {
      fetch(`/api/manual-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', note: 'لغو توسط اپراتور' })
      }).catch(() => {});
    }
  };

  const handleAddManualTask = (taskData: Omit<ManualTask, 'id' | 'createdAt' | 'status'>) => {
    const newTask: ManualTask = {
      ...taskData,
      id: `task_${Date.now()}`,
      status: 'PENDING',
      createdAt: 'هم‌اکنون'
    };

    setManualTasks(prev => {
      const updated = [newTask, ...prev];
      try {
        localStorage.setItem('commerce_os_manual_tasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (networkMode !== 'AIRGAP_OFFLINE') {
      fetch('/api/manual-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      }).catch(() => {});
    }
  };

  // Visual Theme & Presentation Personalization
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSiteEditorOpen, setIsSiteEditorOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => loadSiteConfig());
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('commerce_os_visual_theme_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            accent: parsed.accent === 'indigo' ? 'forest' : (parsed.accent || 'forest'),
          };
        }
      } catch {}
    }
    return {
      accent: 'forest',
      density: 'spacious',
      cyberGrid: true,
      warRoomMode: false,
    };
  });

  const handleSaveThemeConfig = (newConfig: ThemeConfig) => {
    setThemeConfig(newConfig);
    try {
      localStorage.setItem('commerce_os_visual_theme_config', JSON.stringify(newConfig));
    } catch {}
  };

  const handleSaveSiteConfig = (newConfig: SiteConfig) => {
    setSiteConfig(newConfig);
    saveSiteConfig(newConfig);
  };

  // Sync currentView and activeTab to URL and LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('commerce_os_active_view', currentView);
      localStorage.setItem('commerce_os_supervisor_tab', activeTab);
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (currentView === 'SUPERVISOR') {
        url.searchParams.set('view', 'SUPERVISOR');
        url.searchParams.set('tab', activeTab);
      } else {
        url.searchParams.delete('view');
        url.searchParams.delete('tab');
      }
      window.history.replaceState(window.history.state, '', url.toString());
    }
  }, [currentView, activeTab]);

  // Entities & Core State - Initialized from mockData as instant cache, then hydrated from SQLite
  const [products, setProducts] = useState<CanonicalProduct[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [rules, setRules] = useState<BusinessRule[]>(INITIAL_RULES);
  const [automationMatrix, setAutomationMatrix] = useState<AutomationMatrix>(INITIAL_AUTOMATION_MATRIX);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>(INITIAL_DECISION_LOGS);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [summary, setSummary] = useState<StoreFinancialSummary>(INITIAL_FINANCIAL_SUMMARY);

  const [isInitialBootLoading, setIsInitialBootLoading] = useState<boolean>(true);
  const [isLoaderPreview, setIsLoaderPreview] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('preview_loader') === '1';
  });

  const handleCloseLoaderPreview = useCallback(() => {
    setIsLoaderPreview(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('preview_loader')) {
        url.searchParams.delete('preview_loader');
        window.history.replaceState(window.history.state, '', url.toString());
      }
    }
  }, []);

  const dismissPreBootLoader = useCallback(() => {
    setIsInitialBootLoading(false);
    if (typeof document !== 'undefined') {
      const bootEl = document.getElementById('gordiyeh-boot-loader');
      if (bootEl) {
        bootEl.classList.add('is-ready');
        window.setTimeout(() => {
          bootEl.remove();
        }, 320);
      }
    }
  }, []);

  // Hydrate persistent state from SQLite backend
  const refreshBootstrapData = useCallback(() => {
    fetch('/api/bootstrap')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          const d = res.data;
          if (Array.isArray(d.products) && d.products.length > 0) setProducts(d.products);
          if (Array.isArray(d.suppliers) && d.suppliers.length > 0) setSuppliers(d.suppliers);
          if (Array.isArray(d.rules) && d.rules.length > 0) setRules(d.rules);
          if (d.automationMatrix) setAutomationMatrix(d.automationMatrix);
          if (Array.isArray(d.approvals)) setApprovals(d.approvals);
          if (Array.isArray(d.decisionLogs)) setDecisionLogs(d.decisionLogs);
          if (Array.isArray(d.calendarEvents) && d.calendarEvents.length > 0) setEvents(d.calendarEvents);
          if (d.financialSummary) setSummary(d.financialSummary);
          if (Array.isArray(d.manualTasks) && d.manualTasks.length > 0) {
            setManualTasks(d.manualTasks);
            try {
              localStorage.setItem('commerce_os_manual_tasks', JSON.stringify(d.manualTasks));
            } catch {}
          }
        }
      })
      .catch(err => {
        console.warn('Backend bootstrap offline, using local cache:', err);
      })
      .finally(() => {
        dismissPreBootLoader();
      });
  }, [dismissPreBootLoader]);

  useEffect(() => {
    const capTimer = window.setTimeout(dismissPreBootLoader, 650);
    refreshBootstrapData();
    return () => window.clearTimeout(capTimer);
  }, [refreshBootstrapData, dismissPreBootLoader]);

  // Modal for Explainability
  const [explainingProduct, setExplainingProduct] = useState<CanonicalProduct | null>(null);

  // Order Flow: Connecting Customer Storefront directly to Commerce OS Core!
  const handleOrderCreated = (order: any) => {
    // 1. Live stock deduction from active supplier offers
    setProducts(prevProducts => prevProducts.map(prod => {
      const itemInOrder = order.items?.find((i: any) => i.id === prod.id || i.sku === prod.sku);
      if (itemInOrder) {
        return {
          ...prod,
          supplierOffers: prod.supplierOffers.map(off => {
            if (off.id === prod.selectedOfferId) {
              return { ...off, stock: Math.max(0, off.stock - itemInOrder.quantity) };
            }
            return off;
          }),
        };
      }
      return prod;
    }));

    // 2. Update real-time financial metrics (Contribution Profit)
    setSummary(prev => ({
      ...prev,
      todayRevenue: prev.todayRevenue + order.totalAmount,
      todayContributionProfit: prev.todayContributionProfit + (order.contributionProfit || Math.round(order.totalAmount * 0.28)),
      todayOrdersCount: prev.todayOrdersCount + 1,
    }));

    // 3. Rule Engine & Risk Evaluation
    if (order.requireApproval || order.status === 'HIGH_RISK_HOLD') {
      const approvalItem: ApprovalItem = {
        id: `appr_${Date.now()}`,
        priority: 'HIGH',
        productTitle: `سفارش جدید مشتری: ${order.orderNumber} (مبلغ: ${order.totalAmount.toLocaleString()} تومان)`,
        category: 'ORDERS',
        actionType: 'تأیید سفارش مبلغ بالا و اعتبارسنجی ارسال',
        reason: order.approvalReason || `ارزش سفارش (${order.totalAmount.toLocaleString()} تومان) بالاتر از سقف مجاز خودکار ۵M تومان است.`,
        evidence: [
          `مبلغ کل: ${order.totalAmount.toLocaleString()} تومان`,
          `خریدار: ${order.customerName} (${order.city || 'تهران'})`,
          `تعداد اقلام: ${order.items?.length || 1} عدد`,
          `درگاه پرداخت: شاپرک / اینترنتی`,
          `کد رهگیری شتاب: ${order.trackingCode}`,
        ],
        expectedImpact: `در صورت تأیید: ارسال فوری و سود خالص +${((order.contributionProfit || Math.round(order.totalAmount * 0.28))).toLocaleString()} تومان`,
        riskScore: order.riskScore || 72,
        currentValue: 'وضعیت: در صف تایید ناظر (Hold)',
        proposedValue: 'اقدام: تایید نهایی و صدور حواله انبار تأمین‌کننده',
        status: 'PENDING',
        createdAt: 'هم‌اکنون',
        ruleRefId: 'rule_high_val_order',
      };
      setApprovals(prev => [approvalItem, ...prev]);

      // Decision Log
      const newLog: DecisionLog = {
        id: `log_${Date.now()}`,
        timestamp: 'هم‌اکنون',
        eventTrigger: `ثبت سفارش مبلغ بالا: ${order.orderNumber}`,
        decisionTaken: 'توقف در صف تأیید ناظر طبق Rule Engine',
        reason: 'سفارشات بالاتر از ۵ میلیون تومان نیازمند تایید دستی ناظر سیستم هستند.',
        evidence: approvalItem.evidence,
        ruleMatched: 'Rule: High Value Order > 5,000,000 Toman',
        status: 'APPROVED_BY_OPERATOR',
        outcome: 'سفارش در صف تایید قرار گرفت و تا صدور مجوز ارسال نمی‌گردد.',
      };
      setDecisionLogs(prev => [newLog, ...prev]);
    } else {
      // Normal Low-Risk Order: Autopilot Routes automatically
      const newLog: DecisionLog = {
        id: `log_${Date.now()}`,
        timestamp: 'هم‌اکنون',
        eventTrigger: `ثبت سفارش عادی مشتری: ${order.orderNumber}`,
        decisionTaken: 'مسیریابی و ارسال خودکار به انبار تأمین‌کننده (Autopilot)',
        reason: 'مبلغ و پارامترهای ریسک سفارش در محدوده مجاز قوانین کسب‌وکار بود.',
        evidence: [
          `مبلغ سفارش: ${order.totalAmount.toLocaleString()} تومان`,
          `کد رهگیری: ${order.trackingCode}`,
          `تأمین‌کننده منتخب: ${order.routingSupplier || 'انبار مرکزی تهران'}`,
        ],
        ruleMatched: 'Rule: Standard Low-Risk Order Routing',
        status: 'AUTO_APPLIED',
        outcome: 'سفارش تایید شد و بلافاصله حواله انبار صادر شد.',
      };
      setDecisionLogs(prev => [newLog, ...prev]);
    }

    // 4. Automatic Manual Task generation for Card-to-Card or Airgap Offline orders
    if (order.paymentMethod === 'CARD_TO_CARD' || networkMode === 'AIRGAP_OFFLINE') {
      handleAddManualTask({
        title: `تایید فیش کارت‌به‌کارت سفارش #${order.orderNumber} (${(order.totalAmount || 0).toLocaleString()} تومان)`,
        category: 'CARD_TO_CARD',
        priority: 'CRITICAL',
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone || order.phone,
        amount: order.totalAmount,
        description: `سفارش در وضعیت ${networkMode === 'AIRGAP_OFFLINE' ? 'آفلاین اضطراری' : 'کارت‌به‌کارت'} ثبت شد و نیازمند تطبیق رسید بانکی و تایید ارسال است.`,
        actionRequired: 'تطبیق شماره پیگیری با همراه بانک و تایید خروج از انبار',
        templateText: `سلام جناب/سرکار ${order.customerName || 'مشتری گرامی'}، واریزی سفارش ${order.orderNumber} در سامانه Commerce OS ثبت شد و پس از بررسی فیش، جهت ارسال تحویل خواهد شد.`,
        metadata: {
          platform: 'BALE',
          trackingCode: order.trackingCode
        }
      });
    }
  };

  // Approval Queue Actions with SQLite Persistence
  const handleApprove = (id: string) => {
    const item = approvals.find(a => a.id === id);
    if (!item) return;

    setApprovals(prev => prev.filter(a => a.id !== id));
    fetch(`/api/approvals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED', reason: item.reason })
    }).catch(() => {});

    const newLog: DecisionLog = {
      id: `log_${Date.now()}`,
      timestamp: 'هم‌اکنون',
      eventTrigger: `تأیید اقدام برای: ${item.productTitle}`,
      decisionTaken: item.proposedValue,
      reason: item.reason,
      evidence: item.evidence,
      ruleMatched: item.ruleRefId || 'Human Supervisor Approval Override',
      status: 'APPROVED_BY_OPERATOR',
      outcome: `تأیید شد و اقدام '${item.actionType}' با موفقیت اعمال شد.`,
      operatorNote: 'دستور تأیید صادر شد.',
    };

    setDecisionLogs(prev => [newLog, ...prev]);
  };

  const handleReject = (id: string) => {
    const item = approvals.find(a => a.id === id);
    if (!item) return;

    setApprovals(prev => prev.filter(a => a.id !== id));
    fetch(`/api/approvals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REJECTED', reason: 'رد شده توسط ناظر' })
    }).catch(() => {});

    const newLog: DecisionLog = {
      id: `log_${Date.now()}`,
      timestamp: 'هم‌اکنون',
      eventTrigger: `رد اقدام برای: ${item.productTitle}`,
      decisionTaken: 'لغو و بایگانی اقدام پیشنهادی',
      reason: 'ناظر به دلیل ریسک بالا یا عدم تطابق با اولویت‌های روز دستور رد صادر کرد.',
      evidence: item.evidence,
      ruleMatched: item.ruleRefId || 'Supervisor Reject Policy',
      status: 'REJECTED_BY_OPERATOR',
      outcome: 'اقدام پیشنهادی لغو شد و وضعیت قبلی کالا یا سفارش تثبیت شد.',
      operatorNote: 'اقدام رد شد.',
    };

    setDecisionLogs(prev => [newLog, ...prev]);
  };

  const handleEditAndApprove = (id: string, newProposedValue: string) => {
    const item = approvals.find(a => a.id === id);
    if (!item) return;

    setApprovals(prev => prev.filter(a => a.id !== id));
    fetch(`/api/approvals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED', reason: `تعدیل شد به: ${newProposedValue}` })
    }).catch(() => {});

    const newLog: DecisionLog = {
      id: `log_${Date.now()}`,
      timestamp: 'هم‌اکنون',
      eventTrigger: `ویرایش و اجرای اقدام برای: ${item.productTitle}`,
      decisionTaken: `مقدار تعدیل شده: ${newProposedValue}`,
      reason: item.reason,
      evidence: item.evidence,
      ruleMatched: item.ruleRefId || 'Supervisor Custom Adjusted Value',
      status: 'APPROVED_BY_OPERATOR',
      outcome: 'پارامترهای جدید طبق نظر ناظر وارد چرخه اتوماسیون شد.',
      operatorNote: `مقدار به '${newProposedValue}' تغییر یافت و تأیید شد.`,
    };

    setDecisionLogs(prev => [newLog, ...prev]);
  };

  // Crucial User Requirement: "Approve & Remember This Rule"
  const handleApproveAndRememberRule = (
    approvalItem: ApprovalItem,
    newRuleName: string,
    newThreshold: number
  ) => {
    setApprovals(prev => prev.filter(a => a.id !== approvalItem.id));
    fetch(`/api/approvals/${approvalItem.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED', reason: `یادگیری قانون جدید: ${newRuleName}` })
    }).catch(() => {});

    const newRule: BusinessRule = {
      id: `rule_dynamic_${Date.now()}`,
      name: newRuleName,
      nameFa: newRuleName,
      category: approvalItem.category === 'AI_STRATEGY' ? 'RISK' : approvalItem.category,
      conditionDescription: `این قانون بر اساس تأیید ناظر برای '${approvalItem.productTitle}' ساخته شد تا موارد مشابه بدون توقف اجرا شوند.`,
      thresholdValue: newThreshold,
      thresholdUnit: approvalItem.category === 'ORDERS' ? 'تومان' : '%',
      action: 'AUTO_APPLY',
      actionFa: 'اجرای خودکار اتوپایلوت',
      isEnabled: true,
      isSystemCore: false,
    };

    const updatedRules = [newRule, ...rules];
    setRules(updatedRules);
    fetch('/api/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: updatedRules })
    }).catch(() => {});

    const newLog: DecisionLog = {
      id: `log_${Date.now()}`,
      timestamp: 'هم‌اکنون',
      eventTrigger: `تأیید اقدام و یادگیری قانون دائمی جدید (Approve & Remember)`,
      decisionTaken: `ثبت قانون: ${newRuleName} با آستانه ${newThreshold}`,
      reason: `ناظر این الگو را به عنوان رفتار استاندارد سیستم تأیید کرد.`,
      evidence: approvalItem.evidence,
      ruleMatched: newRule.nameFa,
      status: 'RULE_CREATED',
      outcome: `قانون به Rule Engine اضافه شد؛ از این پس اقدامات مشابه تا سقف ${newThreshold} به صورت Autopilot اجرا خواهند شد.`,
      operatorNote: `قانون '${newRuleName}' به طور دائم ذخیره شد.`,
    };

    setDecisionLogs(prev => [newLog, ...prev]);
  };

  // Rule Engine Handlers with SQLite Persistence
  const handleUpdateRuleThreshold = (ruleId: string, newThreshold: number) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, thresholdValue: newThreshold } : r));
    fetch(`/api/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thresholdValue: newThreshold })
    }).catch(() => {});

    const targetRule = rules.find(r => r.id === ruleId);
    if (targetRule) {
      const newLog: DecisionLog = {
        id: `log_${Date.now()}`,
        timestamp: 'هم‌اکنون',
        eventTrigger: `تغییر آستانه قانون: ${targetRule.nameFa}`,
        decisionTaken: `تغییر آستانه از ${targetRule.thresholdValue} به ${newThreshold}`,
        reason: 'تعدیل سیاست‌های عملیاتی توسط ناظر سیستم',
        evidence: ['درخواست مستقیم از پنل Rule Engine'],
        ruleMatched: targetRule.nameFa,
        status: 'RULE_CREATED',
        outcome: `آستانه جدید بلافاصله در کل چرخه اتوپایلوت اعمال شد.`,
      };
      setDecisionLogs(prev => [newLog, ...prev]);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    const target = rules.find(r => r.id === ruleId);
    const newStatus = target ? !target.isEnabled : true;
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isEnabled: newStatus } : r));
    fetch(`/api/rules/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: newStatus })
    }).catch(() => {});
  };

  const handleUpdateAutomationMatrix = (module: keyof AutomationMatrix, level: AutomationLevel) => {
    const updated = { ...automationMatrix, [module]: level };
    setAutomationMatrix(updated);
    fetch('/api/automation-matrix', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});
  };

  const handleAddNewRule = (newRuleData: Omit<BusinessRule, 'id'>) => {
    const created: BusinessRule = {
      ...newRuleData,
      id: `rule_custom_${Date.now()}`,
    };
    const updated = [created, ...rules];
    setRules(updated);
    fetch('/api/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: updated })
    }).catch(() => {});
  };

  // Catalog & Supplier Switching Handlers with SQLite Persistence
  const handleSwitchSupplierOffer = (productId: string, offerId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const offer = product.supplierOffers.find(o => o.id === offerId);
    if (!offer) return;

    const updatedProduct = {
      ...product,
      selectedOfferId: offerId,
      baseCost: offer.offerPrice,
      dna: {
        ...product.dna,
        supplierReliability: offer.reliabilityScore,
        currentMarginPercent: ((product.retailPrice - offer.offerPrice) / product.retailPrice) * 100,
      },
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    }).catch(() => {});

    const newLog: DecisionLog = {
      id: `log_${Date.now()}`,
      timestamp: 'هم‌اکنون',
      eventTrigger: `سوئیچ آفر تأمین‌کننده برای کالا: ${product.title}`,
      decisionTaken: `تغییر تأمین‌کننده فعال به: ${offer.supplierName}`,
      reason: `بهینه‌سازی زنجیره تأمین و استفاده از موجودی ${offer.stock} عدد با نرخ تعهد ${offer.fulfillmentRate}٪`,
      evidence: [
        `قیمت خرید جدید: ${offer.offerPrice.toLocaleString()} تومان`,
        `موجودی جدید: ${offer.stock} عدد`,
        `زمان دیسپچ: ${offer.dispatchTimeHours} ساعت`,
      ],
      ruleMatched: 'Rule: Supplier Offer Optimization & Zero Stock Fallback',
      status: 'APPROVED_BY_OPERATOR',
      outcome: `تأمین‌کننده با موفقیت سوئیچ شد؛ ریسک ناموجودی برطرف شد.`,
    };

    setDecisionLogs(prev => [newLog, ...prev]);
  };

  const handleToggleKillList = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const isCurrentlyKill = product.status === 'KILL_LIST';
    const newStatus = isCurrentlyKill ? 'PUBLISHED' : 'KILL_LIST';
    const updatedProduct = { ...product, status: newStatus as any };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    }).catch(() => {});

    const newLog: DecisionLog = {
      id: `log_${Date.now()}`,
      timestamp: 'هم‌اکنون',
      eventTrigger: `${isCurrentlyKill ? 'خروج از' : 'انتقال به'} لیست سیاه (Kill List): ${product.title}`,
      decisionTaken: isCurrentlyKill ? 'فعال‌سازی و انتشار مجدد کالا در ویترین فروشگاه' : 'توقف آنی فروش و حذف از ویترین',
      reason: isCurrentlyKill ? 'بررسی مجدد و تایید سلامت کالا' : 'پیشگیری از ضرر و خسارت ناشی از مرجوعی یا تامین‌کننده معیوب',
      evidence: product.evidence,
      ruleMatched: 'Rule: Kill List & Quarantine Engine',
      status: 'APPROVED_BY_OPERATOR',
      outcome: isCurrentlyKill ? 'کالا به ویترین بازگشت.' : 'فروش کالا متوقف شد و سفارش جدید ثبت نمی‌شود.',
    };

    setDecisionLogs(prev => [newLog, ...prev]);
  };

  const handleRepriceProduct = (productId: string, newPrice: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const margin = ((newPrice - product.baseCost) / newPrice) * 100;
    const updatedProduct = {
      ...product,
      retailPrice: newPrice,
      dna: { ...product.dna, currentMarginPercent: margin },
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    }).catch(() => {});
  };

  // Supplier Status Handler
  const handleToggleSupplierStatus = (supplierId: string, newStatus: Supplier['status']) => {
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, status: newStatus } : s));
  };

  // Campaign to Approval Queue
  const handleSendCampaignToApproval = (
    campaignTitle: string,
    discount: number,
    expectedProfit: number
  ) => {
    const newApproval: ApprovalItem = {
      id: `appr_${Date.now()}`,
      priority: discount > 20 ? 'HIGH' : 'MEDIUM',
      productTitle: campaignTitle,
      category: 'CAMPAIGN',
      actionType: `اعمال تخفیف ${discount}٪ کمپین`,
      reason: `کمپین نیازمند تایید ناظر برای خروج احتمالی از سقف تخفیف عادی اتوپایلوت است.`,
      evidence: [
        `درصد تخفیف: ${discount}٪`,
        `سود سهم‌آور پیش‌بینی شده: ${expectedProfit.toLocaleString()} تومان`,
        `ارزیابی در شبیه‌ساز کمپین انجام شده است.`,
      ],
      expectedImpact: `پیش‌بینی سود خالص: ${expectedProfit.toLocaleString()} تومان`,
      riskScore: discount > 20 ? 65 : 35,
      currentValue: 'تخفیف عادی: ۰٪',
      proposedValue: `تخفیف کمپین: ${discount}٪`,
      status: 'PENDING',
      createdAt: 'هم‌اکنون',
      ruleRefId: 'rule_max_auto_discount',
    };

    setApprovals(prev => [newApproval, ...prev]);
    setCurrentView('SUPERVISOR');
    setActiveTab('approvals');
  };

  const handleSendActionToApproval = (actionTitle: string, profitImpact: number) => {
    const newApproval: ApprovalItem = {
      id: `appr_ai_${Date.now()}`,
      priority: 'HIGH',
      productTitle: 'پیشنهاد راهبردی مغز هوش مصنوعی',
      category: 'AI_STRATEGY',
      actionType: actionTitle.slice(0, 50),
      reason: `اقدام اصلاحی از سوی هوش مصنوعی برای مدیریت ریسک بازار و حفظ سودآوری.`,
      evidence: [
        `اقدام: ${actionTitle}`,
        `اثر مالی مورد انتظار: ${profitImpact.toLocaleString()} تومان`,
        `تحلیل مدل: Gemini 3.8 Flash + Policy Guardrails`,
      ],
      expectedImpact: `بهینه‌سازی سود سهم‌آور به میزان ${profitImpact.toLocaleString()} تومان`,
      riskScore: 45,
      currentValue: 'وضعیت فعلی',
      proposedValue: actionTitle,
      status: 'PENDING',
      createdAt: 'هم‌اکنون',
      ruleRefId: 'rule_ai_recommendation',
    };

    setApprovals(prev => [newApproval, ...prev]);
    setCurrentView('SUPERVISOR');
    setActiveTab('approvals');
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'PENDING').length;
  const pendingManualTasksCount = manualTasks.filter(t => t.status === 'PENDING').length;

  return (
    <div className={`min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] gordiyeh-dark-bg flex flex-col font-sans transition-colors ${
      themeConfig.accent === 'emerald' ? 'selection:bg-emerald-600 selection:text-white' :
      themeConfig.accent === 'amber' ? 'selection:bg-amber-600 selection:text-white' :
      themeConfig.accent === 'rose' ? 'selection:bg-rose-600 selection:text-white' :
      'selection:bg-[var(--accent-primary)] selection:text-[#F7F3EA]'
    }`}>
      {/* Pure Smooth Backdrop without dot pattern */}

      {/* War Room Alert Banner */}
      {themeConfig.warRoomMode && (
        <div className="relative z-50 bg-gradient-to-r from-[#1E4635] via-[#2D6A4F] to-amber-700 text-[#F7F3EA] px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
          <span>حالت اتاق جنگ بازرگانی (War Room Presentation Active) • پایش اضطراری حاشیه سود و سیگنال‌های زنده رقبا</span>
        </div>
      )}

      {/* Supervisor Navigation Header (Command Center top bar) */}
      {currentView === 'SUPERVISOR' && (
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingApprovalsCount={pendingApprovalsCount}
          pendingManualTasksCount={pendingManualTasksCount}
          networkMode={networkMode}
          onNetworkModeChange={handleNetworkModeChange}
          currency={currency}
          onToggleCurrency={() => setCurrency(prev => prev === 'TOMAN' ? 'USD' : 'TOMAN')}
          marketMode={marketMode}
          onToggleMarketMode={() => setMarketMode(prev => prev === 'IRAN' ? 'GLOBAL' : 'IRAN')}
          autopilotActive={autopilotActive}
          onToggleAutopilot={() => setAutopilotActive(prev => !prev)}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenSiteEditor={() => {
            setSiteConfig(loadSiteConfig());
            setIsSiteEditorOpen(true);
          }}
        />
      )}

      {/* Branded Initial Transition Loader (smoothly fades as soon as bootstrap settles, or stays open in preview mode) */}
      {(isInitialBootLoading || isLoaderPreview) && (
        <>
          <GordiyehLoader variant="fullscreen" />
          {isLoaderPreview && (
            <button
              type="button"
              onClick={handleCloseLoaderPreview}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] px-5 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] text-xs font-bold shadow-2xl cursor-pointer transition-colors"
            >
              بستن پیش‌نمایش لودینگ گُردیه
            </button>
          )}
        </>
      )}

      {/* Main Container */}
      <main className={`flex-1 w-full ${currentView === 'STOREFRONT' ? 'p-0 max-w-full' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'}`}>
        {/* VIEW 1: Full Customer Storefront (ویترین مشتری ۰ تا ۱۰۰ بدون هدرهای تکراری) */}
        {currentView === 'STOREFRONT' && (
          <StorefrontView
            products={products}
            currency={currency}
            onOrderCreated={handleOrderCreated}
            onSwitchToSupervisor={() => {
              setCurrentView('SUPERVISOR');
              setActiveTab('approvals');
            }}
            onSwitchSupplierOffer={handleSwitchSupplierOffer}
            networkMode={networkMode}
            onNetworkModeChange={handleNetworkModeChange}
            pendingApprovalsCount={pendingApprovalsCount}
            pendingManualTasksCount={pendingManualTasksCount}
          />
        )}

        {/* VIEW 2: Supervisor Commerce OS Brain & Admin Modules (Lazy Code-Split) */}
        {currentView === 'SUPERVISOR' && (
          <React.Suspense fallback={<GordiyehLoader variant="inline" label="در حال بارگذاری ماژول مدیریت..." />}>
            {activeTab === 'briefing' && (
              <DailyBriefing
                summary={summary}
                pendingApprovals={approvals}
                onNavigateToTab={setActiveTab}
                onQuickApproveFirst={() => {
                  if (approvals[0]) handleApprove(approvals[0].id);
                }}
              />
            )}

            {activeTab === 'manual_tasks' && (
              <ManualTasksView
                tasks={manualTasks}
                onCompleteTask={handleCompleteManualTask}
                onCancelTask={handleCancelManualTask}
                onAddTask={handleAddManualTask}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalQueueView
                approvals={approvals}
                onApprove={handleApprove}
                onReject={handleReject}
                onEditAndApprove={handleEditAndApprove}
                onApproveAndRememberRule={handleApproveAndRememberRule}
              />
            )}

            {activeTab === 'rules' && (
              <RuleEngineView
                rules={rules}
                automationMatrix={automationMatrix}
                onUpdateRuleThreshold={handleUpdateRuleThreshold}
                onToggleRule={handleToggleRule}
                onUpdateAutomationMatrix={handleUpdateAutomationMatrix}
                onAddNewRule={handleAddNewRule}
              />
            )}

            {activeTab === 'catalog' && (
              <CatalogBrainView
                products={products}
                currency={currency}
                onExplainProduct={setExplainingProduct}
                onSwitchSupplierOffer={handleSwitchSupplierOffer}
                onToggleKillList={handleToggleKillList}
                onRepriceProduct={handleRepriceProduct}
              />
            )}

            {activeTab === 'cms' && (
              <VisualCmsStudio products={products} />
            )}

            {activeTab === 'settings' && (
              <AdminSettingsView onPreviewLoader={() => setIsLoaderPreview(true)} />
            )}

            {activeTab === 'suppliers' && (
              <SuppliersView
                suppliers={suppliers}
                onToggleSupplierStatus={handleToggleSupplierStatus}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignSimulatorView
                events={events}
                products={products}
                currency={currency}
                onSendCampaignToApproval={handleSendCampaignToApproval}
              />
            )}

            {activeTab === 'decisions' && (
              <DecisionLogView
                logs={decisionLogs}
              />
            )}

            {activeTab === 'ask' && (
              <AskCommerceView
                summary={summary}
                networkMode={networkMode}
                onSendActionToApproval={handleSendActionToApproval}
              />
            )}

            {activeTab === 'security' && (
              <SecurityAndCocaView />
            )}
          </React.Suspense>
        )}
      </main>

      {/* Visual Personalization & Theme Modal */}
      {isThemeModalOpen && (
        <React.Suspense fallback={null}>
          <VisualThemeModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
            config={themeConfig}
            onChangeConfig={handleSaveThemeConfig}
          />
        </React.Suspense>
      )}

      {/* Storefront Visual & Sliders Editor Drawer */}
      {isSiteEditorOpen && (
        <React.Suspense fallback={null}>
          <SiteVisualEditor
            isOpen={isSiteEditorOpen}
            onClose={() => setIsSiteEditorOpen(false)}
            config={siteConfig}
            onSaveConfig={handleSaveSiteConfig}
            products={products}
          />
        </React.Suspense>
      )}

      {/* Explainability "Why?" Modal */}
      {explainingProduct && (
        <React.Suspense fallback={null}>
          <ExplainabilityModal
            product={explainingProduct}
            onClose={() => setExplainingProduct(null)}
          />
        </React.Suspense>
      )}

      {/* Supervisor Footer (Storefront has its own rich footer) */}
      {currentView === 'SUPERVISOR' && (
        <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-4 px-4 text-center text-xs text-[var(--text-muted)]">
          GORDIYEH Commerce OS • سیستم عامل هوشمند و ویترین فروشگاه مهندسی گُردیه • پنل نظارت و اتوماسیون بازرگانی
        </footer>
      )}
    </div>
  );
}
