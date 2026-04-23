/**
 * EAS (Ethereum Attestation Service) Integration
 *
 * Handles wallet connection and attestation publishing for forensic reports
 */

import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

// EAS Configuration from env
const EAS_CONTRACT_ADDRESS = import.meta.env.VITE_EAS_CONTRACT_ADDRESS;
const EAS_SCHEMA_UID = import.meta.env.VITE_EAS_SCHEMA_UID;
const EAS_CHAIN_ID = parseInt(import.meta.env.VITE_EAS_CHAIN_ID);
const EAS_NETWORK = import.meta.env.VITE_EAS_NETWORK;

// Schema: address subject, string verdict, uint256 pValueScaled, bytes32 reportHash
const SCHEMA = 'address subject,string verdict,uint256 pValueScaled,bytes32 reportHash';

/**
 * Connect to MetaMask wallet and return provider + signer
 * @returns {Promise<{provider: ethers.BrowserProvider, signer: ethers.Signer}>}
 * @throws {Error} if MetaMask not installed or user rejects
 */
export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask to publish attestations.');
  }

  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    // Check if on correct network (Sepolia)
    if (Number(network.chainId) !== EAS_CHAIN_ID) {
      throw new Error(
        `Wrong network. Please switch to ${EAS_NETWORK} (Chain ID: ${EAS_CHAIN_ID}) in MetaMask.`
      );
    }

    const signer = await provider.getSigner();
    return { provider, signer };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('User rejected wallet connection.');
    }
    throw error;
  }
}

/**
 * Switch to Sepolia network
 * @throws {Error} if user rejects network switch
 */
