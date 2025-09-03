import { secureApiService } from './secureApiService';

export interface JournalAnalysisRequest {
  journalText: string;
  userId: string;
}

export interface JournalAnalysisResponse {
  hiddenBelief: string | null;
  emotionalInsight: string;
  motivationalAffirmation: string;
  tags: string[];
}

export interface JournalAnalysisError {
  error: string;
  code: 'validation' | 'api' | 'network' | 'unknown';
}

class JournalAnalysisService {
  
  /**
   * Analyze a journal entry and generate insights using GPT-4o
   */
  async analyzeJournalEntry(
    journalText: string,
    userId: string
  ): Promise<JournalAnalysisResponse> {
    try {
      // Validate input
      if (!journalText || journalText.trim().length === 0) {
        throw new Error('Journal text cannot be empty');
      }

      if (journalText.length > 350) {
        throw new Error('Journal text must be 350 characters or less');
      }

      // Create the analysis request
      const request = {
        text: journalText.trim(),
        analysis_type: 'journal_insights' as const,
        user_id: userId,
        model: 'gpt-4o',
        prompt_template: this.getJournalAnalysisPrompt(journalText.trim())
      };

      // Call the secure API service
      const result = await secureApiService.analyzeText(request);

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze journal entry');
      }

      // Parse and validate the response
      const analysis = this.parseAnalysisResponse(result.data);

      return {
        hiddenBelief: analysis.hiddenBelief,
        emotionalInsight: analysis.emotionalInsight,
        motivationalAffirmation: analysis.motivationalAffirmation,
        tags: analysis.tags
      };

    } catch (error) {
      console.error('Journal analysis error:', error);
      throw error;
    }
  }

  /**
   * Get the prompt template for journal analysis
   */
  private getJournalAnalysisPrompt(journalText: string): string {
    return `You are an expert therapist and belief-mapping coach.

A user has written a journal entry (60-350 characters). Analyze the journal and return the following in JSON format:

{
  "hiddenBelief": "A possible hidden belief behind the journal entry (if any), or null if none found",
  "emotionalInsight": "A short insight about what the user may be experiencing emotionally or psychologically",
  "motivationalAffirmation": "A motivational affirmation that helps the user challenge the hidden belief and feel supported. If no belief is found, generate a supportive affirmation aligned with the user's tone and insight",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Guidelines:
- Keep insights compassionate and supportive
- Make affirmations specific and actionable
- Tags should be 1-2 words each, capturing themes, emotions, or patterns

Here's the journal entry:
"${journalText}"`;
  }

  /**
   * Parse and validate the analysis response
   */
  private parseAnalysisResponse(data: any): JournalAnalysisResponse {
    try {
      // If the response is already parsed JSON
      if (typeof data === 'object' && data !== null) {
        return {
          hiddenBelief: data.hiddenBelief || null,
          emotionalInsight: data.emotionalInsight || 'I sense you\'re processing some thoughts and feelings.',
          motivationalAffirmation: data.motivationalAffirmation || 'You\'re doing great work by taking time to reflect.',
          tags: Array.isArray(data.tags) ? data.tags.slice(0, 5) : ['reflection']
        };
      }

      // If the response is a string, try to parse it as JSON
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return this.parseAnalysisResponse(parsed);
      }

      // Fallback response
      return {
        hiddenBelief: null,
        emotionalInsight: 'I sense you\'re processing some thoughts and feelings.',
        motivationalAffirmation: 'You\'re doing great work by taking time to reflect.',
        tags: ['reflection']
      };

    } catch (error) {
      console.error('Error parsing analysis response:', error);
      
      // Return a safe fallback
      return {
        hiddenBelief: null,
        emotionalInsight: 'I sense you\'re processing some thoughts and feelings.',
        motivationalAffirmation: 'You\'re doing great work by taking time to reflect.',
        tags: ['reflection']
      };
    }
  }

  /**
   * Validate journal text before analysis
   */
  validateJournalText(text: string): { isValid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: 'Journal text cannot be empty' };
    }

    if (text.length > 350) {
      return { isValid: false, error: 'Journal text must be 350 characters or less' };
    }

    if (text.trim().length < 60) {
      return { isValid: false, error: 'Please write at least 60 characters to get meaningful insights' };
    }

    return { isValid: true };
  }

  /**
   * Get estimated cost for analysis
   */
  getEstimatedCost(textLength: number): number {
    // Rough estimate: $0.01 per 1000 tokens for GPT-3.5, $0.03 for GPT-4o
    const estimatedTokens = Math.ceil(textLength / 4) + 500; // Base prompt + user text
    const gpt4oCost = Math.ceil((estimatedTokens / 1000) * 3); // $0.03 per 1000 tokens for GPT-4o
    const gpt35Cost = Math.ceil((estimatedTokens / 1000) * 1); // $0.01 per 1000 tokens for GPT-3.5
    return Math.max(gpt4oCost, gpt35Cost); // Return higher cost estimate
  }
}

export const journalAnalysisService = new JournalAnalysisService(); 