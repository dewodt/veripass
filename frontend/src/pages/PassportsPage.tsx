import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useChainId } from 'wagmi';
import { Button, Card, CardBody } from '@/components/common';
import { PassportList } from '@/components/passport';
import { useNextTokenId, usePassport } from '@/hooks';
import type { Passport } from '@/types';

export function PassportsPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  // Get total supply to know how many passports exist
  const { data: nextTokenId, isLoading: isLoadingCount } = useNextTokenId(chainId);

  // Generate token IDs based on total supply
  const tokenIds = useMemo(() => {
    const tokenIdValue = nextTokenId as bigint | undefined;
    if (!tokenIdValue || tokenIdValue <= 1n) return [];
    const count = Number(tokenIdValue) - 1;
    return Array.from({ length: count }, (_, i) => BigInt(i + 1));
  }, [nextTokenId]);

  // Fetch passport data for each token ID
  const passportQueries = tokenIds.map(tokenId => usePassport(tokenId, chainId));

  // Combine results
  const passports = useMemo(() => {
    return passportQueries
      .map(query => query.passport)
      .filter((passport): passport is Passport => passport !== undefined);
  }, [passportQueries]);

  // Check if any are still loading
  const isLoading = isLoadingCount || passportQueries.some(query => query.isLoading);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Passports</h1>
          {nextTokenId !== undefined && (nextTokenId as bigint) > 1n && (
            <p className="text-sm text-gray-500 mt-1">
              {String(Number(nextTokenId as bigint) - 1)} passports minted
            </p>
          )}
        </div>
        <Link to="/mint">
          <Button>Mint New</Button>
        </Link>
      </div>

      {!isConnected ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">
              Connect your wallet to view passports.
            </p>
          </CardBody>
        </Card>
      ) : (
        <PassportList
          passports={passports}
          isLoading={isLoading}
          emptyMessage="No passports have been minted yet."
        />
      )}
    </div>
  );
}
