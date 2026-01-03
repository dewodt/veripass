import { db } from "../db";
import { serviceRecords } from "../db/schema";
import { eq } from "drizzle-orm";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import { type ServiceRecordResponse, formatServiceRecordResponse } from "../dtos/service-record.dto";

export async function getServiceRecordsByAssetId(
  assetId: number
): Promise<SuccessResponse<ServiceRecordResponse[]>> {
  const results = await db
    .select()
    .from(serviceRecords)
    .where(eq(serviceRecords.assetId, assetId));

  return createSuccessResponse(
    results.map(formatServiceRecordResponse),
    "Service records retrieved successfully"
  );
}
