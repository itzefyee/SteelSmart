/**
 * Interaction Tracking Service
 * 
 * Tracks user interactions with products for:
 * - Collaborative filtering
 * - Analytics
 * - Personalized recommendations
 * - "Frequently bought together" features
 */

import { getSupabaseServer } from '@/lib/supabase-server';
import { supabase as clientSupabase } from '@/lib/supabase';

export type InteractionAction = 'view' | 'click' | 'search' | 'rfq' | 'purchase' | 'add_to_cart';

export interface InteractionData {
  productId: string;
  action: InteractionAction;
  searchContext?: {
    material?: string;
    category?: string;
    dimensions?: string;
    loadCapacity?: string;
    query?: string;
  };
  sessionId?: string;
}

export interface FrequentlyBoughtTogether {
  productId: string;
  coOccurrenceCount: number;
  interactionTypes: string[];
}

export interface SimilarSearchRecommendation {
  productId: string;
  interactionCount: number;
  avgConfidence: number;
}

export class InteractionTrackingService {
  /**
   * Track a user interaction (client-side)
   * Uses client Supabase instance with RLS
   * 
   * TODO: Re-enable after regenerating Supabase types with user_product_interactions table
   */
  static async trackInteractionClient(data: InteractionData): Promise<void> {
    try {
      // Interaction tracking temporarily disabled - table exists but not in TypeScript types
      return;

      /* 
      const { data: { user } } = await clientSupabase.auth.getUser();
      
      const { error } = await clientSupabase
        .from('user_product_interactions')
        .insert({
          user_id: user?.id || null,
          product_id: data.productId,
          action: data.action,
          search_context: data.searchContext || {},
          session_id: data.sessionId || this.getSessionId(),
        });

      if (error) {
        console.error('Failed to track interaction:', error);
      }
      */
    } catch (error) {
      // Silently fail - don't break user experience
      console.error('Interaction tracking error:', error);
    }
  }

  /**
   * Track a user interaction (server-side)
   * Uses service role for admin operations
   * 
   * TODO: Re-enable after regenerating Supabase types with user_product_interactions table
   */
  static async trackInteractionServer(
    userId: string | null,
    data: InteractionData
  ): Promise<void> {
    try {
      // Interaction tracking temporarily disabled - table exists but not in TypeScript types
      return;

      /* 
      const supabase = await getSupabaseServer();
      
      const { error } = await supabase
        .from('user_product_interactions')
        .insert({
          user_id: userId,
          product_id: data.productId,
          action: data.action,
          search_context: data.searchContext || {},
          session_id: data.sessionId || this.getSessionId(),
        });

      if (error) {
        console.error('Failed to track interaction:', error);
      }
      */
    } catch (error) {
      console.error('Interaction tracking error:', error);
    }
  }

  /**
   * Get frequently bought/viewed together products
   * 
   * TODO: Re-enable after regenerating Supabase types with RPC functions
   */
  static async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 4
  ): Promise<FrequentlyBoughtTogether[]> {
    try {
      // Frequently bought together temporarily disabled - RPC function exists but not in TypeScript types
      return [];

      /* 
      const supabase = await getSupabaseServer();
      
      const { data, error } = await supabase.rpc('get_frequently_bought_together', {
        p_product_id: productId,
        p_limit: limit,
      });

      if (error) {
        console.error('Failed to get frequently bought together:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        productId: item.product_id,
        coOccurrenceCount: parseInt(item.co_occurrence_count),
        interactionTypes: item.interaction_types || [],
      }));
      */
    } catch (error) {
      console.error('Error getting frequently bought together:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on similar searches
   * 
   * TODO: Re-enable after regenerating Supabase types with RPC functions
   */
  static async getSimilarSearchRecommendations(
    searchContext: {
      material?: string;
      category?: string;
    },
    limit: number = 5
  ): Promise<SimilarSearchRecommendation[]> {
    try {
      // Similar search recommendations temporarily disabled - RPC function exists but not in TypeScript types
      return [];

      /* 
      const supabase = await getSupabaseServer();
      
      const { data, error } = await supabase.rpc('get_similar_search_recommendations', {
        p_material: searchContext.material || null,
        p_category: searchContext.category || null,
        p_limit: limit,
      });

      if (error) {
        console.error('Failed to get similar search recommendations:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        productId: item.product_id,
        interactionCount: parseInt(item.interaction_count),
        avgConfidence: parseFloat(item.avg_confidence),
      }));
      */
    } catch (error) {
      console.error('Error getting similar search recommendations:', error);
      return [];
    }
  }

  /**
   * Get or create session ID for anonymous tracking
   */
  private static getSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Track product view
   */
  static async trackProductView(productId: string, searchContext?: any): Promise<void> {
    await this.trackInteractionClient({
      productId,
      action: 'view',
      searchContext,
    });
  }

  /**
   * Track product click (from search results)
   */
  static async trackProductClick(productId: string, searchContext?: any): Promise<void> {
    await this.trackInteractionClient({
      productId,
      action: 'click',
      searchContext,
    });
  }

  /**
   * Track search action
   */
  static async trackSearch(productId: string, searchContext: any): Promise<void> {
    await this.trackInteractionClient({
      productId,
      action: 'search',
      searchContext,
    });
  }

  /**
   * Track RFQ submission
   */
  static async trackRFQ(productId: string): Promise<void> {
    await this.trackInteractionClient({
      productId,
      action: 'rfq',
    });
  }

  /**
   * Track purchase (if applicable)
   */
  static async trackPurchase(productId: string): Promise<void> {
    await this.trackInteractionClient({
      productId,
      action: 'purchase',
    });
  }
}
