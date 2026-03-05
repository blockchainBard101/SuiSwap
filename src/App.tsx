import { useState, useEffect } from "react";
import { Sun, Moon, ArrowDownUp } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
const Logo = "/Logo_Sui_Droplet_Sui Blue.svg";
import TokenSelect from "./components/TokenSelect";
import TransactionHistory from "./components/Transactionhistory";
import Suitokenbackground from "./components/Suitokenbackground";
import { useWalrusExchange } from "./hooks/useWalrusExchange";
import { getWalRateForNetwork, getSuiUsd, getWalUsdMainnet } from "./utils/prices";

export default function App() {
  const account = useCurrentAccount();

  // ===============================
  // THEME LOGIC
  // ===============================
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "light" ? "dark" : "light"));

  // ===============================
  // SWAP STATE
  // ===============================
  const [sendToken, setSendToken] = useState("SUI");
  const [receiveToken, setReceiveToken] = useState("WAL");
  const [sendAmount, setSendAmount] = useState<number | "">("");
  const [receiveAmount, setReceiveAmount] = useState<number | "">("");
  const [popupStatus, setPopupStatus] = useState<null | "loading" | "success" | "error">(null);
  const [suiBalance, setSuiBalance] = useState(0);
  const [walrusBalance, setWalrusBalance] = useState(0);
  const [walPerSui, setWalPerSui] = useState(0);
  const [suiUsd, setSuiUsd] = useState(0);
  const [walUsd, setWalUsd] = useState(0);

  const { convertSuiToWal, getWalBalance, getSuiBalance, connected } = useWalrusExchange();

  // Fetch WAL per SUI rate based on network
  useEffect(() => {
    let cancelled = false;
    const loadRate = async () => {
      try {
        const rate = await getWalRateForNetwork("testnet");
        if (!cancelled) setWalPerSui(rate || 0);
      } catch (e) {
        if (!cancelled) setWalPerSui(0);
      }
    };
    loadRate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch real prices (USD) even on testnet
  useEffect(() => {
    let cancelled = false;
    const loadPrices = async () => {
      try {
        const [sui, wal] = await Promise.all([getSuiUsd(), getWalUsdMainnet()]);
        if (!cancelled) {
          setSuiUsd(Number(sui) || 0);
          setWalUsd(Number(wal) || 0);
        }
      } catch (e) {
        if (!cancelled) {
          setSuiUsd(0);
          setWalUsd(0);
        }
      }
    };
    loadPrices();
    const id = setInterval(loadPrices, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Fetch balances when account is connected
  useEffect(() => {
    const fetchBalances = async () => {
      if (!connected || !account?.address) {
        setSuiBalance(0);
        setWalrusBalance(0);
        return;
      }

      try {
        const suiBalanceMist = await getSuiBalance();
        const suiBalanceFormatted = Number(suiBalanceMist) / 1e9;
        setSuiBalance(suiBalanceFormatted || 0);

        const walBalanceMist = await getWalBalance();
        const walBalanceFormatted = Number(walBalanceMist) / 1e9;
        setWalrusBalance(walBalanceFormatted || 0);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setSuiBalance(0);
        setWalrusBalance(0);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [connected, account?.address, getSuiBalance, getWalBalance]);

  // Auto-calc receive amount for SUI -> WAL based on current rate
  useEffect(() => {
    if (sendToken === "SUI" && receiveToken === "WAL" && typeof sendAmount === "number") {
      const est = Number((sendAmount * (walPerSui || 1)).toFixed(4));
      setReceiveAmount(est);
    }
  }, [sendAmount, walPerSui, sendToken, receiveToken]);

  const handleTokenSwitch = () => {
    setSendToken(receiveToken);
    setReceiveToken(sendToken);
    setSendAmount(receiveAmount);
    setReceiveAmount(sendAmount);
  };

  const handleSwap = async () => {
    if (!account) {
      alert("Please connect your wallet first.");
      return;
    }

    if (sendToken !== "SUI" || receiveToken !== "WAL") {
      alert("Currently only SUI → WAL swaps are supported on testnet.");
      return;
    }

    if (!sendAmount || sendAmount <= 0) {
      alert("Please enter a valid amount to swap.");
      return;
    }

    if (sendAmount > suiBalance) {
      alert("Insufficient SUI balance.");
      return;
    }

    setPopupStatus("loading");

    try {
      const amountInMist = BigInt(Math.floor(sendAmount * 1e9));
      await convertSuiToWal(amountInMist);
      setPopupStatus("success");

      // Fast refresh balances
      setTimeout(async () => {
        try {
          const suiBal = await getSuiBalance();
          const walBal = await getWalBalance();
          setSuiBalance(Number(suiBal) / 1e9);
          setWalrusBalance(Number(walBal) / 1e9);
        } catch (e) { }
      }, 3000);

      setTimeout(() => setPopupStatus(null), 4000);
    } catch (e) {
      console.error(e);
      setPopupStatus("error");
      setTimeout(() => setPopupStatus(null), 4000);
    }
  };

  return (
    <div className="relative min-h-screen bg-white text-slate-900 dark:bg-black dark:text-white transition-colors duration-300 overflow-x-hidden">
      {/* 1. BACKGROUND LAYER */}
      <Suitokenbackground />
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="mesh-bg absolute inset-0 opacity-50" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* 2. FOREGROUND CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* NAVBAR */}
        <nav className="flex justify-between items-center max-w-6xl mx-auto w-full px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="Logo" className="h-10 w-auto" />
            <h3 className="text-2xl font-bold text-blue-600 tracking-tight">SuiSwap</h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 transition-transform hover:scale-110"
            >
              {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-500" />}
            </button>
            <ConnectButton />
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="text-center py-12 px-4">
          <h1 className="text-5xl font-extrabold text-blue-600 mb-4">Sui ↔ Swap</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Seamlessly swap your testnet tokens with low slippage and high speed.
          </p>
        </section>

        <main className="flex-grow px-4 pb-12">
          <div className="max-w-md mx-auto bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-6">

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                <label>Send</label>
                {account && (
                  <div className="flex items-center gap-2">
                    <span>Balance: {sendToken === "SUI" ? suiBalance.toFixed(4) : walrusBalance.toFixed(4)} {sendToken}</span>
                    <button
                      onClick={() => setSendAmount(sendToken === "SUI" ? suiBalance : walrusBalance)}
                      className="px-2 py-0.5 text-[10px] uppercase font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-black/50 p-4 rounded-2xl border border-transparent focus-within:border-blue-500 transition-all">
                <TokenSelect value={sendToken} onChange={setSendToken} options={["SUI", "WAL"]} />
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={e => setSendAmount(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0.0"
                    min="0"
                    className="bg-transparent text-right w-full text-2xl outline-none font-semibold ml-4"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    ≈ ${((typeof sendAmount === "number" ? sendAmount : 0) * (sendToken === "SUI" ? suiUsd : walUsd)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* SWITCH BUTTON */}
            <div className="flex justify-center -my-8 relative z-20">
              <button
                onClick={handleTokenSwitch}
                className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl hover:rotate-180 transition-all duration-500 group"
              >
                <ArrowDownUp size={20} className="text-blue-600 group-hover:scale-110" />
              </button>
            </div>

            {/* RECEIVE BLOCK */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
                <label>Receive</label>
                {account && <span>Balance: {receiveToken === "SUI" ? suiBalance.toFixed(4) : walrusBalance.toFixed(4)} {receiveToken}</span>}
              </div>
              <div className="flex justify-between items-center bg-slate-50 dark:bg-black/50 p-4 rounded-2xl border border-transparent focus-within:border-blue-500 transition-all">
                <TokenSelect value={receiveToken} onChange={setReceiveToken} options={["WAL", "SUI"]} />
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    value={receiveAmount}
                    onChange={e => setReceiveAmount(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0.0"
                    min="0"
                    className="bg-transparent text-right w-full text-2xl outline-none font-semibold ml-4"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    ≈ ${((typeof receiveAmount === "number" ? receiveAmount : 0) * (receiveToken === "SUI" ? suiUsd : walUsd)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSwap}
              disabled={popupStatus === "loading"}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${popupStatus === "loading"
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                }`}
            >
              {!account ? "Connect Wallet" : popupStatus === "loading" ? "Processing..." : "Confirm & Swap"}
            </button>
          </div>

          {/* 3. TRANSACTION HISTORY SECTION */}
          <div className="mx-auto mt-16 px-4">
            <TransactionHistory />
          </div>
        </main>

        <footer className="py-10" />
      </div>
    </div>
  );
}