import { CommerceDB } from "../db";
import {
  ICommerceRepository,
  IProductRepository,
  IOrderRepository,
  IRuleRepository,
  ICustomerMemoryRepository,
  ISiteConfigRepository,
  IManualTaskRepository,
  IIntegrationRepository
} from "./interfaces";
import { CanonicalProduct, BusinessRule, AutomationMatrix, ApprovalItem, DecisionLog, ManualTask } from "../../src/types";
import { SiteConfig, BlogPost } from "../../src/utils/cmsStore";

/**
 * SqliteCommerceRepository:
 * Implements Hexagonal Architecture Port for SQLite.
 * In a future phase or upon DB scaling, this can be seamlessly swapped
 * with a PostgresCommerceRepository implementing the identical ICommerceRepository port.
 */
class SqliteProductRepository implements IProductRepository {
  getProducts(): CanonicalProduct[] {
    return CommerceDB.getProducts();
  }
  getProductById(id: string): CanonicalProduct | null {
    return CommerceDB.getProductById(id);
  }
  saveProduct(product: CanonicalProduct): void {
    CommerceDB.saveProduct(product);
  }
  deleteProduct(id: string): void {
    // If delete exists or fallback to stock = 0
    if ((CommerceDB as any).deleteProduct) {
      (CommerceDB as any).deleteProduct(id);
    }
  }
}

class SqliteOrderRepository implements IOrderRepository {
  getOrders(): any[] {
    return CommerceDB.getOrders();
  }
  lookupOrder(query: string): any | null {
    return CommerceDB.lookupOrder(query);
  }
  createOrder(order: any): void {
    CommerceDB.createOrder(order);
  }
  updateOrderStatus(id: string, status: string): void {
    // Can update order status in DB
    const existing = this.lookupOrder(id);
    if (existing) {
      existing.status = status;
      CommerceDB.createOrder(existing);
    }
  }
}

class SqliteRuleRepository implements IRuleRepository {
  getRules(): BusinessRule[] {
    return CommerceDB.getBootstrap().rules || [];
  }
  saveRules(rules: BusinessRule[]): void {
    CommerceDB.saveRules(rules);
  }
  updateRule(id: string, patch: Partial<BusinessRule>): BusinessRule | null {
    return CommerceDB.updateRule(id, patch);
  }
  getAutomationMatrix(): AutomationMatrix {
    return CommerceDB.getBootstrap().automationMatrix;
  }
  saveAutomationMatrix(matrix: AutomationMatrix): void {
    CommerceDB.saveAutomationMatrix(matrix);
  }
  getApprovals(): ApprovalItem[] {
    return CommerceDB.getBootstrap().approvals || [];
  }
  updateApprovalStatus(id: string, status: "APPROVED" | "REJECTED" | string, reason?: string): void {
    CommerceDB.updateApprovalStatus(id, status as "APPROVED" | "REJECTED", reason);
  }
  getDecisionLogs(): DecisionLog[] {
    return CommerceDB.getBootstrap().decisionLogs || [];
  }
  addDecisionLog(log: DecisionLog): void {
    if ((CommerceDB as any).addDecisionLog) {
      (CommerceDB as any).addDecisionLog(log);
    }
  }
}

class SqliteCustomerMemoryRepository implements ICustomerMemoryRepository {
  getCustomerMemory(customerId: string): any {
    return (CommerceDB as any).getCustomerMemory(customerId);
  }
  saveCustomerMemory(customerId: string, data: any): any {
    return (CommerceDB as any).saveCustomerMemory(customerId, data);
  }
  resetCustomerMemory(customerId: string): boolean {
    return (CommerceDB as any).resetCustomerMemory(customerId);
  }
}

class SqliteSiteConfigRepository implements ISiteConfigRepository {
  getSiteConfig(): SiteConfig {
    return CommerceDB.getSiteConfig();
  }
  saveSiteConfig(config: SiteConfig): void {
    CommerceDB.saveSiteConfig(config);
  }
  getBlogPosts(): BlogPost[] {
    return CommerceDB.getBootstrap().blogPosts || [];
  }
  saveBlogPost(post: BlogPost): void {
    CommerceDB.saveBlogPost(post);
  }
  deleteBlogPost(id: string): void {
    if ((CommerceDB as any).deleteBlogPost) {
      (CommerceDB as any).deleteBlogPost(id);
    }
  }
}

class SqliteManualTaskRepository implements IManualTaskRepository {
  getManualTasks(): ManualTask[] {
    return (CommerceDB as any).getManualTasks();
  }
  saveManualTask(task: ManualTask): void {
    (CommerceDB as any).saveManualTask(task);
  }
  updateManualTaskStatus(id: string, status: string, note?: string): void {
    (CommerceDB as any).updateManualTaskStatus(id, status, note);
  }
}

class SqliteIntegrationRepository implements IIntegrationRepository {
  getIntegrations(): any[] {
    return (CommerceDB as any).getIntegrations?.() || [];
  }
  saveIntegration(item: any): void {
    (CommerceDB as any).saveIntegration?.(item);
  }
  deleteIntegration(id: string): void {
    (CommerceDB as any).deleteIntegration?.(id);
  }
}

export class SqliteCommerceRepository implements ICommerceRepository {
  public products = new SqliteProductRepository();
  public orders = new SqliteOrderRepository();
  public rules = new SqliteRuleRepository();
  public customerMemory = new SqliteCustomerMemoryRepository();
  public siteConfig = new SqliteSiteConfigRepository();
  public manualTasks = new SqliteManualTaskRepository();
  public integrations = new SqliteIntegrationRepository();

  public getBootstrap(): any {
    return CommerceDB.getBootstrap();
  }
}

// Global Repository Singleton Export (Hexagonal Adapter)
export const commerceRepo: ICommerceRepository = new SqliteCommerceRepository();
