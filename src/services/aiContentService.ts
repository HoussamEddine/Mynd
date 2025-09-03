import { supabase } from '../lib/supabase';
import { aiContentCache, CACHE_PREFIXES } from './cacheService';

export interface AIContent {
  transformation_text: string;
  positive_belief: string;
  affirmations: string[];
  pep_talk: string;
  user_data: any;
  partial_text?: string;
  full_text?: string;
  free_tier_audio?: {
    transformation_partial: string;
    daily_boost: string;
    first_affirmation: string;
  };
}

class AIContentService {
  // Get AI content from cache or database
  async getAIContent(userId: string): Promise<AIContent | null> {
    try {
      // Check cache first
      const cached = await aiContentCache.get(CACHE_PREFIXES.AI_CONTENT, { userId });
      if (cached) {
        return cached;
      }

      // Fetch from database
      const { data: transformationData, error } = await supabase
        .from('ai_audio_content')
        .select('source_text, content_metadata')
        .eq('user_id', userId)
        .eq('content_type', 'transformation')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !transformationData || transformationData.length === 0) {
        return null;
      }

      const metadata = transformationData[0].content_metadata;
      const aiContent: AIContent = {
        transformation_text: transformationData[0].source_text,
        positive_belief: metadata?.positive_belief || '',
        affirmations: metadata?.affirmations || [],
        pep_talk: metadata?.pep_talk || '',
        user_data: metadata?.user_data || {},
        partial_text: metadata?.partial_text,
        full_text: metadata?.full_text,
        free_tier_audio: metadata?.free_tier_audio
      };

      // Cache the result
      await aiContentCache.set(CACHE_PREFIXES.AI_CONTENT, { userId }, aiContent);

      return aiContent;
    } catch (error) {
      console.error('Error getting AI content:', error);
      return null;
    }
  }

  // Get transformation text (full or partial based on user tier)
  async getTransformationText(userId: string, isPartial: boolean = false): Promise<string | null> {
    try {
      const aiContent = await this.getAIContent(userId);
      if (!aiContent) return null;

      if (isPartial && aiContent.partial_text) {
        return aiContent.partial_text;
      }

      return aiContent.transformation_text;
    } catch (error) {
      console.error('Error getting transformation text:', error);
      return null;
    }
  }

  // Get affirmations
  async getAffirmations(userId: string): Promise<string[]> {
    try {
      const aiContent = await this.getAIContent(userId);
      return aiContent?.affirmations || [];
    } catch (error) {
      console.error('Error getting affirmations:', error);
      return [];
    }
  }

  // Get positive belief
  async getPositiveBelief(userId: string): Promise<string | null> {
    try {
      const aiContent = await this.getAIContent(userId);
      return aiContent?.positive_belief || null;
    } catch (error) {
      console.error('Error getting positive belief:', error);
      return null;
    }
  }

  // Get daily boost (pep talk)
  async getDailyBoost(userId: string): Promise<string | null> {
    try {
      const aiContent = await this.getAIContent(userId);
      return aiContent?.pep_talk || null;
    } catch (error) {
      console.error('Error getting daily boost:', error);
      return null;
    }
  }

  // Get free tier audio URLs
  async getFreeTierAudio(userId: string): Promise<{
    transformation_partial?: string;
    daily_boost?: string;
    first_affirmation?: string;
  } | null> {
    try {
      const aiContent = await this.getAIContent(userId);
      return aiContent?.free_tier_audio || null;
    } catch (error) {
      console.error('Error getting free tier audio:', error);
      return null;
    }
  }

  // Invalidate AI content cache
  async invalidateCache(userId: string): Promise<void> {
    try {
      await aiContentCache.invalidate(CACHE_PREFIXES.AI_CONTENT);
    } catch (error) {
      console.error('Error invalidating AI content cache:', error);
    }
  }

  // Preload AI content for app startup
  async preloadAIContent(userId: string): Promise<void> {
    try {
      // Preload AI content in background
      this.getAIContent(userId);
    } catch (error) {
      console.error('Error preloading AI content:', error);
    }
  }
}

export const aiContentService = new AIContentService(); 