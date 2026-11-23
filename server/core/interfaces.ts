import {
  CanonicalProduct,
  BusinessRule,
  AutomationMatrix,
  ApprovalItem,
  DecisionLog,
  ManualTask
} from "../../src/types";
import { SiteConfig, BlogPost } from "../../src/utils/cmsStore";

export interface IProductRepository {
  getProducts(): Promise<CanonicalProduct[]>;
  getProductById(id: string): Promise<CanonicalProduct | null>;
  saveProduct(product: CanonicalProduct): Promise<void>;
  deleteProduct(id: string): Promise<void>;
}

export interface IOrderRepository {
  getOrders(): Promise<any[]>;
  lookupOrder(query: string, opts?: { allowSubstring?: boolean }): Promise<any | null>;
  createOrder(order: any): Promise<any>;
  updateOrderStatus(id: string, status: string): Promise<void>;
}

export interface IRuleRepository {
  getRules(): Promise<BusinessRule[]>;
  saveRules(rules: BusinessRule[]): Promise<void>;
  updateRule(id: string, patch: Partial<BusinessRule>): Promise<BusinessRule | null>;
  getAutomationMatrix(): Promise<AutomationMatrix>;
  saveAutomationMatrix(matrix: AutomationMatrix): Promise<void>;
  getApprovals(): Promise<ApprovalItem[]>;
  updateApprovalStatus(id: string, status: "APPROVED" | "REJECTED" | string, reason?: string): Promise<void>;
  getDecisionLogs(): Promise<DecisionLog[]>;
  addDecisionLog(log: DecisionLog): Promise<void>;
}

export interface ICustomerMemoryRepository {
  getCustomerMemory(customerId: string): Promise<any>;
  saveCustomerMemory(customerId: string, data: any): Promise<any>;
  resetCustomerMemory(customerId: string): Promise<boolean>;
}

export interface ISiteConfigRepository {
  getSiteConfig(): Promise<SiteConfig>;
  saveSiteConfig(config: SiteConfig): Promise<void>;
  getBlogPosts(): Promise<BlogPost[]>;
  saveBlogPost(post: BlogPost): Promise<void>;
  deleteBlogPost(id: string): Promise<void>;
}

export interface IManualTaskRepository {
  getManualTasks(): Promise<ManualTask[]>;
  saveManualTask(task: ManualTask): Promise<void>;
  updateManualTaskStatus(id: string, status: string, note?: string): Promise<void>;
}

export interface IIntegrationRepository {
  getIntegrations(): Promise<any[]>;
  saveIntegration(item: any): Promise<void>;
  deleteIntegration(id: string): Promise<void>;
}

export interface ICommerceRepository {
  products: IProductRepository;
  orders: IOrderRepository;
  rules: IRuleRepository;
  customerMemory: ICustomerMemoryRepository;
  siteConfig: ISiteConfigRepository;
  manualTasks: IManualTaskRepository;
  integrations: IIntegrationRepository;
  getBootstrap(): Promise<any>;
}
