import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  wishlist: Set<number>;
  addToWishlist: (id: number) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
}

const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: new Set<number>(),
      addToWishlist: (id: number) => 
        set((state) => ({ wishlist: new Set([...state.wishlist, id]) })),
      removeFromWishlist: (id: number) => 
        set((state) => {
          const newWishlist = new Set(state.wishlist);
          newWishlist.delete(id);
          return { wishlist: newWishlist };
        }),
      isInWishlist: (id: number) => get().wishlist.has(id),
    }),
    {
      name: 'bicycle-wishlist',
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
                wishlist: new Set(parsed.state.wishlist)
              }
            };
          } catch (error) {
            console.error('Error parsing wishlist from storage:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            const toStore = {
              ...value,
              state: {
                ...value.state,
                wishlist: Array.from(value.state.wishlist)
              }
            };
            localStorage.setItem(name, JSON.stringify(toStore));
          } catch (error) {
            console.error('Error storing wishlist:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

export { useWishlist as default, useWishlist };