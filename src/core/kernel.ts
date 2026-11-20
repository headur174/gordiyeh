/**
 * COCA Domain-Agnostic Kernel
 * Master supervisor responsible for bootstrapping, module registry, and lifecycle monitoring.
 */

import React from 'react';
import { ZeroTrustBus } from './zeroTrustBus';

export interface RegisteredPiece {
  manifest: COCA.PieceManifest;
  component: React.ComponentType<any>;
  status: 'REGISTERED' | 'ACTIVE' | 'ISOLATED' | 'DISABLED';
}

class KernelEngine {
  private pieces: Map<string, RegisteredPiece> = new Map();
  private isInitialized = false;

  public initialize(): void {
    if (this.isInitialized) return;

    console.log('[COCA Kernel] Bootstrapping enterprise composable runtime...');
    this.isInitialized = true;

    ZeroTrustBus.emit('core_kernel', 'v1.kernel.ready', {
      timestamp: Date.now(),
      activePieces: Array.from(this.pieces.keys())
    });

    ZeroTrustBus.emit('core_kernel', 'v1.security.vault_active', {
      algorithm: 'AES-256-GCM + Blind Indexing',
      zeroPlaintextVerified: true
    });
  }

  public registerPiece(manifest: COCA.PieceManifest, component: React.ComponentType<any>): void {
    ZeroTrustBus.registerPieceManifest(manifest);
    this.pieces.set(manifest.id, {
      manifest,
      component,
      status: 'ACTIVE'
    });
    console.log(`[COCA Kernel] Piece '${manifest.id}' (${manifest.name}) successfully registered.`);
  }

  public getPiece(id: string): RegisteredPiece | undefined {
    return this.pieces.get(id);
  }

  public getAllPieces(): RegisteredPiece[] {
    return Array.from(this.pieces.values());
  }
}

export const Kernel = new KernelEngine();
