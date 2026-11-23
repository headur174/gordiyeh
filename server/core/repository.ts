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
 * SqliteProductRepository
 * Asynchronous Clean Port Implementation for Products
 */
class SqliteProductRepository implements IProductRepository {
  async getProducts(): Promise<CanonicalProduct[]> {
    return CommerceDB.getProducts();
  }
  async getProductById(id: string): Promise<CanonicalProduct | null> {
    return CommerceDB.getProductById(id);
  }
  async saveProduct(product: CanonicalProduct): Promise<void> {
    CommerceDB.saveProduct(product);
  }
  async deleteProduct(id: string): Promise<void> {
    if ((CommerceDB as any).deleteProduct) {
      (CommerceDB as any).deleteProduct(id);
    }
  }
}

/**
 * SqliteOrderRepository
 * Asynchronous Clean Port Implementation for Orders
 */
class SqliteOrderRepository implements IOrderRepository {
  async getOrders(): Promise<any[]> {
    return CommerceDB.getOrders();
  }
  async lookupOrder(query: string, opts?: { allowSubstring?: boolean }): Promise<any | null> {
    return CommerceDB.lookupOrder(query, opts);
  }
  async createOrder(order: any): Promise<any> {
    return CommerceDB.createOrder(order);
  }
  async updateOrderStatus(id: string, status: string): Promise<void> {
    const existing = await this.lookupOrder(id);
    if (existing) {
      existing.status = status;
      await this.createOrder(existing);
    }
  }
}

/**
 * SqliteRuleRepository
 */
class SqliteRuleRepository implements IRuleRepository {
  async getRules(): Promise<BusinessRule[]> {
    return CommerceDB.getBootstrap().rules || [];
  }
  async saveRules(rules: BusinessRule[]): Promise<void> {
    CommerceDB.saveRules(rules);
  }
  async updateRule(id: string, patch: Partial<BusinessRule>): Promise<BusinessRule | null> {
    return CommerceDB.updateRule(id, patch);
  }
  async getAutomationMatrix(): Promise<AutomationMatrix> {
    return CommerceDB.getBootstrap().automationMatrix;
  }
  async saveAutomationMatrix(matrix: AutomationMatrix): Promise<void> {
    CommerceDB.saveAutomationMatrix(matrix);
  }
  async getApprovals(): Promise<ApprovalItem[]> {
    return CommerceDB.getBootstrap().approvals || [];
  }
  async updateApprovalStatus(id: string, status: "APPROVED" | "REJECTED" | string, reason?: string): Promise<void> {
    CommerceDB.updateApprovalStatus(id, status as "APPROVED" | "REJECTED", reason);
  }
  async getDecisionLogs(): Promise<DecisionLog[]> {
    return CommerceDB.getBootstrap().decisionLogs || [];
  }
  async addDecisionLog(log: DecisionLog): Promise<void> {
    if ((CommerceDB as any).addDecisionLog) {
      (CommerceDB as any).addDecisionLog(log);
    }
  }
}

/**
 * SqliteCustomerMemoryRepository
 */
class SqliteCustomerMemoryRepository implements ICustomerMemoryRepository {
  async getCustomerMemory(customerId: string): Promise<any> {
    return CommerceDB.getCustomerMemory(customerId);
  }
  async saveCustomerMemory(customerId: string, data: any): Promise<any> {
    return CommerceDB.saveCustomerMemory(customerId, data);
  }
  async resetCustomerMemory(customerId: string): Promise<boolean> {
    return CommerceDB.resetCustomerMemory(customerId).success;
  }
}

/**
 * SqliteSiteConfigRepository
 */
class SqliteSiteConfigRepository implements ISiteConfigRepository {
  async getSiteConfig(): Promise<SiteConfig> {
    return CommerceDB.getSiteConfig();
  }
  async saveSiteConfig(config: SiteConfig): Promise<void> {
    CommerceDB.saveSiteConfig(config);
  }
  async getBlogPosts(): Promise<BlogPost[]> {
    return CommerceDB.getBootstrap().blogPosts || [];
  }
  async saveBlogPost(post: BlogPost): Promise<void> {
    CommerceDB.saveBlogPost(post);
  }
  async deleteBlogPost(id: string): Promise<void> {
    CommerceDB.deleteBlogPost(id);
  }
}

/**
 * SqliteManualTaskRepository
 */
class SqliteManualTaskRepository implements IManualTaskRepository {
  async getManualTasks(): Promise<ManualTask[]> {
    return CommerceDB.getManualTasks();
  }
  async saveManualTask(task: ManualTask): Promise<void> {
    CommerceDB.saveManualTask(task);
  }
  async updateManualTaskStatus(id: string, status: string, note?: string): Promise<void> {
    CommerceDB.updateManualTaskStatus(id, status, note);
  }
}

/**
 * SqliteIntegrationRepository
 */
class SqliteIntegrationRepository implements IIntegrationRepository {
  async getIntegrations(): Promise<any[]> {
    return CommerceDB.getBootstrap().integrations || [];
  }
  async saveIntegration(item: any): Promise<void> {
    CommerceDB.saveIntegration(item.provider, item.config);
  }
  async deleteIntegration(id: string): Promise<void> {
    CommerceDB.deleteWebhook(id);
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

  public async getBootstrap(): Promise<any> {
    return CommerceDB.getBootstrap();
  }
}

export const commerceRepo: ICommerceRepository = new SqliteCommerceRepository();
