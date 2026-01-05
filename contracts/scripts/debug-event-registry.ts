import { ethers } from "hardhat";

async function main() {
    // 🔧 CHANGE THIS
    const EVENT_REGISTRY_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
    const ASSET_ID = 3;

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

    console.log("✅ Debug completed");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
