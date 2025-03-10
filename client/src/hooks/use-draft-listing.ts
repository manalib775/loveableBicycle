import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InsertBicycle } from '@shared/schema';

interface DraftListingState {
  draft: Partial<InsertBicycle> | null;
  setDraft: (draft: Partial<InsertBicycle>) => void;
  clearDraft: () => void;
}

const useDraftListing = create<DraftListingState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'bicycle-draft-listing',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str);
            return {
              ...parsed,
              state: {
                ...parsed.state,
                draft: parsed.state.draft || null
              }
            };
          } catch (error) {
            console.error('Error parsing draft listing:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error storing draft listing:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export default useDraftListing;