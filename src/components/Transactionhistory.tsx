import { useState, useEffect } from "react";
import { useWalrusExchange } from "../hooks/useWalrusExchange";

interface Transaction {
  date: string;
  pair: string;
  input: string;
  output: string;
  txHash: string;
  status: "Success" | "Failed" | "Pending";
}

export default function TransactionHistory() {
  const { getUserTransactions, connected } = useWalrusExchange();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchTxs = async () => {
      if (!connected) {
        setTransactions([]);
        return;
      }
      setLoading(true);
      try {
        const txs = await getUserTransactions();
        if (active) setTransactions(txs);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTxs();

    // Poll for new transactions every 15 seconds
    const interval = setInterval(fetchTxs, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [connected, getUserTransactions]);

  const statusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "Success": return "bg-green-100 text-green-800";
      case "Failed": return "bg-red-100 text-red-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      default: return "";
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Date</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Pair (From → To)</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Input</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Output</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Tx Hash</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading on-chain history...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {!connected ? "Connect wallet to view history" : "No recent transactions found"}
                </td>
              </tr>
            ) : (
              transactions.map((tx, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <td className="px-4 py-3">{tx.date}</td>
                  <td className="px-4 py-3">{tx.pair}</td>
                  <td className="px-4 py-3">{tx.input}</td>
                  <td className="px-4 py-3">{tx.output}</td>
                  <td className="px-4 py-3 font-mono text-sm text-blue-500 hover:underline">
                    <a
                      href={`https://suiscan.xyz/testnet/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
