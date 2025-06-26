// Temporary type declarations for LendingPool
// These will be replaced by Anchor-generated types after `anchor build`

import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

// Account types that match the expected structures
export interface Pool {
  admin: PublicKey;
  ccipProgram: PublicKey;
  isPaused: boolean;
  totalAssets: number;
}

export interface AssetInfo {
  mint: PublicKey;
  isActive: boolean;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  totalDeposits: BN;
  totalBorrows: BN;
  ltv: BN;
  liquidationThreshold: BN;
  priceFeed: PublicKey;
}

export interface UserPosition {
  user: PublicKey;
  mint: PublicKey;
  collateralBalance: BN;
  borrowBalance: BN;
  lastUpdateSlot: BN;
}

// Program account structure
export interface LendingPoolProgram {
  account: {
    pool: {
      fetch: (address: PublicKey) => Promise<Pool>;
    };
    assetInfo: {
      fetch: (address: PublicKey) => Promise<AssetInfo>;
    };
    userPosition: {
      fetch: (address: PublicKey) => Promise<UserPosition>;
    };
  };
  methods: any;
  programId: PublicKey;
}

export type LendingPool = {
  "version": "0.1.0",
  "name": "lending_pool",
  "instructions": Array<any>,
  "accounts": Array<any>,
  "types": Array<any>,
  "errors": Array<any>
};

export const IDL: LendingPool; 
