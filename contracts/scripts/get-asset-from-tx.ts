import { ethers } from "hardhat";

async function main() {
    // 🔧 CHANGE THIS
    const TX_HASH =
        "0xba27b8a6d8b25e74f4ee61bee59cc223818c08f14d00a8ffc302cf128f3f779e";

    // Optional: set explicitly if you want
    // const ASSET_PASSPORT_ADDRESS = "0x...";

    const provider = ethers.provider;

    console.log("🔍 Fetching tx receipt");
    console.log("Tx hash:", TX_HASH);

    const receipt = await provider.getTransactionReceipt(TX_HASH);

    if (!receipt) {
        console.error("❌ Transaction not found");
        return;
    }

    console.log("✅ Tx confirmed in block", receipt.blockNumber);
    console.log("----------------------------------");

    // Find ERC721 Transfer(from=0x0) → mint
    const transferTopic = ethers.id(
        "Transfer(address,address,uint256)"
    );

    const mintLogs = receipt.logs.filter(
        (log) =>
            log.topics[0] === transferTopic &&
            log.topics[1] === ethers.ZeroHash // from == address(0)
    );

    if (mintLogs.length === 0) {
        console.error("❌ No ERC721 mint event found in this tx");
        return;
    }

    for (const log of mintLogs) {
        const tokenId = BigInt(log.topics[3]);

        console.log("🆔 Minted Asset ID:", tokenId.toString());
        console.log("Contract address:", log.address);

        // If AssetPassport address not provided, infer from log
        const passportAddress = log.address;

        const passport = await ethers.getContractAt(
            "AssetPassport",
            passportAddress
        );

        try {
            const info = await passport.getAssetInfo(tokenId);
            console.log("✅ Asset info:");
            console.log(info);
        } catch {
            console.warn(
                "⚠️ getAssetInfo reverted — contract might not expose it"
            );
        }

        try {
            const owner = await passport.ownerOf(tokenId);
            console.log("Owner:", owner);
        } catch {
            console.warn("⚠️ ownerOf failed");
        }

        console.log("----------------------------------");
    }

    console.log("✅ Done");
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
