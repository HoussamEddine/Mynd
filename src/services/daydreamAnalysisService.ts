import Constants from 'expo-constants';

export interface DaydreamAnalysis {
  core_revelation: string;
  hidden_core_belief: string;
  emotional_truth: string;
  counteracting_affirmation: string;
  your_new_story: string;
  tags: {
    theme: string[];
    emotion: string[];
    symbols: string[];
  };
  message_for_you: string;
}

export class DaydreamAnalysisService {
  /**
   * Validate if the text is actually a daydream
   */
  static async validateDaydream(text: string): Promise<boolean> {
    try {
      const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;
      if (!OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is undefined! Check your app.config.js/app.json and restart Expo with -c.');
        return true; // Default to true if no API key
      }

      const validationPrompt = `Does the following text describe a personal daydream, an imaginative scenario, or an inner thought-story? Respond with only 'YES' or 'NO'.

Text: "${text}"`;

      const controller = new AbortController();
      const timeout = 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a validation assistant. Respond only with YES or NO.'
              },
              {
                role: 'user',
                content: validationPrompt
              }
            ],
            max_tokens: 10,
            temperature: 0.1
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          return true; // Default to true if API fails
        }

        const data = await response.json();
        const result = data.choices[0]?.message?.content?.trim().toUpperCase();
        return result === 'YES';
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error validating daydream:', error);
        return true; // Default to true if validation fails
      }
    } catch (error) {
      console.error('Error in validateDaydream:', error);
      return true; // Default to true if validation fails
    }
  }

  /**
   * Analyze a daydream and return structured insights
   */
  static async analyzeDaydream(daydreamText: string): Promise<DaydreamAnalysis> {
    try {
      const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;
      if (!OPENAI_API_KEY) {
        console.warn('OPENAI_API_KEY is undefined! Check your app.config.js/app.json and restart Expo with -c.');
        throw new Error('OpenAI API key not configured');
      }

      const analysisPrompt = `You are a powerful and intuitive subconscious guide for a mindset app. Your tone is direct, confident, and empathetic. You speak to the user as a coach who is revealing profound truths about their inner world.

The user has logged the following daydream:
"${daydreamText}"

Your response must be a single JSON object. Do not include any text outside of the JSON. The JSON object must contain the following keys:

1. "core_revelation": A direct, powerful sentence summarizing the main insight from the daydream. It should be a profound observation.
2. "hidden_core_belief": A single, impactful statement of the fundamental, self-limiting belief driving the daydream. Do not start with 'Your daydream...' or 'The belief is...'. Simply state the belief as a direct quote, as if it is a thought the user is having.
3. "emotional_truth": A single sentence describing the dominant emotional tone and what it reveals about the user's current state.
4. "counteracting_affirmation": A new, positive affirmation that directly addresses and rewrites the "hidden_core_belief".
5. "your_new_story": A powerful, new narrative or perspective the user can adopt to replace the old belief.
6. "tags": A nested JSON object with three keys: "theme", "emotion", and "symbols". Each key should contain an array of **highly accurate and revealing** tag strings. The tags should be specific, not generic, and truly capture the essence of the daydream.
7. "message_for_you": A short, direct, and powerful statement that cuts through the noise and speaks to the user personally.

Example Output Structure:
{
  "core_revelation": "Your story reveals a deep-seated fear of being seen and judged by others.",
  "hidden_core_belief": "I am not good enough to be in the spotlight.",
  "emotional_truth": "The dominant emotion is fear, which points to a desire for validation that you are not currently receiving.",
  "counteracting_affirmation": "I am worthy of being seen and heard. My presence and my voice are powerful.",
  "your_new_story": "Your story is not one of being alone on a stage, but of being a powerful speaker on the verge of sharing a valuable message. You have the words, and your voice is ready to be heard.",
  "tags": {
    "theme": ["Imposter Syndrome", "Public Speaking", "Self-Doubt"],
    "emotion": ["Anxiety", "Vulnerability", "Fear"],
    "symbols": ["Stage", "Microphone", "Blurry Crowd"]
  },
  "message_for_you": "This feeling of powerlessness is just a story. It is not your truth."
}`;

      const controller = new AbortController();
      const timeout = 45000; // 45 seconds for GPT-4o
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      let response;
      let modelUsed = 'gpt-4o';

      try {
        // Try GPT-4o first
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a subconscious analyst and psychological guide. Provide insights in the exact JSON format requested.'
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            max_tokens: 800,
            temperature: 0.7
          }),
          signal: controller.signal,
        });
      } catch (gpt4Error) {
        console.log('GPT-4o failed, trying gpt-4:', (gpt4Error as Error).message);
        modelUsed = 'gpt-4';
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are a subconscious analyst and psychological guide. Provide insights in the exact JSON format requested.'
              },
              {
                role: 'user',
                content: analysisPrompt
              }
            ],
            max_tokens: 800,
            temperature: 0.7
          }),
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error('OpenAI API error: ' + response.status + ' ' + errorText);
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      // Clean and parse the JSON response
      let cleanedResult = result.trim();
      
      // Remove any markdown code blocks if present
      if (cleanedResult.startsWith('```json')) {
        cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResult.startsWith('```')) {
        cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to parse the JSON
      let analysis: DaydreamAnalysis;
      try {
        analysis = JSON.parse(cleanedResult) as DaydreamAnalysis;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', result);
        console.error('Cleaned response:', cleanedResult);
        throw new Error('Invalid JSON response from AI');
      }
      
      // Validate the response structure
      if (!analysis.core_revelation || !analysis.hidden_core_belief || !analysis.emotional_truth || 
          !analysis.counteracting_affirmation || !analysis.your_new_story || !analysis.tags || !analysis.message_for_you) {
        throw new Error('Invalid analysis structure');
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing daydream:', error);
      throw new Error('Failed to analyze daydream. Please try again.');
    }
  }

  /**
   * Complete daydream analysis flow with validation
   */
  static async analyzeDaydreamWithValidation(daydreamText: string): Promise<{
    isValid: boolean;
    analysis?: DaydreamAnalysis;
    error?: string;
  }> {
    try {
      // Step 1: Validate the daydream
      const isValid = await this.validateDaydream(daydreamText);
      
      if (!isValid) {
        return {
          isValid: false,
          error: "This doesn't seem like a daydream. Please try describing a scenario from your imagination."
        };
      }

      // Step 2: Analyze the daydream
      const analysis = await this.analyzeDaydream(daydreamText);
      
      return {
        isValid: true,
        analysis
      };
    } catch (error) {
      console.error('Error in daydream analysis flow:', error);
      return {
        isValid: false,
        error: 'Failed to analyze your daydream. Please try again.'
      };
    }
  }
} 