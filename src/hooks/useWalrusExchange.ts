// useWalrusExchange.ts

// Frontend-safe version of your SuiToWalConverter logic,
// using Mysten dapp-kit for account + signing.

import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { useCallback, useMemo } from "react";

// Use the inner coin type for balance queries (not the Coin<T> wrapper)
export const WAL_TOKEN_TYPE =
    "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL";

// hardcoded protocol addresses from your backend sample
// TESTNET addresses - replace with mainnet IDs when provided


const EXCHANGE_PACKAGE_ID =
    "0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f";

const EXCHANGE_OBJECT_ID =
    "0x19825121c52080bb1073662231cfea5c0e4d905fd13e95f21e9a018f2ef41862";

export function useWalrusExchange() {
    // Grab the connected wallet account
    const account = useCurrentAccount();

    // Client for reads (balances, etc.)
    const suiClient = useMemo(() => {
        return new SuiClient({
            url: getFullnodeUrl("testnet"),
        });
    }, []);


    // Hook that will ask the wallet to sign+execute
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

    /**
     * Convert SUI -> WAL by calling wal_exchange::exchange_all_for_wal
     * amount should be in MIST (1 SUI = 1_000_000_000 MIST)
     */
    const convertSuiToWal = useCallback(
        async (amount: bigint | number) => {
            if (!account?.address) {
                throw new Error("No wallet connected.");
            }

            // tx assembly
            const txb = new Transaction();

            // sender is the connected wallet
            txb.setSender(account.address);

            // split `amount` out of gas coin to use as input SUI
            const coin = txb.splitCoins(txb.gas, [txb.pure.u64(amount)]);

            // call the Move function
            const walCoin = txb.moveCall({
                target: `${EXCHANGE_PACKAGE_ID}::wal_exchange::exchange_all_for_wal`,
                arguments: [txb.object(EXCHANGE_OBJECT_ID), coin],
            });

            // send resulting WAL coin back to the caller
            txb.transferObjects([walCoin], txb.pure.address(account.address));

            // IMPORTANT:
            // frontend does NOT sign directly.
            // we ask the wallet via dapp-kit:
            const res = await signAndExecute({
                transaction: txb,
                chain: "sui:testnet",
            });

            return res; // res.digest etc.
        },
        [account?.address, signAndExecute],
    );

    /**
     * Read WAL balance for the connected wallet (or any address)
     */
    const getWalBalance = useCallback(
        async (address?: string) => {
            const owner = address ?? account?.address;
            if (!owner) {
                throw new Error("No wallet connected.");
            }

            try {
                const balance = await suiClient.getBalance({
                    owner,
                    coinType: WAL_TOKEN_TYPE,
                });

                // balance.totalBalance is a string, return 0 if not found
                return BigInt(balance.totalBalance || "0");
            } catch (error) {
                // If coin type doesn't exist or other error, return 0
                console.warn("Error fetching WAL balance:", error);
                return BigInt(0);
            }
        },
        [account?.address, suiClient],
    );

    /**
     * Read SUI balance for the connected wallet (or any address)
     */
    const getSuiBalance = useCallback(
        async (address?: string) => {
            const owner = address ?? account?.address;
            if (!owner) {
                throw new Error("No wallet connected.");
            }

            const balance = await suiClient.getBalance({
                owner,
                coinType: "0x2::sui::SUI",
            });

            return BigInt(balance.totalBalance); // in MIST
        },
        [account?.address, suiClient],
    );

    /**
     * Fetch user's transaction history via JSON RPC
     */
    const getUserTransactions = useCallback(async () => {
        if (!account?.address) return [];

        try {
            const page = await suiClient.queryTransactionBlocks({
                filter: { FromAddress: account.address },
                options: {
                    showEffects: true,
                    showBalanceChanges: true,
                },
                limit: 20,
            });

            const nodes = page.data || [];

            // Map the transaction blocks into our simplified Transaction format
            return nodes.map((node: any) => {
                const isSuccess = node.effects?.status?.status === "success";

                let suiChange = 0;
                let walChange = 0;

                for (const change of node.balanceChanges || []) {
                    const ownerObj = change.owner;
                    const ownerAddr = ownerObj?.AddressOwner || ownerObj?.ObjectOwner;

                    // Only sum the balance changes that belong to the connected wallet
                    if (ownerAddr && ownerAddr.toLowerCase() !== account.address.toLowerCase()) {
                        continue;
                    }

                    const type = change.coinType || "";
                    const amt = Number(change.amount);
                    if (type.includes("sui::SUI")) suiChange += amt;
                    if (type.includes("wal::WAL")) walChange += amt;
                }

                // Heuristic: If SUI went down and WAL went up, it's a SUI → WAL swap
                let pair = "Unknown Interaction";
                let input = "";
                let output = "";

                if (suiChange < 0 && walChange > 0) {
                    pair = "SUI → WAL";
                    input = `${(Math.abs(suiChange) / 1e9).toFixed(4)} SUI`;
                    output = `${(walChange / 1e9).toFixed(4)} WAL`;
                } else if (walChange < 0 && suiChange > 0) {
                    pair = "WAL → SUI";
                    input = `${(Math.abs(walChange) / 1e9).toFixed(4)} WAL`;
                    output = `${(suiChange / 1e9).toFixed(4)} SUI`;
                } else {
                    // Fallback for non-swap transactions
                    if (suiChange !== 0) input = `${(Math.abs(suiChange) / 1e9).toFixed(4)} SUI`;
                    else input = "0";
                    output = "N/A";
                }

                // Format Timestamp
                let dateStr = "Unknown Date";
                if (node.timestampMs) {
                    const date = new Date(parseInt(node.timestampMs));
                    dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                }

                return {
                    date: dateStr,
                    pair,
                    input,
                    output,
                    txHash: node.digest,
                    status: (isSuccess ? "Success" : "Failed") as "Success" | "Failed" | "Pending",
                };
            }).filter((tx: any) => tx.pair !== "Unknown Interaction");

        } catch (error) {
            console.error("Error fetching transactions via JSON RPC:", error);
            return [];
        }
    }, [account?.address, suiClient]);

    return {
        address: account?.address ?? null,
        connected: !!account?.address,
        convertSuiToWal,
        getWalBalance,
        getSuiBalance,
        getUserTransactions,
    };
}
