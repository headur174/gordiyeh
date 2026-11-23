export type Currency = 'TOMAN' | 'USD';
export type MarketMode = 'IRAN' | 'GLOBAL';
export type AutomationLevel = 'AUTOPILOT' | 'COPILOT' | 'MANUAL';

export type NetworkResilienceMode = 'GLOBAL' | 'INTRANET' | 'AIRGAP_OFFLINE';

export type ManualTaskCategory = 
  | 'CARD_TO_CARD' 
  | 'SMS_DISPATCH' 
  | 'SUPPLIER_CALL' 
  | 'OFFLINE_INVOICE' 
  | 'OFFLINE_ORDER_SYNC';

export type ManualTaskPriority = 'CRITICAL' | 'HIGH' | 'NORMAL';
export type ManualTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ManualTask {
  id: string;
  title: string;
  category: ManualTaskCategory;
  priority: ManualTaskPriority;
  status: ManualTaskStatus;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  description: string;
  actionRequired: string;
  templateText?: string;
  metadata?: {
    cardLast4?: string;
    trackingCode?: string;
    supplierName?: string;
    supplierPhone?: string;
    itemsCount?: number;
    platform?: 'SMS' | 'BALE' | 'EITAA' | 'RUBIKA' | 'PHONE';
  };
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  completionNote?: string;
}

export interface SupplierOffer {
  id: string;
  supplierId: string;
  supplierName: string;
  offerPrice: number;
  costPrice?: number;
  stock: number;
  leadTimeHours: number;
  reliabilityScore: number; // 0 - 100
  rating?: number; // 0 - 5
  fulfillmentRate: number; // %
  dispatchTimeHours: number;
  returnRate: number; // %
  complaintRate: number; // %
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  rating: number; // 0 - 5
  fulfillmentRate: number; // %
  stockAccuracy: number; // %
  avgDispatchHours: number;
  returnRate: number; // %
  complaintRate: number; // %
  priceCompetitiveness: number; // 0 - 100
  status: 'ACTIVE' | 'LIMITED' | 'BLACK_LISTED';
  categories: string[];
  failureRate: number; // %
  phone?: string;
  website?: string;
  notes?: string;
}

export interface ProductDNA {
  demandScore: number; // 0 - 100
  competitionDensity: 'LOW' | 'MEDIUM' | 'HIGH';
  priceElasticity: number; // e.g. -1.4
  currentMarginPercent: number; // %
  supplierReliability: number; // 0 - 100
  returnRiskScore: number; // 0 - 100
  deliveryQuality: number; // 0 - 100
  seasonalityTrend: 'STABLE' | 'UPWARD' | 'PEAK' | 'DECLINING';
  customerSegment: string;
  eventAffinity: {
    yalda: number;
    nowruz: number;
    blackFriday: number;
    valentine: number;
  };
}

export interface ProductColorVariant {
  name: string;
  hex: string;
  inStock: boolean;
}

export interface SpecItem {
  key: string;
  value: string;
  title?: string;
}

export interface SpecGroup {
  group: string;
  items: SpecItem[];
}

export interface ProductReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  title: string;
  comment: string;
  isBuyer: boolean;
  likes: number;
}

export interface CanonicalProduct {
  id: string;
  slug?: string;
  updatedAt?: string;
  title: string;
  titleEn: string;
  description?: string;
  sku: string;
  category: string;
  subCategory?: string;
  brand?: string;
  brandFa?: string;
  image: string;
  gallery?: string[];
  retailPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  baseCost: number;
  targetMargin: number; // %
  minMargin: number; // %
  status: 'PUBLISHED' | 'UNPUBLISHED' | 'OUT_OF_STOCK' | 'KILL_LIST';
  winnerScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  rating?: number;
  ratingCount?: number;
  warranty?: string;
  seoTitle?: string;
  seoDescription?: string;
  usageContexts?: Array<{ title: string; description: string }>;
  suitableFor?: string;
  notSuitableFor?: string;
  testExchangeBox?: {
    testWindow: string;
    covered: string;
    notCovered: string;
  };
  colors?: ProductColorVariant[];
  keyFeatures?: string[];
  specs?: SpecGroup[];
  expertReview?: {
    summary: string;
    pros: string[];
    cons: string[];
    intro?: string;
    verdict?: string;
  };
  reviews?: ProductReview[];
  evidence: string[];
  supplierOffers: SupplierOffer[];
  selectedOfferId: string;
  dna: ProductDNA;
  isFeatured: boolean;
  totalSold30d: number;
  marketMedianPrice: number;
}

