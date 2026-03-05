import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

async function check() {
    const address = "0xef3abbbefa31257f4437418a7fdfa8c101abab63bd873b9c5379236980491c03";
    const txs = await suiClient.queryTransactionBlocks({
        filter: { FromAddress: address },
        options: { showEffects: true, showBalanceChanges: true },
        limit: 5
    });

    console.log(JSON.stringify(txs, null, 2));
}

check().catch(console.error);
