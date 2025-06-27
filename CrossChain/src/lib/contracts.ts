// Contract ABIs - Essential functions for the DeFi protocol
export const LENDING_POOL_ABI = [
  // Core lending functions
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'borrow',
    type: 'function', 
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'destChainSelector', type: 'uint64' },
      { name: 'receiver', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable', 
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  // View functions
  {
    name: 'getUserPosition',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'totalCollateralValue', type: 'uint256' },
      { name: 'totalBorrowValue', type: 'uint256' },
      { name: 'healthFactor', type: 'uint256' }
    ]
  },
  {
    name: 'getAssetPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' }
    ],
    outputs: [
      { name: 'price', type: 'uint256' }
    ]
  },
  {
    name: 'supportedAssets',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' }
    ],
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'priceFeed', type: 'address' },
      { name: 'synthToken', type: 'address' },
      { name: 'decimals', type: 'uint256' },
      { name: 'ltv', type: 'uint256' },
      { name: 'liquidationThreshold', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'canBeBorrowed', type: 'bool' },
      { name: 'canBeCollateral', type: 'bool' }
    ]
  },
  // Events
  {
    name: 'Deposit',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'chainSelector', type: 'uint64', indexed: true }
    ]
  },
  {
    name: 'Borrow',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'asset', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'destChain', type: 'uint64', indexed: true },
      { name: 'ccipMessageId', type: 'bytes32', indexed: false }
    ]
  },
  {
    name: 'CrossChainMessageSent',
    type: 'event',
    inputs: [
      { name: 'messageId', type: 'bytes32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'action', type: 'string', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  }
] as const

// Chainlink Price Feed ABI
export const CHAINLINK_PRICE_FEED_ABI = [
  {
    name: 'getPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' }
    ],
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'isStale', type: 'bool' }
    ]
  },
  {
    name: 'getSafePrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' }
    ],
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'isStale', type: 'bool' }
    ]
  },
  {
    name: 'getPrices',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'assets', type: 'address[]' }
    ],
    outputs: [
      { name: 'prices', type: 'uint256[]' },
      { name: 'isStale', type: 'bool[]' }
    ]
  },
  {
    name: 'hasPriceFeed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' }
    ],
    outputs: [
      { name: 'exists', type: 'bool' }
    ]
  },
  {
    name: 'getPriceFeedConfig',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'asset', type: 'address' }
    ],
    outputs: [
      { name: 'feed', type: 'address' },
      { name: 'decimals', type: 'uint8' },
      { name: 'heartbeat', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'description', type: 'string' }
    ]
  }
] as const

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' }
    ],
    outputs: [
      { name: 'balance', type: 'uint256' }
    ]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [
      { name: 'allowance', type: 'uint256' }
    ]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [
      { name: 'success', type: 'bool' }
    ]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'decimals', type: 'uint8' }
    ]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'symbol', type: 'string' }
    ]
  }
] as const

// Liquidation Manager ABI
export const LIQUIDATION_MANAGER_ABI = [
  {
    name: 'liquidate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'collateralAsset', type: 'address' },
      { name: 'debtAsset', type: 'address' },
      { name: 'debtAmount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'calculateLiquidationAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'collateralAsset', type: 'address' },
      { name: 'debtAsset', type: 'address' }
    ],
    outputs: [
      { name: 'maxLiquidation', type: 'uint256' },
      { name: 'collateralSeized', type: 'uint256' }
    ]
  },
  {
    name: 'canLiquidate',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'canLiquidate', type: 'bool' },
      { name: 'healthFactor', type: 'uint256' }
    ]
  }
] as const

// Chainlink CCIP Router ABI (essential functions)
export const CCIP_ROUTER_ABI = [
  {
    name: 'ccipSend',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'destinationChainSelector', type: 'uint64' },
      { name: 'message', type: 'tuple',
        components: [
          { name: 'receiver', type: 'bytes' },
          { name: 'data', type: 'bytes' },
          { name: 'tokenAmounts', type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ]
          },
          { name: 'extraArgs', type: 'bytes' },
          { name: 'feeToken', type: 'address' }
        ]
      }
    ],
    outputs: [
      { name: 'messageId', type: 'bytes32' }
    ]
  },
  {
    name: 'getFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'destinationChainSelector', type: 'uint64' },
      { name: 'message', type: 'tuple',
        components: [
          { name: 'receiver', type: 'bytes' },
          { name: 'data', type: 'bytes' },
          { name: 'tokenAmounts', type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' }
            ]
          },
          { name: 'extraArgs', type: 'bytes' },
          { name: 'feeToken', type: 'address' }
        ]
      }
    ],
    outputs: [
      { name: 'fee', type: 'uint256' }
    ]
  },
  {
    name: 'isChainSupported',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'chainSelector', type: 'uint64' }
    ],
    outputs: [
      { name: 'supported', type: 'bool' }
    ]
  }
] as const

// Utility functions for contract interactions
export function formatUnits(value: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals)
  const quotient = value / divisor
  const remainder = value % divisor
  
  if (remainder === 0n) {
    return quotient.toString()
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const trimmedRemainder = remainderStr.replace(/0+$/, '')
  
  return trimmedRemainder 
    ? `${quotient}.${trimmedRemainder}`
    : quotient.toString()
}

