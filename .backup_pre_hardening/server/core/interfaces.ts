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
  getProducts(): CanonicalProduct[];
  getProductById(id: string): CanonicalProduct | null;
  saveProduct(product: CanonicalProduct): void;
  deleteProduct(id: string): void;
}

export interface IOrderRepository {
  getOrders(): any[];
  lookupOrder(query: string): any | null;
  createOrder(order: any): void;
  updateOrderStatus(id: string, status: string): void;
}

export interface IRuleRepository {
  getRules(): BusinessRule[];
  saveRules(rules: BusinessRule[]): void;
  updateRule(id: string, patch: Partial<BusinessRule>): BusinessRule | null;
  getAutomationMatrix(): AutomationMatrix;
  saveAutomationMatrix(matrix: AutomationMatrix): void;
  getApprovals(): ApprovalItem[];
  updateApprovalStatus(id: string, status: "APPROVED" | "REJECTED" | string, reason?: string): void;
  getDecisionLogs(): DecisionLog[];
  addDecisionLog(log: DecisionLog): void;
}

export interface ICustomerMemoryRepository {
  getCustomerMemory(customerId: string): any;
  saveCustomerMemory(customerId: string, data: any): any;
  resetCustomerMemory(customerId: string): boolean;
}

export interface ISiteConfigRepository {
  getSiteConfig(): SiteConfig;
  saveSiteConfig(config: SiteConfig): void;
  getBlogPosts(): BlogPost[];
  saveBlogPost(post: BlogPost): void;
  deleteBlogPost(id: string): void;
}

export interface IManualTaskRepository {
  getManualTasks(): ManualTask[];
  saveManualTask(task: ManualTask): void;
  updateManualTaskStatus(id: string, status: string, note?: string): void;
}

export interface IIntegrationRepository {
  getIntegrations(): any[];
  saveIntegration(item: any): void;
  deleteIntegration(id: string): void;
}

export interface ICommerceRepository {
  products: IProductRepository;
  orders: IOrderRepository;
  rules: IRuleRepository;
  customerMemory: ICustomerMemoryRepository;
  siteConfig: ISiteConfigRepository;
  manualTasks: IManualTaskRepository;
  integrations: IIntegrationRepository;
  getBootstrap(): any;
}
