import { useState, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader, Button } from '@/components/common';
import { Skeleton } from '@/components/design-system';
import { EventCard } from './EventCard';
import { EventTypeFilter } from './EventTypeFilter';
import { useAssetEvents, parseLifecycleEvents, useEvidenceByAsset, useIsBackendAvailable } from '@/hooks';
import { staggerContainer, staggerItem } from '@/lib/animations';
import type { LifecycleEvent } from '@/types';
import type { EvidenceResponse } from '@/types/api';

interface EventTimelineProps {
  assetId: bigint;
  showRecordButton?: boolean;
  onRecordClick?: () => void;
}

// Enriched event with backend evidence data
interface EnrichedEvent extends LifecycleEvent {
  evidence?: EvidenceResponse;
}

export function EventTimeline({ assetId, showRecordButton, onRecordClick }: EventTimelineProps) {
  const chainId = useChainId();
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const { isAvailable: isBackendAvailable } = useIsBackendAvailable();

  const { data: rawEvents, isLoading: isLoadingEvents, error } = useAssetEvents(assetId, chainId);
  const { data: evidenceData, isLoading: isLoadingEvidence } = useEvidenceByAsset(
    Number(assetId),
    isBackendAvailable
  );

  // Parse blockchain events
  const events: LifecycleEvent[] = useMemo(() => {
    if (!rawEvents) return [];
    try {
      const parsed = parseLifecycleEvents(rawEvents as readonly (readonly [bigint, bigint, number, `0x${string}`, bigint, `0x${string}`])[]);
      return parsed.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    } catch {
      return [];
    }
  }, [rawEvents]);

  // Enrich events with backend evidence data
  const enrichedEvents: EnrichedEvent[] = useMemo(() => {
    if (!events.length) return [];

    const evidenceMap = new Map<string, EvidenceResponse>();
    if (evidenceData?.data) {
      evidenceData.data.forEach((ev) => {
        evidenceMap.set(ev.dataHash.toLowerCase(), ev);
      });
    }

    return events.map((event) => ({
      ...event,
      evidence: evidenceMap.get(event.dataHash.toLowerCase()),
    }));
  }, [events, evidenceData]);

  const filteredEvents = useMemo(() => {
    if (selectedType === null) return enrichedEvents;
    return enrichedEvents.filter((e) => e.eventType === selectedType);
  }, [enrichedEvents, selectedType]);

  const isLoading = isLoadingEvents || (isBackendAvailable && isLoadingEvidence);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)]">
            Lifecycle Events
            {events.length > 0 && (
              <span className="ml-2 text-[var(--font-size-sm)] font-normal text-[var(--color-text-muted)]">
                ({events.length})
              </span>
            )}
          </h3>
          {showRecordButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRecordClick}
            >
              + Record Event
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {/* Filter */}
        {events.length > 0 && (
          <div className="mb-[var(--spacing-4)]">
            <EventTypeFilter
              selectedType={selectedType}
              onSelect={setSelectedType}
            />
          </div>
        )}

        {/* Events */}
        {isLoading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-accent-red)]">
              Failed to load events.
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)]">
              {events.length === 0
                ? 'No events recorded for this asset yet.'
                : 'No events match the selected filter.'}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-[var(--spacing-4)]"
          >
            <AnimatePresence>
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id.toString()}
                  variants={staggerItem}
                  layout
                >
                  <EnrichedEventCard
                    event={event}
                    isLast={index === filteredEvents.length - 1}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </CardBody>
    </Card>
  );
}

// Enhanced event card with evidence data
function EnrichedEventCard({
  event,
  isLast,
}: {
  event: EnrichedEvent;
  isLast: boolean;
}) {
  const evidence = event.evidence;

  return (
    <div className={`relative pl-8 ${!isLast ? 'pb-6' : ''}`}>
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-3 top-8 bottom-0 w-px bg-[var(--color-border)]" />
      )}

      {/* Timeline dot */}
      <div className={`
        absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center
        ${evidence?.isVerified
          ? 'bg-[var(--color-accent-green-light)]'
          : 'bg-[var(--color-bg-tertiary)]'
        }
      `}>
        {evidence?.isVerified ? (
          <svg className="w-3.5 h-3.5 text-[var(--color-accent-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)]" />
        )}
      </div>

      {/* Event content */}
      <EventCard event={event} isLast={isLast} />

      {/* Evidence details */}
      {evidence && (
        <div className="mt-2 ml-0 p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
          <div className="flex items-center gap-2 mb-2">
            {evidence.isVerified && (
              <span className="text-[var(--font-size-xs)] px-2 py-0.5 rounded-full bg-[var(--color-accent-green-light)] text-[var(--color-accent-green)]">
                Verified
              </span>
            )}
            {evidence.providerName && (
              <span className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
                by {evidence.providerName}
              </span>
            )}
          </div>
          {evidence.description && (
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              {evidence.description}
            </p>
          )}
          {evidence.txHash && (
            <p className="text-[var(--font-size-xs)] font-mono text-[var(--color-text-muted)] mt-1">
              Tx: {evidence.txHash.slice(0, 10)}...{evidence.txHash.slice(-8)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
