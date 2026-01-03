import { db } from "./index";
import { serviceProviders, serviceRecords } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Seed service providers
  await db.insert(serviceProviders).values([
    {
      providerId: "rolex-service-jakarta",
      providerName: "Rolex Official Service Center Jakarta",
      providerType: "service_center",
      isTrusted: true,
    },
    {
      providerId: "authorized-inspector",
      providerName: "PT Inspeksi Indonesia",
      providerType: "inspector",
      isTrusted: true,
    },
  ]);

  // Seed example service record
  await db.insert(serviceRecords).values({
    recordId: "SVC-2024-001",
    assetId: 1,
    providerId: "rolex-service-jakarta",
    serviceType: "ROUTINE_MAINTENANCE",
    serviceDate: "2024-12-01",
    technician: "Ahmad Rizki",
    workPerformed: ["Movement cleaning", "Water resistance test", "Gasket replacement"],
    notes: "Watch in excellent condition",
    verified: true,
  });

  console.log("✅ Database seeded!");
}

seed()
  .catch(console.error)
  .then(() => process.exit(0));
