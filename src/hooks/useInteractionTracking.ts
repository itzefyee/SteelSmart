import { useCallback } from 'react';
import { InteractionTrackingService, type InteractionAction } from '@/services/interaction-tracking.service';

/**
 * Hook for tracking user interactions with products
 * 
 * Usage:
 * ```tsx
 * const { trackView, trackClick, trackRFQ } = useInteractionTracking();
 * 
 * // Track product view
 * useEffect(() => {
 *   trackView(productId);
 * }, [productId]);
 * 
 * // Track click from search results
 * <button onClick={() => trackClick(productId, searchContext)}>
 *   View Product
 * </button>
 * ```
 */
export function useInteractionTracking() {
  const trackInteraction = useCallback(
    async (productId: string, action: InteractionAction, searchContext?: any) => {
      try {
        await InteractionTrackingService.trackInteractionClient({
          productId,
          action,
          searchContext,
        });
      } catch (error) {
        // Silently fail - don't break user experience
        console.error('Failed to track interaction:', error);
      }
    },
    []
  );

  const trackView = useCallback(
    (productId: string, searchContext?: any) => {
      trackInteraction(productId, 'view', searchContext);
    },
    [trackInteraction]
  );

  const trackClick = useCallback(
    (productId: string, searchContext?: any) => {
      trackInteraction(productId, 'click', searchContext);
    },
    [trackInteraction]
  );

  const trackSearch = useCallback(
    (productId: string, searchContext: any) => {
      trackInteraction(productId, 'search', searchContext);
    },
    [trackInteraction]
  );

  const trackRFQ = useCallback(
    (productId: string) => {
      trackInteraction(productId, 'rfq');
    },
    [trackInteraction]
  );

  const trackPurchase = useCallback(
    (productId: string) => {
      trackInteraction(productId, 'purchase');
    },
    [trackInteraction]
  );

  const trackAddToCart = useCallback(
    (productId: string) => {
      trackInteraction(productId, 'add_to_cart');
    },
    [trackInteraction]
  );

  return {
    trackView,
    trackClick,
    trackSearch,
    trackRFQ,
    trackPurchase,
    trackAddToCart,
    trackInteraction,
  };
}

/**
 * Hook for getting frequently bought together products
 */
export function useFrequentlyBoughtTogether(productId: string | null) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    setLoading(true);
    InteractionTrackingService.getFrequentlyBoughtTogether(productId, 4)
      .then(results => {
        // Fetch full product data
        return Promise.all(
          results.map(async result => {
            // You'd fetch the full product here
            return { id: result.productId, ...result };
          })
        );
      })
      .then(setProducts)
      .catch(error => {
        console.error('Failed to get frequently bought together:', error);
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  return { products, loading };
}

// Add missing import
import { useEffect, useState } from 'react';
