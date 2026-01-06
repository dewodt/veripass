import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateEvidenceRequest, EvidenceResponse, ApiResponse, CalculateHashRequest, CalculateHashResponse } from '@/types/api';

// Query key factory
export const evidenceKeys = {
  all: ['evidence'] as const,
  byAsset: (assetId: number) => [...evidenceKeys.all, 'byAsset', assetId] as const,
  byHash: (hash: string) => [...evidenceKeys.all, 'byHash', hash] as const,
};

// Get evidence by asset ID
export function useEvidenceByAsset(assetId: number | undefined, enabled: boolean = true) {
  return useQuery<ApiResponse<EvidenceResponse[]>>({
    queryKey: evidenceKeys.byAsset(assetId!),
    queryFn: () => api.getEvidenceByAsset(assetId!),
    enabled: enabled && assetId !== undefined,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15_000, // Poll every 15 seconds for real-time updates
  });
}

// Get evidence by hash
export function useEvidenceByHash(hash: string | undefined, enabled: boolean = true) {
  return useQuery<ApiResponse<EvidenceResponse>>({
    queryKey: evidenceKeys.byHash(hash!),
    queryFn: () => api.getEvidenceByHash(hash!),
    enabled: enabled && !!hash,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15_000, // Poll every 15 seconds for real-time updates
  });
}

// Calculate evidence hash mutation (no DB write)
export function useCalculateEvidenceHash() {
  return useMutation<ApiResponse<CalculateHashResponse>, Error, CalculateHashRequest>({
    mutationFn: (data: CalculateHashRequest) => api.calculateEvidenceHash(data),
  });
}

// Create evidence mutation
export function useCreateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEvidenceRequest) => api.createEvidence(data),
    onSuccess: (response) => {
      // Invalidate evidence queries for this asset
      queryClient.invalidateQueries({
        queryKey: evidenceKeys.byAsset(response.data.assetId),
      });
    },
  });
}