export interface BusinessRule {
  id: string;
  name: string;
  nameFa: string;
  category: 'PRICING' | 'INVENTORY' | 'SUPPLIER' | 'ORDERS' | 'RISK' | 'CAMPAIGN';
  conditionDescription: string;
  thresholdValue: number | string;
  thresholdUnit?: string;
  action: 'AUTO_APPLY' | 'APPROVAL_QUEUE' | 'AUTO_UNPUBLISH' | 'AUTO_FEATURE' | 'LIMIT_SUPPLIER';
  actionFa: string;
  isEnabled: boolean;
  isSystemCore: boolean;
}

export interface AutomationMatrix {
  pricing: AutomationLevel;
  inventorySync: AutomationLevel;
  orderRouting: AutomationLevel;
  supplierSwitching: AutomationLevel;
  campaigns: AutomationLevel;
  highValueRefunds: AutomationLevel;
}

export interface ApprovalItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'RECOMMENDED';
  productTitle: string;
  productId?: string;
  actionType: string;
  reason: string;
  evidence: string[];
  expectedImpact: string;
  riskScore: number; // 0 - 100
  currentValue: string;
  proposedValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  ruleRefId?: string;
  category: 'PRICING' | 'INVENTORY' | 'SUPPLIER' | 'ORDERS' | 'RISK' | 'CAMPAIGN' | 'AI_STRATEGY';
}

export interface DecisionLog {
  id: string;
  timestamp: string;
  eventTrigger: string;
  decisionTaken: string;
  reason: string;
  evidence: string[];
  ruleMatched: string;
  status: 'AUTO_APPLIED' | 'APPROVED_BY_OPERATOR' | 'REJECTED_BY_OPERATOR' | 'RULE_CREATED';
  outcome: string;
  operatorNote?: string;
}

export interface OrderItem {
  id: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface CartItem {
  product: CanonicalProduct;
  quantity: number;
}

export interface CustomerCheckoutData {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  paymentMethod: 'SHAPARAK' | 'COD' | 'CARD_TO_CARD';
  voucherCode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  province?: string;
  city?: string;
  address?: string;
  shippingMethod?: string;
  deliveryTimeSlot?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  totalAmount: number;
  shippingCost: number;
  paymentFee: number;
  discountAmount: number;
  supplierCost: number;
  marketingAllocation: number;
  contributionProfit: number;
  marginPercent: number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FULFILLING' | 'DELIVERED' | 'HIGH_RISK_HOLD' | 'REFUNDED' | 'CANCELLED';
  riskScore: number;
  routingSupplier: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  nameFa: string;
  dateStr: string;
  daysRemaining: number;
  icon: string;
  readinessScore: number; // 0 - 100
  missingItems: string[];
  activeCampaignsCount: number;
  targetRevenue: number;
  suggestedAction: string;
}

export interface StoreFinancialSummary {
  todayRevenue: number;
  todayContributionProfit: number;
  todayOrdersCount: number;
  averageOrderValue: number;
  profitMarginPercent: number;
  winnersCount: number;
  problemsCount: number;
  stockIssuesCount: number;
  priceOpportunitiesCount: number;
  campaignOpportunitiesCount: number;
}

export type SupervisorAlertCategory =
  | 'BESTSELLER_OUT_OF_STOCK'
  | 'COMPETITOR_PRICE_SPIKE'
  | 'HIGH_RISK_ORDER'
  | 'SUPPLIER_RISK'
  | 'SYSTEM';

export type SupervisorAlertSeverity = 'CRITICAL' | 'HIGH' | 'WARNING';

export interface SupervisorNotificationMetrics {
  currentStock?: number;
  thresholdStock?: number;
  currentPrice?: number;
  competitorPrice?: number;
  previousCompetitorPrice?: number;
  deltaPercent?: number;
  fallbackOfferId?: string;
  fallbackSupplierName?: string;
  fallbackStock?: number;
  orderNumber?: string;
  riskScore?: number;
}

export interface SupervisorNotification {
  id: string;
  dedupeKey: string;
  category: SupervisorAlertCategory;
  severity: SupervisorAlertSeverity;
  title: string;
  message: string;
  productId?: string;
  productTitle?: string;
  sku?: string;
  metrics?: SupervisorNotificationMetrics;
  recommendedActionLabel?: string;
  targetTab?: string;
  createdAt: string;
  timestampMs: number;
  isRead: boolean;
  isResolved: boolean;
  source: 'REACT_REACTIVE_WATCHER' | 'SERVER_EVENT_BUS' | 'RULE_ENGINE_SCAN';
}

