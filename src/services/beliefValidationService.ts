import { appApiService } from './appApiService';
import { errorHandlerService } from './errorHandlerService';

export interface BeliefValidationResult {
  is_core_limiting_belief: boolean;
  reason_if_not_belief?: string;
  suggestion_for_rephrasing?: string;
  confidence_score_percent: number;
}

export class BeliefValidationService {
  /**
   * Validates if a belief is a core limiting belief
   * @param belief - The belief text to validate
   * @returns Promise<BeliefValidationResult>
   */
  static async validateCoreBelief(belief: string): Promise<BeliefValidationResult> {
    try {
      const validation = await appApiService.validateCoreBelief(belief);
      return validation;
    } catch (error) {
      errorHandlerService.logError(error, 'BELIEF_VALIDATION_SERVICE');
      throw error;
    }
  }

  /**
   * Checks if a belief validation result indicates a valid core limiting belief
   * @param validation - The validation result
   * @returns boolean
   */
  static isValidCoreBelief(validation: BeliefValidationResult): boolean {
    return validation.is_core_limiting_belief && validation.confidence_score_percent >= 70;
  }

  /**
   * Gets a user-friendly error message from validation result
   * @param validation - The validation result
   * @returns string - User-friendly error message
   */
  static getErrorMessage(validation: BeliefValidationResult): string {
    if (!validation.is_core_limiting_belief) {
      let errorMessage = validation.reason_if_not_belief || 'This doesn\'t seem to be a core limiting belief.';
      if (validation.suggestion_for_rephrasing) {
        errorMessage += `\n\nTry: "${validation.suggestion_for_rephrasing}"`;
      }
      return errorMessage;
    }
    
    if (validation.confidence_score_percent < 70) {
      return 'Please provide a more specific limiting belief.';
    }
    
    return '';
  }
}
