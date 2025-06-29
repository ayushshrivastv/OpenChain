"use client";

import { CONTRACT_ADDRESSES, SECURITY_CONFIG } from "@/lib/chains";
import {
  AUTOMATION_REGISTRY_ABI,
  CHAINLINK_SECURITY_ABI,
  TIMELOCK_ABI,
  VRF_COORDINATOR_ABI,
} from "@/lib/contracts";
import type {
  LiquidationRequest,
  SecurityAlert as SecurityAlertType,
  SecurityProfile,
  SecurityStatus,
} from "@/types";
import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";

interface SecurityMetrics {
  securityScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  emergencyMode: boolean;
  automationActive: boolean;
  vrfSubscriptionActive: boolean;
  lastHealthCheck: Date;
  totalLiquidations: number;
  pendingLiquidations: number;
}

interface VRFRequest {
  requestId: string;
  user: string;
  amount: bigint;
  status: "PENDING" | "FULFILLED" | "FAILED";
  timestamp: Date;
}

export function useChainlinkSecurity() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  // State
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(
    null,
  );
  const [userProfile, setUserProfile] = useState<SecurityProfile | null>(null);
  const [securityMetrics, setSecurityMetrics] =
    useState<SecurityMetrics | null>(null);
  const [vrfRequests, setVrfRequests] = useState<VRFRequest[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract addresses
  const contractAddresses =
    CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
  const securityConfig = SECURITY_CONFIG;

  // Fetch security status from ChainlinkSecurity contract
  const fetchSecurityStatus = useCallback(async () => {
    if (!publicClient || !contractAddresses?.chainlinkSecurity) return;

    try {
      const [
        securityScore,
        isEmergencyMode,
        emergencyCount,
        lastCheck,
        liquidatorCount,
      ] = (await publicClient.readContract({
        address: contractAddresses.chainlinkSecurity as `0x${string}`,
        abi: CHAINLINK_SECURITY_ABI,
        functionName: "getSecurityStatus",
      })) as [bigint, boolean, bigint, bigint, bigint];

      const status: SecurityStatus = {
        securityScore: Number(securityScore),
        emergencyMode: isEmergencyMode,
        emergencyCount: Number(emergencyCount),
        lastHealthCheck: new Date(Number(lastCheck) * 1000),
        liquidatorCount: Number(liquidatorCount),
        isHealthy: Number(securityScore) > 70 && !isEmergencyMode,
      };

      setSecurityStatus(status);

      // Update metrics
      setSecurityMetrics((prev) => ({
        securityScore: Number(securityScore),
        riskLevel: getRiskLevel(Number(securityScore)),
        emergencyMode: isEmergencyMode,
        automationActive: prev?.automationActive || false,
        vrfSubscriptionActive: prev?.vrfSubscriptionActive || false,
        lastHealthCheck: new Date(Number(lastCheck) * 1000),
        totalLiquidations: prev?.totalLiquidations || 0,
        pendingLiquidations: prev?.pendingLiquidations || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch security status:", err);
      setError("Failed to fetch security status");
    }
  }, [publicClient, contractAddresses]);

  // Fetch user security profile
  const fetchUserProfile = useCallback(async () => {
    if (!address || !publicClient || !contractAddresses?.chainlinkSecurity)
      return;

    try {
      const profile = (await publicClient.readContract({
        address: contractAddresses.chainlinkSecurity as `0x${string}`,
        abi: CHAINLINK_SECURITY_ABI,
        functionName: "getUserSecurityProfile",
        args: [address],
      })) as {
        riskScore: bigint;
        lastActivity: bigint;
        liquidationHistory: bigint;
        isHighRisk: boolean;
        securityDelay: bigint;
      };

      const userSecurityProfile: SecurityProfile = {
        riskScore: Number(profile.riskScore),
        lastActivity: new Date(Number(profile.lastActivity) * 1000),
        liquidationHistory: Number(profile.liquidationHistory),
        isHighRisk: profile.isHighRisk,
        securityDelay: Number(profile.securityDelay),
        riskLevel: getRiskLevel(Number(profile.riskScore)),
      };

      setUserProfile(userSecurityProfile);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  }, [address, publicClient, contractAddresses]);

  // Request VRF-based liquidator selection
  const requestLiquidatorSelection = useCallback(
    async (user: string, amount: bigint) => {
      if (!walletClient || !contractAddresses?.chainlinkSecurity) {
        throw new Error("Wallet not connected or contract not available");
      }

      try {
        if (!publicClient || !walletClient || !address) {
          throw new Error("Required clients not available");
        }

        const { request } = await publicClient.simulateContract({
          address: contractAddresses.chainlinkSecurity as `0x${string}`,
          abi: CHAINLINK_SECURITY_ABI,
          functionName: "requestLiquidatorSelection",
          args: [user as `0x${string}`, amount],
          account: address as `0x${string}`,
        });

        const hash = await walletClient.writeContract(request);

        // Wait for transaction confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Extract request ID from logs
        const requestId = receipt.logs[0]?.topics[1] || "0x";

        // Add to VRF requests tracking
        const vrfRequest: VRFRequest = {
          requestId: requestId.toString(),
          user,
          amount,
          status: "PENDING",
          timestamp: new Date(),
        };

        setVrfRequests((prev) => [...prev, vrfRequest]);

        return { hash, requestId };
      } catch (err) {
        console.error("Failed to request liquidator selection:", err);
        throw new Error("Failed to request liquidator selection");
      }
    },
    [walletClient, publicClient, address, contractAddresses],
  );

  // Check VRF subscription status
  const checkVRFSubscription = useCallback(async () => {
    if (!publicClient || !contractAddresses?.vrfCoordinator) return;

    try {
      const vrfConfig =
        securityConfig.VRF[chainId as keyof typeof securityConfig.VRF];
      if (!vrfConfig || vrfConfig.subscriptionId === 0) return;

      const [balance, reqCount, owner, consumers] =
        (await publicClient.readContract({
          address: contractAddresses.vrfCoordinator as `0x${string}`,
          abi: VRF_COORDINATOR_ABI,
          functionName: "getSubscription",
          args: [BigInt(vrfConfig.subscriptionId)],
        })) as [bigint, bigint, `0x${string}`, `0x${string}`[]];

      setSecurityMetrics((prev) =>
        prev
          ? {
              ...prev,
              vrfSubscriptionActive: balance > 0n,
            }
          : {
              securityScore: 0,
              riskLevel: "CRITICAL",
              emergencyMode: false,
              automationActive: false,
              vrfSubscriptionActive: balance > 0n,
              lastHealthCheck: new Date(),
              totalLiquidations: 0,
              pendingLiquidations: 0,
            },
      );
    } catch (err) {
      console.error("Failed to check VRF subscription:", err);
    }
  }, [publicClient, contractAddresses, securityConfig, chainId]);

  // Check Automation upkeep status
  const checkAutomationStatus = useCallback(async () => {
    if (!publicClient || !contractAddresses?.automationRegistry) return;

    try {
      // This would check if our automation upkeep is registered and active
      // For now, we'll simulate the check
      setSecurityMetrics((prev) =>
        prev
          ? {
              ...prev,
              automationActive: true, // Would be determined by actual upkeep status
            }
          : {
              securityScore: 0,
              riskLevel: "CRITICAL",
              emergencyMode: false,
              automationActive: true,
              vrfSubscriptionActive: false,
              lastHealthCheck: new Date(),
              totalLiquidations: 0,
              pendingLiquidations: 0,
            },
      );
    } catch (err) {
      console.error("Failed to check automation status:", err);
    }
  }, [publicClient, contractAddresses]);

  // Add liquidator to the authorized pool
  const addLiquidator = useCallback(
    async (liquidatorAddress: string) => {
      if (
        !publicClient ||
        !walletClient ||
        !address ||
        !contractAddresses?.chainlinkSecurity
      ) {
        throw new Error("Wallet not connected or contract not available");
      }

      try {
        const { request } = await publicClient.simulateContract({
          address: contractAddresses.chainlinkSecurity as `0x${string}`,
          abi: CHAINLINK_SECURITY_ABI,
          functionName: "addLiquidator",
          args: [liquidatorAddress as `0x${string}`],
          account: address as `0x${string}`,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        return hash;
      } catch (err) {
        console.error("Failed to add liquidator:", err);
        throw new Error("Failed to add liquidator");
      }
    },
    [walletClient, publicClient, address, contractAddresses],
  );

  // Disable emergency mode (admin only)
  const disableEmergencyMode = useCallback(async () => {
    if (
      !publicClient ||
      !walletClient ||
      !address ||
      !contractAddresses?.chainlinkSecurity
    ) {
      throw new Error("Wallet not connected or contract not available");
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: contractAddresses.chainlinkSecurity as `0x${string}`,
        abi: CHAINLINK_SECURITY_ABI,
        functionName: "disableEmergencyMode",
        account: address as `0x${string}`,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (err) {
      console.error("Failed to disable emergency mode:", err);
      throw new Error("Failed to disable emergency mode");
    }
  }, [walletClient, publicClient, address, contractAddresses]);

  // Get operation delay from TimeLock
  const getOperationDelay = useCallback(
    async (target: string, selector: string) => {
      if (!publicClient || !contractAddresses?.timeLock) return 0;

      try {
        const delay = (await publicClient.readContract({
          address: contractAddresses.timeLock as `0x${string}`,
          abi: TIMELOCK_ABI,
          functionName: "getOperationDelay",
          args: [target as `0x${string}`, selector as `0x${string}`],
        })) as bigint;

        return Number(delay);
      } catch (err) {
        console.error("Failed to get operation delay:", err);
        return 0;
      }
    },
    [publicClient, contractAddresses],
  );

  // Listen for security events
  useEffect(() => {
    if (!publicClient || !contractAddresses?.chainlinkSecurity || !address) return;

    let unwatch: (() => void) | undefined;

    const setupEventWatcher = async () => {
      try {
        // Check if the contract exists before setting up watcher
        const bytecode = await publicClient.getBytecode({
          address: contractAddresses.chainlinkSecurity as `0x${string}`,
        });
        
        if (!bytecode || bytecode === '0x') {
          console.warn('ChainlinkSecurity contract not deployed, skipping event watcher');
          return;
        }

        unwatch = publicClient.watchContractEvent({
          address: contractAddresses.chainlinkSecurity as `0x${string}`,
          abi: CHAINLINK_SECURITY_ABI,
          eventName: "SecurityAlert",
          onLogs: (logs) => {
            for (const log of logs) {
              const alert: SecurityAlertType = {
                id: log.transactionHash,
                type: log.args.alertType as string,
                user: log.args.user as string,
                severity: Number(log.args.severity),
                details: log.args.details as string,
                timestamp: new Date(),
                resolved: false,
              };

              setSecurityAlerts((prev) => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
            }
          },
          onError: (error) => {
            console.warn('Contract event watcher error:', error);
            // Don't throw, just log the error
          },
        });
      } catch (error) {
        console.warn('Failed to setup contract event watcher:', error);
      }
    };

    setupEventWatcher();

    return () => {
      if (unwatch) {
        try {
          unwatch();
        } catch (error) {
          console.warn('Error cleaning up event watcher:', error);
        }
      }
    };
  }, [publicClient, contractAddresses, address]);

  // Periodic data refresh
  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          fetchSecurityStatus(),
          fetchUserProfile(),
          checkVRFSubscription(),
          checkAutomationStatus(),
        ]);
      } catch (err) {
        console.error("Failed to fetch security data:", err);
        setError("Failed to fetch security data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [
    address,
    publicClient,
    fetchSecurityStatus,
    fetchUserProfile,
    checkVRFSubscription,
    checkAutomationStatus,
  ]);

  // Helper function to determine risk level
  const getRiskLevel = (
    score: number,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" => {
    if (score < 30) return "CRITICAL";
    if (score < 50) return "HIGH";
    if (score < 70) return "MEDIUM";
    return "LOW";
  };

  return {
    // State
    securityStatus,
    userProfile,
    securityMetrics,
    vrfRequests,
    securityAlerts,
    isLoading,
    error,

    // Actions
    requestLiquidatorSelection,
    addLiquidator,
    disableEmergencyMode,
    getOperationDelay,

    // Utilities
    getRiskLevel,
    refetch: () => {
      fetchSecurityStatus();
      fetchUserProfile();
      checkVRFSubscription();
      checkAutomationStatus();
    },
  };
}