export function parseUnits(value: string, decimals: number): bigint {
  const [integer, fractional = ''] = value.split('.')
  const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(integer + fractionalPadded)
}

export function formatCurrency(value: bigint, decimals: number, symbol: string): string {
  const formatted = formatUnits(value, decimals)
  return `${formatted} ${symbol}`
}

export function calculateHealthFactor(
  totalCollateralValue: bigint,
  totalBorrowValue: bigint,
  liquidationThreshold: bigint
): bigint {
  if (totalBorrowValue === 0n) {
    return BigInt(Number.MAX_SAFE_INTEGER) // Effectively infinite
  }
  
  return (totalCollateralValue * liquidationThreshold) / (totalBorrowValue * 100n)
}

// Chainlink Security Contract ABI
export const CHAINLINK_SECURITY_ABI = [
  {
    name: 'requestLiquidatorSelection',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [
      { name: 'requestId', type: 'uint256' }
    ]
  },
  {
    name: 'getSecurityStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'currentSecurityScore', type: 'uint256' },
      { name: 'isEmergencyMode', type: 'bool' },
      { name: 'emergencyCount', type: 'uint256' },
      { name: 'lastCheck', type: 'uint256' },
      { name: 'liquidatorCount', type: 'uint256' }
    ]
  },
  {
    name: 'getUserSecurityProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'profile', type: 'tuple',
        components: [
          { name: 'riskScore', type: 'uint256' },
          { name: 'lastActivity', type: 'uint256' },
          { name: 'liquidationHistory', type: 'uint256' },
          { name: 'isHighRisk', type: 'bool' },
          { name: 'securityDelay', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'getLiquidationRequest',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'requestId', type: 'uint256' }
    ],
    outputs: [
      { name: 'request', type: 'tuple',
        components: [
          { name: 'user', type: 'address' },
          { name: 'liquidator', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'executed', type: 'bool' },
          { name: 'isEmergency', type: 'bool' }
        ]
      }
    ]
  },
  {
    name: 'addLiquidator',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'liquidator', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'disableEmergencyMode',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    name: 'SecurityAlert',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'alertType', type: 'string', indexed: false },
      { name: 'user', type: 'address', indexed: true },
      { name: 'severity', type: 'uint256', indexed: false },
      { name: 'details', type: 'string', indexed: false }
    ]
  },
  {
    name: 'LiquidationQueued',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'liquidator', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ]
  },
  {
    name: 'AutomationExecuted',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'taskType', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
      { name: 'data', type: 'bytes', indexed: false }
    ]
  }
] as const

// TimeLock Contract ABI
export const TIMELOCK_ABI = [
  {
    name: 'getOperationDelay',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'selector', type: 'bytes4' }
    ],
    outputs: [
      { name: 'delay', type: 'uint256' }
    ]
  },
  {
    name: 'scheduleWithType',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'emergencyExecute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'predecessor', type: 'bytes32' },
      { name: 'salt', type: 'bytes32' }
    ],
    outputs: []
  },
  {
    name: 'isOperation',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'bytes32' }
    ],
    outputs: [
      { name: 'pending', type: 'bool' }
    ]
  },
  {
    name: 'isOperationReady',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'bytes32' }
    ],
    outputs: [
      { name: 'ready', type: 'bool' }
    ]
  }
] as const

// Chainlink VRF Coordinator ABI
export const VRF_COORDINATOR_ABI = [
  {
    name: 'requestRandomWords',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'keyHash', type: 'bytes32' },
      { name: 'subId', type: 'uint64' },
      { name: 'minimumRequestConfirmations', type: 'uint16' },
      { name: 'callbackGasLimit', type: 'uint32' },
      { name: 'numWords', type: 'uint32' }
    ],
    outputs: [
      { name: 'requestId', type: 'uint256' }
    ]
  },
  {
    name: 'getSubscription',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'subId', type: 'uint64' }
    ],
    outputs: [
      { name: 'balance', type: 'uint96' },
      { name: 'reqCount', type: 'uint64' },
      { name: 'owner', type: 'address' },
      { name: 'consumers', type: 'address[]' }
    ]
  },
  {
    name: 'addConsumer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'subId', type: 'uint64' },
      { name: 'consumer', type: 'address' }
    ],
    outputs: []
  }
] as const

// Chainlink Automation Registry ABI
export const AUTOMATION_REGISTRY_ABI = [
  {
    name: 'getUpkeep',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'uint256' }
    ],
    outputs: [
      { name: 'upkeep', type: 'tuple',
        components: [
          { name: 'target', type: 'address' },
          { name: 'executeGas', type: 'uint32' },
          { name: 'checkData', type: 'bytes' },
          { name: 'balance', type: 'uint96' },
          { name: 'admin', type: 'address' },
          { name: 'maxValidBlocknumber', type: 'uint64' },
          { name: 'lastKeeperId', type: 'uint256' },
          { name: 'amountSpent', type: 'uint96' },
          { name: 'paused', type: 'bool' }
        ]
      }
    ]
  },
  {
    name: 'addFunds',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint96' }
    ],
    outputs: []
  },
  {
    name: 'pauseUpkeep',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'unpauseUpkeep',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'id', type: 'uint256' }
    ],
    outputs: []
  }
] as const 
 