/**
 * Type Augmentation for Dropship Dispatcher Piece
 */

declare global {
  namespace COCA {
    interface EventRegistry {
      'v1.dropship.slip_generated': { orderId: string; supplierId: string; courier: string; trackingCode: string };
      'v1.dropship.tracking_assigned': { orderId: string; trackingCode: string };
    }
  }
}

export {};