export async function switchToSepolia() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${EAS_CHAIN_ID.toString(16)}` }],
    });
  } catch (error) {
    // If chain not added, try adding it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${EAS_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

/**
 * Encode forensic report data using EAS SchemaEncoder
 * @param {Object} report - Forensic report object
 * @returns {string} Encoded data
 */
export function encodeReport(report) {
  console.log('[EAS] encodeReport: Starting encoding');
  console.log('[EAS] encodeReport: Schema:', SCHEMA);

  const encoder = new SchemaEncoder(SCHEMA);

  // Extract values from report
  const subject = report.subject_address || report.cluster_summary?.candidates?.[0] || ethers.ZeroAddress;
  const verdict = report.verdict || report.insider_detection?.verdict || 'Unknown';
  const pValue = report.p_value ?? report.insider_detection?.p_value ?? 0;

  console.log('[EAS] encodeReport: Extracted values:', { subject, verdict, pValue });

  // Scale p-value to uint256 (multiply by 1e18 for precision)
  const pValueScaled = BigInt(Math.floor(pValue * 1e18));
  console.log('[EAS] encodeReport: pValueScaled:', pValueScaled.toString());

  // Create deterministic hash of report
  const reportHash = ethers.id(JSON.stringify({
    subject,
    verdict,
    pValue,
    timestamp: report.timestamp || Date.now(),
  }));
  console.log('[EAS] encodeReport: reportHash:', reportHash);

  const encodedData = encoder.encodeData([
    { name: 'subject', value: subject, type: 'address' },
    { name: 'verdict', value: verdict, type: 'string' },
    { name: 'pValueScaled', value: pValueScaled, type: 'uint256' },
    { name: 'reportHash', value: reportHash, type: 'bytes32' },
  ]);

  console.log('[EAS] encodeReport: Encoding complete');
  return encodedData;
}

/**
 * Publish attestation to EAS on Sepolia
 * @param {Object} report - Forensic report to attest
 * @returns {Promise<{uid: string, txHash: string}>} Attestation UID and transaction hash
 * @throws {Error} on wallet errors, network errors, or gas issues
 */
export async function attestReport(report) {
  try {
    console.log('[EAS] Starting attestReport flow');
    console.log('[EAS] Report data:', report);

    // Connect wallet and get signer
    console.log('[EAS] Step 1: Connecting wallet...');
    const { signer } = await connectWallet();
    console.log('[EAS] Step 1 ✓: Wallet connected, signer obtained');

    // Initialize EAS with signer
    console.log('[EAS] Step 2: Initializing EAS contract...');
    const eas = new EAS(EAS_CONTRACT_ADDRESS);
    eas.connect(signer);
    console.log('[EAS] Step 2 ✓: EAS initialized with contract address:', EAS_CONTRACT_ADDRESS);

    // Encode report data
    console.log('[EAS] Step 3: Encoding report data...');
    const encodedData = encodeReport(report);
    console.log('[EAS] Step 3 ✓: Data encoded:', encodedData);

    // Determine recipient (subject of investigation)
    const recipient = report.subject_address || report.cluster_summary?.candidates?.[0] || ethers.ZeroAddress;
    console.log('[EAS] Recipient address:', recipient);

    // Create attestation
    console.log('[EAS] Step 4: Calling eas.attest() with schema:', EAS_SCHEMA_UID);
    const tx = await eas.attest({
      schema: EAS_SCHEMA_UID,
      data: {
        recipient,
        expirationTime: 0n, // No expiration
        revocable: true,
        data: encodedData,
      },
    });
    console.log('[EAS] Step 4 ✓: Transaction submitted:', tx);
    console.log('[EAS] Step 4 ✓: Full tx object:', JSON.stringify(tx, null, 2));

    // Extract transaction hash (handle both SDK shapes)
    const txHash = tx.tx?.hash || tx.hash || null;
    console.log('[EAS] Extracted tx hash:', txHash);

    // Wait for transaction confirmation
    console.log('[EAS] Step 5: Waiting for transaction confirmation...');
    let attestationUID;
    try {
      const result = await tx.wait();
      console.log('[EAS] Step 5: tx.wait() returned:', result);
      console.log('[EAS] Step 5: Result type:', typeof result);

      // Handle both old SDK (returns receipt object) and new SDK (returns UID string)
      if (typeof result === 'string') {
        attestationUID = result;
      } else if (result?.logs?.[0]?.data) {
        attestationUID = result.logs[0].data;
      } else {
        // Fallback: if we can't get UID but have tx hash, still succeed
        console.warn('[EAS] Could not extract UID from result, using fallback');
        attestationUID = txHash ? `pending-${txHash}` : 'unknown';
      }
      console.log('[EAS] Step 5 ✓: Transaction confirmed, UID:', attestationUID);
    } catch (waitError) {
      console.error('[EAS] Error during tx.wait():', waitError);
      // If tx.wait() fails but we have a tx hash, still return partial success
      if (txHash) {
        console.warn('[EAS] Transaction submitted but confirmation failed. TX Hash:', txHash);
        attestationUID = `pending-${txHash}`;
      } else {
        throw waitError;
      }
    }

    return {
      uid: attestationUID,
      txHash: txHash || 'unknown',
    };
  } catch (error) {
    // Log the actual error for debugging
    console.error('[EAS] ❌ Error in attestReport:', error);
    console.error('[EAS] Error code:', error.code);
    console.error('[EAS] Error message:', error.message);
    console.error('[EAS] Full error object:', error);

    // Handle specific error cases
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('Transaction rejected by user.');
    }
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error('Insufficient ETH for gas. Please add Sepolia ETH to your wallet.');
    }
    if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection and try again.');
    }

    // Re-throw with more context
    throw new Error(`Attestation failed: ${error.message}`);
  }
}

/**
 * Get Easscan URL for viewing attestation
 * @param {string} uid - Attestation UID
 * @returns {string} URL to view attestation on Easscan
 */
export function getEasscanUrl(uid) {
  return `https://${EAS_NETWORK}.easscan.org/attestation/view/${uid}`;
}

/**
 * Format attestation UID for display (first 8 + last 6 chars)
 * @param {string} uid - Full attestation UID
 * @returns {string} Truncated UID
 */
export function formatAttestationUID(uid) {
  if (!uid || uid.length < 14) return uid;
  return `${uid.slice(0, 8)}...${uid.slice(-6)}`;
}
