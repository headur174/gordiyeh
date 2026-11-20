/**
 * Type Augmentation for Video Intelligence Piece
 */

declare global {
  namespace COCA {
    interface EventRegistry {
      'v1.video.impression': { productId: string; videoCount: number };
      'v1.video.played': { productId: string; videoId: string; platform: string };
    }
  }
}

export {};
