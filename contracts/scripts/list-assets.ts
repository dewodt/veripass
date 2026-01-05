import { ethers } from "hardhat";

async function main() {
    // 🔧 CHANGE THIS
    const ASSET_PASSPORT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

    const provider = ethers.provider;

    console.log("🔍 Listing all AssetPassport tokens");
    console.log("AssetPassport:", ASSET_PASSPORT_ADDRESS);

    const passport = await ethers.getContractAt(
        "AssetPassport",
        ASSET_PASSPORT_ADDRESS
    );

    const network = await provider.getNetwork();
    console.log("Chain ID:", network.chainId.toString());
    console.log("----------------------------------");

    /**
     * ERC721 mint emits:
     * Transfer(address(0), to, tokenId)
     */
    const filter = passport.filters.Transfer(
        ethers.ZeroAddress,
        null
    );

    const events = await passport.queryFilter(filter, 0, "latest");

    if (events.length === 0) {
        console.log("⚠️ No assets minted yet");
        return;
    }

    console.log(`✅ Found ${events.length} asset(s)`);

    for (const ev of events) {
        const tokenId = ev.args?.tokenId;
        if (!tokenId) continue;

        try {
            const owner = await passport.ownerOf(tokenId);
            console.log(`Asset ID ${tokenId.toString()} → owner ${owner}`);
        } catch {
            console.log(`Asset ID ${tokenId.toString()} → burned or invalid`);
        }
    }

    console.log("----------------------------------");
    console.log("✅ Done");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
