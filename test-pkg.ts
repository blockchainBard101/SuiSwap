import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

async function check() {
    const pkgId = "0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f";
    const pkg = await suiClient.getObject({
        id: pkgId,
        options: { showBcs: true, showDisplay: true }
    });
    console.log(JSON.stringify(pkg, null, 2));
}

check().catch(console.error);
