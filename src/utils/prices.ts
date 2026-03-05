// Price utilities for SuiWalSwap

export const MAINNET_WAL_TYPE =
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL";

export const getTokenPriceSui = async (token: string): Promise<number> => {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${token}`,
    {
      method: "GET",
      headers: {},
    },
  );
  const responseData = await response.json();
  const data = responseData?.pairs?.[0];
  const priceNative = Number(data?.priceNative ?? 0);
  return Number.isFinite(priceNative) ? priceNative : 0;
};

export const getWalPriceInSuiMainnet = async (): Promise<number> => {
  return getTokenPriceSui(MAINNET_WAL_TYPE);
};

// Returns how many WAL you get for 1 SUI on the given network
export const getWalRateForNetwork = async (
  network: string,
): Promise<number> => {
  // Testnet: on-chain exchange is 1 SUI => 1 WAL
  if (network === "testnet") return 1;

  // For mainnet, use Dexscreener priceNative (WAL priced in SUI)
  const walPriceInSui = await getWalPriceInSuiMainnet();
  if (!walPriceInSui || walPriceInSui <= 0) return 0;
  // If WAL = P SUI, then 1 SUI buys 1/P WAL
  return 1 / walPriceInSui;
};

export const getTokenPriceUsd = async (token: string): Promise<number> => {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${token}`,
    {
      method: "GET",
      headers: {},
    },
  );
  const responseData = await response.json();
  const data = responseData?.pairs?.[0];
  const priceUsd = Number(data?.priceUsd ?? 0);
  return Number.isFinite(priceUsd) ? priceUsd : 0;
};

export const SUI_TYPE = "0x2::sui::SUI";

export const getSuiUsd = async (): Promise<number> => {
  return getTokenPriceUsd(SUI_TYPE);
};

export const getWalUsdMainnet = async (): Promise<number> => {
  return getTokenPriceUsd(MAINNET_WAL_TYPE);
};
