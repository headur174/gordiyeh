/**
 * COCA Global Event Registry Contracts
 * Uses TypeScript Global Type Augmentation so autonomous pieces can register their
 * event schemas without causing Git merge conflicts on shared contract files.
 */

declare global {
  namespace COCA {
    // Base Event Registry interface - augmented dynamically by autonomous pieces
    interface EventRegistry {
      // Core Kernel Events
      'v1.kernel.ready': { timestamp: number; activePieces: string[] };
      'v1.kernel.error': { source: string; error: string; timestamp: number };
      'v1.security.vault_active': { algorithm: string; zeroPlaintextVerified: boolean };
    }

    // Standardized Envelope format for all bus transmissions
    interface EventEnvelope<K extends keyof EventRegistry = keyof EventRegistry> {
      id: string;
      topic: K;
      emitterPieceId: string;
      timestamp: number;
      payload: EventRegistry[K];
      signature?: string;
    }

    // Piece security manifest declaration
    interface PieceManifest {
      id: string;
      name: string;
      version: string;
      description?: string;
      category: 'core' | 'commerce' | 'ai' | 'finance' | 'fulfillment' | 'privacy';
      grid: {
        defaultSpan: 'third' | 'half' | 'two-thirds' | 'full';
        minSpan?: 'third' | 'half';
        maxSpan?: 'half' | 'full';
      };
      security: {
        allowedEmits: Array<keyof EventRegistry | string>;
        allowedSubscribes: Array<keyof EventRegistry | string>;
      };
      isOptional?: boolean;
      fallbackBehavior?: 'silent_hide' | 'skeleton' | 'error_notice';
    }
  }
}

export {};
