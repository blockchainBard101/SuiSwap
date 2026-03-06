import { useState, useEffect } from "react";
import { Sun, Moon, ArrowDownUp } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import Logo from "./assets/Logo.png";
import TokenSelect from "./components/TokenSelect";
import TransactionHistory from "./components/Transactionhistory";
import Suitokenbackground from "./components/Suitokenbackground";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [sendToken, setSendToken] = useState("SUI");
  const [receiveToken, setReceiveToken] = useState("WAL");
  const [sendAmount, setSendAmount] = useState(1);
  const [receiveAmount, setReceiveAmount] = useState(2.3);
  const [popupStatus, setPopupStatus] = useState<null | "loading" | "success" | "error">(null);

  const handleTokenSwitch = () => {
    setSendToken(receiveToken);
    setReceiveToken(sendToken);
    setSendAmount(receiveAmount);
    setReceiveAmount(sendAmount);
  };

  const handleSwap = async () => {
    if (!account) {
      setModalOpen(true); // Better UX: Open modal instead of just alerting
      return;
    }
    setPopupStatus("loading");
    await new Promise(r => setTimeout(r, 2000));
    setPopupStatus(Math.random() > 0.3 ? "success" : "error");
    setTimeout(() => setPopupStatus(null), 3000);
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
            <ConnectButton modal={{ isOpen: modalOpen, setIsOpen: setModalOpen }} />
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Send</label>
              <div className="flex justify-between bg-slate-50 dark:bg-black/50 p-4 rounded-2xl border border-transparent focus-within:border-blue-500 transition-all">
                <TokenSelect value={sendToken} onChange={setSendToken} options={["SUI", "WAL", "IKA", "WACKO"]} />
                <input
                  type="number"
                  value={sendAmount}
                  onChange={e => setSendAmount(Number(e.target.value))}
                  className="bg-transparent text-right w-full text-2xl outline-none font-semibold ml-4"
                />
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Receive</label>
              <div className="flex justify-between bg-slate-50 dark:bg-black/50 p-4 rounded-2xl border border-transparent focus-within:border-blue-500 transition-all">
                <TokenSelect value={receiveToken} onChange={setReceiveToken} options={["WAL", "SUI", "IKA", "WACKO"]} />
                <input
                  type="number"
                  value={receiveAmount}
                  onChange={e => setReceiveAmount(Number(e.target.value))}
                  className="bg-transparent text-right w-full text-2xl outline-none font-semibold ml-4"
                />
              </div>
            </div>

            <button
              onClick={handleSwap}
              disabled={popupStatus === "loading"}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 ${
                popupStatus === "loading" 
                ? "bg-slate-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
              }`}
            >
              {!account ? "Connect Wallet" : popupStatus === "loading" ? "Processing..." : "Confirm & Swap"}
            </button>
          </div>

          {/* 3. TRANSACTION HISTORY SECTION */}
          <div className="mx-auto mt-16 px-4">
             <TransactionHistory account={account} />
          </div>
        </main>

        <footer className="py-10" />
      </div>
    </div>
  );
}                 