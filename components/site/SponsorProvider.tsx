"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { SponsorModal } from "@/components/site/SponsorModal";
import type { PublicSpot } from "@/lib/types";

type SponsorContextValue = {
  openSponsor: (spotId?: string) => void;
};

const SponsorContext = createContext<SponsorContextValue>({
  openSponsor: () => {},
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
  const openSponsor = useCallback((id?: string) => {
    setSpotId(id ?? null);
    setOpen(true);
  }, []);
  const value = useMemo(() => ({ openSponsor }), [openSponsor]);

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
