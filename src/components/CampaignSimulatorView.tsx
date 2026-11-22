import React, { useState } from 'react';
import { CalendarEvent, CanonicalProduct, Currency } from '../types';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { 
  Calendar, 
  Play, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Package, 
  TrendingUp, 
  Split, 
  Layers,
  ArrowRight,
  Flame,
  Clock,
  ShieldAlert,
  Zap,
  ShoppingBag,
  Percent,
  RefreshCw,
  Scale
} from 'lucide-react';

interface CampaignSimulatorViewProps {
  events: CalendarEvent[];
  products: CanonicalProduct[];
  currency: Currency;
  onSendCampaignToApproval: (campaignTitle: string, discount: number, expectedProfit: number) => void;
}

export type CampaignMode = 
  | 'STANDARD' 
  | 'FLASH_SALE' 
  | 'TIERED_VOLUME' 
  | 'PRICE_WAR' 
  | 'LOSS_LEADER';

export const CampaignSimulatorView: React.FC<CampaignSimulatorViewProps> = ({
  events,
  products,
  currency,
  onSendCampaignToApproval,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'PLANNER' | 'AB_TEST'>('SIMULATOR');

  // Strategy Mode Selector
  const [campaignMode, setCampaignMode] = useState<CampaignMode>('STANDARD');

  // General controls
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [isBundleBoost, setIsBundleBoost] = useState<boolean>(true);
  const [adSpend, setAdSpend] = useState<number>(5000000); // 5M Toman

  // Mode 2: Flash Sale variables
  const [flashHours, setFlashHours] = useState<number>(4);
  const [stockQuota, setStockQuota] = useState<number>(60);

  // Mode 3: Tiered Volume variables
  const [tier2Discount, setTier2Discount] = useState<number>(12);
  const [tier3Discount, setTier3Discount] = useState<number>(22);

  // Mode 4: Price War variables
  const [competitorPriceDropPercent, setCompetitorPriceDropPercent] = useState<number>(8);
  const [priceWarStrategy, setPriceWarStrategy] = useState<'MATCH_PRICE' | 'HOLD_WITH_GIFT' | 'SPLIT_DIFF'>('HOLD_WITH_GIFT');

  // Mode 5: Loss Leader variables
  const [attachRatePercent, setAttachRatePercent] = useState<number>(45); // 45% also buy accessory
  const [accessoryCost, setAccessoryCost] = useState<number>(120000);
  const [accessoryRetailPrice, setAccessoryRetailPrice] = useState<number>(380000); // high margin

  // Macro Market Stress-Testing Toggles
  const [fxShockActive, setFxShockActive] = useState<boolean>(false); // +15% supplier cost
  const [shippingPeakActive, setShippingPeakActive] = useState<boolean>(false); // +40% shipping fees
  const [adInflationActive, setAdInflationActive] = useState<boolean>(false); // +25% ad CAC

  const product = products.find(p => p.id === selectedProductId) || products[0];

  // Base parameters
  const originalPrice = product ? product.retailPrice : 1500000;
  const rawCost = product ? product.baseCost : 900000;
  const cost = fxShockActive ? Math.round(rawCost * 1.15) : rawCost;
  const perUnitShippingAndGateway = shippingPeakActive ? 95000 : 65000;
  const effectiveAdSpend = adInflationActive ? Math.round(adSpend * 1.25) : adSpend;

  // Baseline Scenario (No Campaign)
  const baseVolume = 40;
  const baselineRevenue = baseVolume * originalPrice;
  const baselineCost = baseVolume * rawCost;
  const baselineNetProfit = baselineRevenue - baselineCost - (baseVolume * 65000);

  // Dynamic Calculation based on Strategy Mode
  let discountedPrice = originalPrice * (1 - discountPercent / 100);
  let projectedUnits = 0;
  let projectedRevenue = 0;
  let totalCostOfGoods = 0;
  let totalShippingFees = 0;
  let netContributionProfit = 0;
  let modeExplanation = '';

  switch (campaignMode) {
    case 'FLASH_SALE': {
      // Urgent FOMO deal: high urgency factor, capped by stock quota
      const fomoMultiplier = flashHours <= 6 ? 2.8 : 1.9;
      const unconstrainedDemand = Math.round(baseVolume * (1 + (discountPercent / 100) * 2.2) * fomoMultiplier);
      projectedUnits = Math.min(unconstrainedDemand, stockQuota);
      projectedRevenue = projectedUnits * discountedPrice;
      totalCostOfGoods = projectedUnits * cost;
      totalShippingFees = projectedUnits * perUnitShippingAndGateway;
      netContributionProfit = projectedRevenue - totalCostOfGoods - totalShippingFees - effectiveAdSpend;
      modeExplanation = `حراج صاعقه‌ای با مهلت ${flashHours} ساعت و سقف سهمیه ${stockQuota} عدد. ضریب فوریت (FOMO) تقاضای انفجاری ایجاد می‌کند اما به سقف انبار محدود می‌شود.`;
      break;
    }

    case 'TIERED_VOLUME': {
      // Tiered: 40% buy 1, 35% buy 2 (with tier2 discount), 25% buy 3 (with tier3 discount)
      const baseTierUnits = Math.round(baseVolume * 1.4);
      const unitsTier1 = Math.round(baseTierUnits * 0.4);
      const unitsTier2 = Math.round(baseTierUnits * 0.35) * 2;
      const unitsTier3 = Math.round(baseTierUnits * 0.25) * 3;
      projectedUnits = unitsTier1 + unitsTier2 + unitsTier3;

      const pTier1 = originalPrice;
      const pTier2 = originalPrice * (1 - tier2Discount / 100);
      const pTier3 = originalPrice * (1 - tier3Discount / 100);

      projectedRevenue = (unitsTier1 * pTier1) + (unitsTier2 * pTier2) + (unitsTier3 * pTier3);
      totalCostOfGoods = projectedUnits * cost;
      // Shipping savings: fewer parcels because of multiple units per order
      const estimatedOrders = Math.round(unitsTier1 + (unitsTier2 / 2) + (unitsTier3 / 3));
      totalShippingFees = estimatedOrders * perUnitShippingAndGateway;
      netContributionProfit = projectedRevenue - totalCostOfGoods - totalShippingFees - effectiveAdSpend;
      discountedPrice = Math.round(projectedRevenue / (projectedUnits || 1));
      modeExplanation = `تخفیف پلکانی ۲ تایی (${tier2Discount}٪) و ۳ تایی (${tier3Discount}٪). میانگین ارزش هر سبد افزایش یافته و هزینه ارسال به ازای هر واحد کالا سرشکن و به صرفه می‌شود.`;
      break;
    }

    case 'PRICE_WAR': {
      const competitorTargetPrice = originalPrice * (1 - competitorPriceDropPercent / 100);
      if (priceWarStrategy === 'MATCH_PRICE') {
        discountedPrice = competitorTargetPrice;
        projectedUnits = Math.round(baseVolume * 1.6);
      } else if (priceWarStrategy === 'SPLIT_DIFF') {
        discountedPrice = originalPrice - ((originalPrice - competitorTargetPrice) / 2);
        projectedUnits = Math.round(baseVolume * 1.25);
      } else {
        // HOLD_WITH_GIFT: keep price, offer free express + gift worth 80k
        discountedPrice = originalPrice;
        projectedUnits = Math.round(baseVolume * 1.15);
      }
      projectedRevenue = projectedUnits * discountedPrice;
      totalCostOfGoods = projectedUnits * cost;
      totalShippingFees = projectedUnits * perUnitShippingAndGateway;
      netContributionProfit = projectedRevenue - totalCostOfGoods - totalShippingFees - effectiveAdSpend;
      modeExplanation = `پاسخ به کاهش ${competitorPriceDropPercent}٪ قیمت رقیب در ترب/دیجی‌کالا با استراتژی: ${
        priceWarStrategy === 'MATCH_PRICE' ? 'همسان‌سازی تهاجمی' : priceWarStrategy === 'SPLIT_DIFF' ? 'تخفیف میانگین نصف' : 'دفاع از قیمت با ارزش افزوده و ارسال هدیه'
      }`;
      break;
    }

    case 'LOSS_LEADER': {
      // Main product sold at ultra-low price (e.g. 25% off) but attach rate adds high-margin accessory
      discountedPrice = originalPrice * (1 - discountPercent / 100);
      projectedUnits = Math.round(baseVolume * 2.3);
      const accessoryUnits = Math.round(projectedUnits * (attachRatePercent / 100));

      const mainProductRevenue = projectedUnits * discountedPrice;
      const accessoryRevenue = accessoryUnits * accessoryRetailPrice;
      projectedRevenue = mainProductRevenue + accessoryRevenue;

      const mainCost = projectedUnits * cost;
      const accessoryTotalCost = accessoryUnits * accessoryCost;
      totalCostOfGoods = mainCost + accessoryTotalCost;

      totalShippingFees = projectedUnits * perUnitShippingAndGateway;
      netContributionProfit = projectedRevenue - totalCostOfGoods - totalShippingFees - effectiveAdSpend;
      modeExplanation = `کالای لیدر با تخفیف جذاب، همراه با پیوست خودکار ${attachRatePercent}٪ کالای جانبی پرحاشیه (مارجین ${Math.round(((accessoryRetailPrice - accessoryCost) / accessoryRetailPrice) * 100)}٪). سود از دست رفته به طور کامل با اکسسوری جبران می‌شود.`;
      break;
    }

    default: {
      // STANDARD Elasticity
      const elasticityFactor = 1.6;
      const bundleBonus = isBundleBoost ? 1.35 : 1.0;
      const adVolume = Math.round(effectiveAdSpend / 150000);
      projectedUnits = Math.round((baseVolume * (1 + (discountPercent / 100) * elasticityFactor) * bundleBonus) + adVolume);
      projectedRevenue = projectedUnits * discountedPrice;
      totalCostOfGoods = projectedUnits * cost;
      totalShippingFees = projectedUnits * perUnitShippingAndGateway;
      netContributionProfit = projectedRevenue - totalCostOfGoods - totalShippingFees - effectiveAdSpend;
      modeExplanation = 'سناریوی کلاسیک کشش قیمتی به همراه شتاب باندلینگ و بودجه جذب تبلیغاتی.';
      break;
    }
  }

  const projectedMarginPercent = projectedRevenue > 0 ? (netContributionProfit / projectedRevenue) * 100 : 0;
  const profitDelta = netContributionProfit - baselineNetProfit;

  // Floor Break-even Price Check
  const breakEvenPrice = Math.round(cost + perUnitShippingAndGateway + (effectiveAdSpend / (projectedUnits || 1)));

  // Risk evaluation against Business Rule: Min Margin 18%
  const isViolatingMinMargin = projectedMarginPercent < 18;
  const isExceedingAutoDiscount = discountPercent > 20;

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (isViolatingMinMargin || discountedPrice < breakEvenPrice) {
    riskLevel = 'HIGH';
  } else if (isExceedingAutoDiscount || discountPercent > 18 || fxShockActive) {
    riskLevel = 'MEDIUM';
  }

  const handleApplyCampaign = () => {
    const titles: Record<CampaignMode, string> = {
      STANDARD: `کمپین تخفیف پروموشن برای ${product?.title?.slice(0, 25)}... (${discountPercent}٪ تخفیف)`,
      FLASH_SALE: `حراج صاعقه‌ای ${flashHours} ساعته (${product?.title?.slice(0, 25)}... با سقف ${stockQuota} عدد)`,
      TIERED_VOLUME: `تخفیف پلکانی عمده (${tier2Discount}٪ دو عددی / ${tier3Discount}٪ سه عددی)`,
      PRICE_WAR: `دفاع در برابر رقیب ترب: ${priceWarStrategy} برای ${product?.title?.slice(0, 25)}...`,
      LOSS_LEADER: `پکیج لیدر ${product?.title?.slice(0, 20)}... با ضریب الصاق ${attachRatePercent}٪ اکسسوری`,
    };

    onSendCampaignToApproval(
      titles[campaignMode],
      discountPercent,
      netContributionProfit
    );
  };

  return (
    <div className="space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--border-active)] text-[var(--accent-text)] shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[var(--text-main)]">موتور چندحالته شبیه‌ساز کمپین و سناریوهای بازار</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                شبیه‌سازی حراج صاعقه‌ای، تخفیف پلکانی، جنگ قیمت ترب، کالای لیدر و استرس‌تست شوک‌های کلان بازار
              </p>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] text-xs w-full lg:w-auto">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'SIMULATOR' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            شبیه‌ساز ۵ حالته سود
          </button>
          <button
            onClick={() => setActiveTab('PLANNER')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'PLANNER' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            تقویم رویدادها (یلدا / نوروز)
          </button>
          <button
            onClick={() => setActiveTab('AB_TEST')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'AB_TEST' ? 'bg-[var(--accent-primary)] text-[#F7F3EA] font-bold shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            آزمون A/B هوشمند
          </button>
        </div>
      </div>

      {/* View: Simulator */}
      {activeTab === 'SIMULATOR' && (
        <div className="space-y-6">
          {/* Strategy Mode Archetypes Bar */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {[
              { id: 'STANDARD', label: 'تخفیف کلاسیک پروموشن', icon: Percent, desc: 'کشش قیمتی استاندارد' },
              { id: 'FLASH_SALE', label: 'حراج صاعقه‌ای (Flash Deal)', icon: Flame, desc: 'تایمر معکوس و اضطرار FOMO' },
              { id: 'TIERED_VOLUME', label: 'تخفیف پلکانی ۲ و ۳ عددی', icon: ShoppingBag, desc: 'جهش ارزش سبد خرید (AOV)' },
              { id: 'PRICE_WAR', label: 'جنگ قیمت با ترب / رقیب', icon: Scale, desc: 'محاسبه کف سر‌به‌سر سود' },
              { id: 'LOSS_LEADER', label: 'کالای لیدر + کراس‌سل', icon: Zap, desc: 'جبران تخفیف با اکسسوری ۵۵٪' },
            ].map((st) => {
              const Icon = st.icon;
              const isSelected = campaignMode === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setCampaignMode(st.id as CampaignMode)}
                  className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[var(--accent-soft)]/70 border-[var(--border-active)] ring-1 ring-[var(--border-active)] shadow-md text-[var(--text-main)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] hover:border-[var(--border-active)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{st.label}</span>
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`} />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">{st.desc}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls Column */}
            <div className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
                <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--accent-text)]" />
                  متغیرهای سناریوی {campaignMode}
                </h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-main)]">
                  کف سر‌به‌سر: {formatCurrency(breakEvenPrice, currency)}
                </span>
              </div>

              {/* Product Picker */}
              <div>
                <label className="text-xs font-semibold text-[var(--text-main)] block mb-1">
                  کالای مورد آزمایش:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-active)]"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} (قیمت: {formatCurrency(p.retailPrice, currency)} | خرید: {formatCurrency(p.baseCost, currency)})
                    </option>
                  ))}
                </select>
              </div>

              {/* MODE SPECIFIC CONTROLS */}
              {campaignMode === 'STANDARD' && (
                <div className="space-y-4">
                  <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text-main)]">درصد تخفیف پیشنهادی:</span>
                      <span className={`font-mono font-black text-base ${discountPercent > 20 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {discountPercent}٪
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="1"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full accent-[var(--accent-primary)] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span>۰٪ (کامل)</span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">۲۰٪ (سقف مجاز بدون تأیید)</span>
                      <span>۳۵٪</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)] flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-main)] block">استراتژی باندل هدیه:</span>
                      <span className="text-[11px] text-[var(--text-muted)]">+۳۵٪ تقاضا با حفظ حاشیه سود</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isBundleBoost}
                      onChange={(e) => setIsBundleBoost(e.target.checked)}
                      className="w-5 h-5 accent-[var(--accent-primary)] cursor-pointer rounded shrink-0"
                    />
                  </div>
                </div>
              )}

              {campaignMode === 'FLASH_SALE' && (
                <div className="space-y-4 p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <Flame className="w-4 h-4" />
                    پارامترهای حراج صاعقه‌ای ساعتی
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)] block mb-1">مدت اعتبار حراج:</label>
                      <select
                        value={flashHours}
                        onChange={(e) => setFlashHours(Number(e.target.value))}
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-main)]"
                      >
                        <option value={2}>۲ ساعت (فوق اضطراری)</option>
                        <option value={4}>۴ ساعت (پیک ترافیک عصر)</option>
                        <option value={8}>۸ ساعت</option>
                        <option value={24}>۲۴ ساعت (یک روزه)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--text-muted)] block mb-1">سقف سهمیه کالا (Quota):</label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={stockQuota}
                        onChange={(e) => setStockQuota(Number(e.target.value))}
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-main)]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-main)]">درصد تخفیف حراج صاعقه‌ای:</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{discountPercent}٪</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {campaignMode === 'TIERED_VOLUME' && (
                <div className="space-y-4 p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-text)]">
                    <ShoppingBag className="w-4 h-4" />
                    تنظیم پله‌های تخفیف تعدادی (Volume Tiers)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-[var(--text-muted)] block mb-1">تخفیف خرید ۲ تایی:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          max="25"
                          value={tier2Discount}
                          onChange={(e) => setTier2Discount(Number(e.target.value))}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-main)] font-mono"
                        />
                        <span className="text-[var(--text-muted)]">٪</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-[var(--text-muted)] block mb-1">تخفیف خرید ۳ تایی یا بیشتر:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="10"
                          max="35"
                          value={tier3Discount}
                          onChange={(e) => setTier3Discount(Number(e.target.value))}
                          className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-2 text-xs text-[var(--text-main)] font-mono"
                        />
                        <span className="text-[var(--text-muted)]">٪</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    با افزایش تعداد در هر فاکتور، هزینه پست و بسته‌بندی تنها ۱ بار محاسبه شده و سود سهم‌آور تجمیعی حفظ می‌شود.
                  </p>
                </div>
              )}

              {campaignMode === 'PRICE_WAR' && (
                <div className="space-y-4 p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                    <Scale className="w-4 h-4" />
                    اتاق جنگ قیمت با رقیب ترب / دیجی‌کالا
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-main)]">میزان افت قیمت رقیب در بازار:</span>
                      <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{competitorPriceDropPercent}٪</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={competitorPriceDropPercent}
                      onChange={(e) => setCompetitorPriceDropPercent(Number(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                      قیمت تخریبی رقیب: {formatCurrency(originalPrice * (1 - competitorPriceDropPercent / 100), currency)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[var(--text-main)] block mb-1.5 font-semibold">استراتژی واکنش دفاعی:</label>
                    <div className="space-y-2">
                      {[
                        { id: 'HOLD_WITH_GIFT', label: 'حفظ قیمت فعلی + هدیه اختصاصی و ارسال رایگان', desc: 'محافظت از مارجین و برند' },
                        { id: 'SPLIT_DIFF', label: 'تخفیف میانگین (کاهش نصف اختلاف)', desc: 'کاهش ملایم قیمت' },
                        { id: 'MATCH_PRICE', label: 'همسان‌سازی دقیق با قیمت رقیب', desc: 'حداکثر حجم فروش، ریسک مارجین' },
                      ].map((strat) => (
                        <label
                          key={strat.id}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between gap-2 ${
                            priceWarStrategy === strat.id
                              ? 'bg-rose-500/15 border-rose-500/50 text-rose-800 dark:text-rose-200'
                              : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{strat.label}</span>
                            <span className="text-[10px] opacity-80">{strat.desc}</span>
                          </div>
                          <input
                            type="radio"
                            name="pwar"
                            checked={priceWarStrategy === strat.id}
                            onChange={() => setPriceWarStrategy(strat.id as any)}
                            className="accent-rose-600 shrink-0"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {campaignMode === 'LOSS_LEADER' && (
                <div className="space-y-4 p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-text)]">
                    <Zap className="w-4 h-4" />
                    استراتژی کالای قلاب + متعلقات جانبی سودآور
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-main)]">درصد الصاق اکسسوری به سبد (Attach Rate):</span>
                      <span className="font-mono font-bold text-[var(--accent-text)]">{attachRatePercent}٪</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="80"
                      value={attachRatePercent}
                      onChange={(e) => setAttachRatePercent(Number(e.target.value))}
                      className="w-full accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">هزینه تأمین اکسسوری:</span>
                      <span className="font-mono font-bold text-[var(--text-main)]">{formatCurrency(accessoryCost, currency)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block">قیمت فروش اکسسوری:</span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(accessoryRetailPrice, currency)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Marketing Ad Spend Allocation */}
              <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[var(--text-main)]">بودجه تبلیغات و جذب مشتری (Marketing Ad Spend):</span>
                  <span className="font-mono font-bold text-[var(--text-main)]">
                    {formatCurrency(effectiveAdSpend, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000000"
                  max="25000000"
                  step="1000000"
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full accent-[var(--accent-primary)] cursor-pointer"
                />
              </div>

              {/* MACRO MARKET STRESS-TEST TOGGLES */}
              <div className="p-4 rounded-xl bg-[var(--bg-card)]/80 border border-[var(--border-active)] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--accent-text)]">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    استرس‌تست شوک‌های کلان بازار (Macro Shocks):
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">آزمون تاب‌آوری</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFxShockActive(!fxShockActive)}
                    className={`p-2.5 rounded-lg border text-right transition-all ${
                      fxShockActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-800 dark:text-amber-200 font-bold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>جهش دلار (+۱۵٪ خرید)</span>
                    <span className="block text-[10px] opacity-80">{fxShockActive ? 'فعال' : 'عادی'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShippingPeakActive(!shippingPeakActive)}
                    className={`p-2.5 rounded-lg border text-right transition-all ${
                      shippingPeakActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-800 dark:text-amber-200 font-bold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>پیک پست (+۴۰٪ ارسال)</span>
                    <span className="block text-[10px] opacity-80">{shippingPeakActive ? 'فعال' : 'عادی'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdInflationActive(!adInflationActive)}
                    className={`p-2.5 rounded-lg border text-right transition-all ${
                      adInflationActive
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-800 dark:text-amber-200 font-bold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>تورم تبلیغ (+۲۵٪ CAC)</span>
                    <span className="block text-[10px] opacity-80">{adInflationActive ? 'فعال' : 'عادی'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Simulation & Waterfall Output Dashboard */}
            <div className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-active)] space-y-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-[var(--border-color)]">
                  <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    خروجی و تفکیک آبشاری سود سهم‌آور (Waterfall Breakdown)
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    riskLevel === 'HIGH' ? 'bg-rose-600 text-white' : riskLevel === 'MEDIUM' ? 'bg-amber-500 text-[#182B22]' : 'bg-emerald-600 text-white'
                  }`}>
                    ریسک سناریو: {riskLevel}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)] mb-4 p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  {modeExplanation}
                </p>

                {/* Waterfall Financial Metrics */}
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">قیمت فروش مؤثر هر واحد:</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{formatCurrency(discountedPrice, currency)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">تعداد واحدهای فروخته شده پیش‌بینی:</span>
                    <div className="text-right font-mono">
                      <span className="font-bold text-teal-700 dark:text-teal-300">{projectedUnits} عدد</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">(عادی: {baseVolume} عدد)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">فروش کل ناخالص (Gross Revenue):</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{formatCurrency(projectedRevenue, currency)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                    <span>کسورات بهای خرید کالا (COGS):</span>
                    <span className="font-mono font-semibold">- {formatCurrency(totalCostOfGoods, currency)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                    <span>هزینه بسته‌بندی، ارسال و درگاه:</span>
                    <span className="font-mono font-semibold">- {formatCurrency(totalShippingFees, currency)}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
                    <span>هزینه مستقیم تبلیغات و جذب:</span>
                    <span className="font-mono font-semibold">- {formatCurrency(effectiveAdSpend, currency)}</span>
                  </div>

                  {/* Net Contribution Profit HERO */}
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">سود سهم‌آور خالص سناریو:</span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        تفاوت نسبت به وضعیت عادی: {profitDelta >= 0 ? '+' : ''}{formatCurrency(profitDelta, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                        {formatCurrency(netContributionProfit, currency)}
                      </span>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 block font-mono">
                        مارجین خالص: {formatPercent(projectedMarginPercent)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rule Policy Check Box */}
                <div className={`mt-4 p-3.5 rounded-xl border text-xs space-y-1 ${
                  riskLevel === 'HIGH'
                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-800 dark:text-rose-200'
                    : riskLevel === 'MEDIUM'
                    ? 'bg-amber-500/15 border-amber-500/35 text-amber-800 dark:text-amber-200'
                    : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-800 dark:text-emerald-200'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    ارزیابی انطباق با قوانین کسب‌وکار (Rule Guardrails):
                  </div>
                  <p>
                    {riskLevel === 'HIGH' 
                      ? 'این سناریو حاشیه سود را به زیر ۱۸٪ می‌رساند یا از مرز کف سر‌به‌سر عبور می‌کند. نیازمند تایید دستی ناظر در صف تأیید است.'
                      : riskLevel === 'MEDIUM'
                      ? 'سناریو در آستانه سقف تخفیف خودکار یا تحت شوک هزینه‌ای قرار دارد و نیازمند تأیید کوپایلوت ناظر می‌باشد.'
                      : 'سناریو کاملاً با سیاست‌های سودآوری و حاشیه سود پایدار منطبق است و توسط اتوپایلوت بدون وقفه اجرا می‌شود.'}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-[var(--border-color)]">
                <button
                  onClick={handleApplyCampaign}
                  className="w-full py-3.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[#F7F3EA] font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <Play className="w-4 h-4" />
                  {riskLevel === 'HIGH' ? 'ارسال سناریو به صف تأیید ناظر' : 'اجرا و راه‌اندازی کمپین با اتوپایلوت'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View: Planner (Yalda, Nowruz, Black Friday) */}
      {activeTab === 'PLANNER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{evt.icon}</span>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-main)]">{evt.nameFa}</h3>
                    <span className="text-xs text-[var(--text-muted)]">{evt.dateStr} • {evt.daysRemaining} روز مانده</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] text-[var(--text-muted)] block">آمادگی (Readiness):</span>
                  <span className={`text-base font-black font-mono ${
                    evt.readinessScore > 75 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {evt.readinessScore}٪
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--bg-main)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                <div
                  className={`h-full rounded-full transition-all ${
                    evt.readinessScore > 75 ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${evt.readinessScore}%` }}
                />
              </div>

              {/* Missing gaps checklist */}
              <div>
                <span className="text-xs font-bold text-[var(--text-main)] block mb-2">نواقص و چالش‌های حل نشده (Gaps):</span>
                <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
                  {evt.missingItems.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-card)]/70 border border-[var(--border-color)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested action */}
              <div className="p-3 rounded-xl bg-[var(--accent-soft)]/60 border border-[var(--border-active)] text-xs text-[var(--text-main)]">
                <span className="font-bold text-[var(--accent-text)] block mb-0.5">اقدام پیشنهادی اتوپایلوت:</span>
                {evt.suggestedAction}
              </div>

              <button
                onClick={() => {
                  setActiveTab('SIMULATOR');
                  setCampaignMode('FLASH_SALE');
                }}
                className="w-full py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[var(--accent-text)] text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                شبیه‌سازی سناریوی تخفیف برای این مناسبت
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View: A/B Testing */}
      {activeTab === 'AB_TEST' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                <Split className="w-5 h-5 text-[var(--accent-text)]" />
                موتور تست A/B صفحات، تیترها و قیمت‌گذاری کالا
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                تخصیص ترافیک هوشمند بر اساس روش چندبازویی (Multi-Armed Bandit) برای بیشینه‌سازی نرخ تبدیل
              </p>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35">
              فعال برای ۳ کالا
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--accent-text)]">نسخه A (کنترل استاندارد):</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">ترافیک: ۵۰٪</span>
              </div>
              <p className="text-xs text-[var(--text-main)] font-semibold">عنوان: ساعت هوشمند الترا پرو X9</p>
              <div className="text-xs text-[var(--text-muted)]">قیمت: ۲,۸۵۰,۰۰۰ تومان | تخفیف: ۰٪</div>
              <div className="pt-3 border-t border-[var(--border-color)] text-xs font-mono text-[var(--text-main)] flex justify-between">
                <span>نرخ تبدیل: ۲.۴٪</span>
                <span className="text-[var(--text-muted)]">سود کل: ۱۲.۲M تومان</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[var(--accent-soft)]/50 border border-[var(--border-active)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[var(--accent-text)]">نسخه B (آزمایشی با ارزش افزوده):</span>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35">
                  برنده قاطع (+۳۱٪ سود)
                </span>
              </div>
              <p className="text-xs text-[var(--text-main)] font-semibold">عنوان: ساعت هوشمند اولترا X9 + گلس و بند اضافه رایگان</p>
              <div className="text-xs text-[var(--text-muted)]">قیمت: ۲,۹۵۰,۰۰۰ تومان (باندل همراه با ارزش افزوده)</div>
              <div className="pt-3 border-t border-[var(--border-color)] text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold flex justify-between">
                <span>نرخ تبدیل: ۳.۸٪</span>
                <span>سود کل: ۱۶.۴M تومان</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
