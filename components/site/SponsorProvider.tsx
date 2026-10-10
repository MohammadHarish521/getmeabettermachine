"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { SponsorModal } from "@/components/site/SponsorModal";
import { ALL_SPOTS_ID } from "@/config/spots";
import type { PublicSpot } from "@/lib/types";

type SponsorContextValue = {
  openSponsor: (spotId?: string) => void;
  recordClick: (spotId: string) => void;
  clicksFor: (spot: PublicSpot) => number;
};

const SponsorContext = createContext<SponsorContextValue>({
  openSponsor: () => {},
  recordClick: () => {},
  clicksFor: (spot) => spot.clicks,
});

export function useSponsor() {
  return useContext(SponsorContext);
}

export function SponsorProvider({
  children,
  spots,
}: {
  children: React.ReactNode;
  spots: PublicSpot[];
}) {
  const [open, setOpen] = useState(false);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [clickBump, setClickBump] = useState<Record<string, number>>({});

  const clicksFor = useCallback(
    (spot: PublicSpot) => spot.clicks + (clickBump[spot.id] ?? 0),
    [clickBump],
  );

  const recordClick = useCallback((id: string) => {
    setClickBump((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }));
    void fetch(`/api/spots/${encodeURIComponent(id)}/click`, {
      method: "POST",
    }).catch(() => {
      setClickBump((current) => ({
        ...current,
        [id]: Math.max(0, (current[id] ?? 1) - 1),
      }));
    });
  }, []);

  const openSponsor = useCallback(
    (id?: string) => {
      setSpotId(id ?? null);
      setOpen(true);
      if (id && id !== ALL_SPOTS_ID) recordClick(id);
    },
    [recordClick],
  );

  const value = useMemo(
    () => ({ openSponsor, recordClick, clicksFor }),
    [openSponsor, recordClick, clicksFor],
  );

  return (
    <SponsorContext.Provider value={value}>
      {children}
      <SponsorModal
        open={open}
        spotId={spotId}
        spots={spots}
        onClose={() => setOpen(false)}
        onPickSpot={setSpotId}
      />
    </SponsorContext.Provider>
  );
}
