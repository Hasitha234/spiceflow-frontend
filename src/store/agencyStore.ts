import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AgencyState {
  agencyName: string | null;
  agencyLogo: string | null;
  setAgencyName: (name: string | null) => void;
  setAgencyLogo: (logo: string | null) => void;
}

export const useAgencyStore = create<AgencyState>()(
  persist(
    (set) => ({
      agencyName: null,
      agencyLogo: null,
      setAgencyName: (name) => set({ agencyName: name }),
      setAgencyLogo: (logo) => set({ agencyLogo: logo }),
    }),
    { name: 'sf_agency' },
  ),
);
