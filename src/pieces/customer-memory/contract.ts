/**
 * Type Augmentation for Customer Memory Piece
 * Extends the global COCA.EventRegistry without modifying shared core files.
 */

declare global {
  namespace COCA {
    interface EventRegistry {
      'v1.memory.cleared': { customerId: string; timestamp: number };
      'v1.memory.updated': { customerId: string; activeCount: number; updatedAt: string };
    }
  }
}

export interface CustomerMemorySnapshot {
  customerId: string;
  isPersonalizationEnabled: boolean;
  preferences: {
    colorPreferences: string[];
    dislikedAttributes: string[];
    priceCeilingToman?: number;
    preferredCategories: string[];
  };
  giftProfiles: Array<{
    id: string;
    recipientName: string;
    relationship: string;
    occasion: string;
    budget: number;
    notes?: string;
  }>;
  encryptionBadge: {
    algorithm: string;
    isZeroPlaintext: boolean;
    storageMode: string;
  };
}
