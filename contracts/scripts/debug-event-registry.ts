import { ethers } from "hardhat";

async function main() {
    // 🔧 CHANGE THIS
    const EVENT_REGISTRY_ADDRESS = process.env.EVENT_REGISTRY_ADDRESS || "";
    const ASSET_ID = 1;

    const [signer] = await ethers.getSigners();
    const provider = signer.provider!;

    console.log("🔍 Debugging EventRegistry");
    console.log("Signer:", signer.address);

    const network = await provider.getNetwork();
    console.log("Chain ID:", network.chainId.toString());
    console.log("----------------------------------");

    // Load EventRegistry
    const registry = await ethers.getContractAt(
        "EventRegistry",
        EVENT_REGISTRY_ADDRESS
    );

    console.log("EventRegistry address:", registry.target);

    // 1️⃣ Check AssetPassport wiring
    const passportAddress = await registry.assetPassport();
    console.log("assetPassport() =", passportAddress);

    if (passportAddress === ethers.ZeroAddress) {
        console.error("❌ AssetPassport NOT SET on EventRegistry");
        return;
    }

    // Load AssetPassport
    const passport = await ethers.getContractAt(
        "AssetPassport",
        passportAddress
    );

    // 2️⃣ Check asset existence
    console.log("----------------------------------");
    console.log(`Checking assetId = ${ASSET_ID}`);

    try {
        const assetInfo = await passport.getAssetInfo(ASSET_ID);
        console.log("✅ Asset exists");
        console.log(assetInfo);
    } catch (err) {
        console.error("❌ getAssetInfo reverted → Asset NOT found");
        console.error(err);
        return;
    }

    // 3️⃣ Check ownership (ERC721)
    try {
        const owner = await passport.ownerOf(ASSET_ID);
        console.log("Asset owner:", owner);
    } catch {
        console.warn("⚠️ ownerOf reverted (not ERC721 or asset missing)");
    }

    // 4️⃣ Optional: check trusted oracle
    console.log("----------------------------------");
    const isTrusted = await registry.isTrustedOracle(signer.address);
    console.log("Signer is trusted oracle:", isTrusted);

    // 5️⃣ Query all events for this asset
    console.log("----------------------------------");
    console.log(`Fetching events for assetId = ${ASSET_ID}...`);
    try {
        const events = await registry.getEventsByAsset(ASSET_ID);
        console.log(`✅ Found ${events.length} events on-chain:`);
        events.forEach((event: any, idx: number) => {
            console.log(`\n  Event #${idx + 1}:`);
            console.log(`    ID: ${event.id}`);
            console.log(`    AssetId: ${event.assetId}`);
            console.log(`    EventType: ${event.eventType}`);
            console.log(`    Submitter: ${event.submitter}`);
            console.log(`    Timestamp: ${event.timestamp} (${new Date(Number(event.timestamp) * 1000).toISOString()})`);
            console.log(`    DataHash: ${event.dataHash}`);
        });
    } catch (err: any) {
        console.error("❌ getEventsByAsset failed:", err.message);
    }

    // 6️⃣ Get total event count
    console.log("----------------------------------");
    try {
        const totalCount = await registry.getEventCount(ASSET_ID);
        console.log(`Total event count for asset ${ASSET_ID}: ${totalCount}`);
    } catch (err: any) {
        console.error("❌ getEventCount failed:", err.message);
    }

    console.log("\n✅ Debug completed");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
