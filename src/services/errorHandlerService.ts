class ErrorHandlerService {
  logError(error: Error, context: string): void {
    console.error(`[${context}] Error:`, error);
  }
}

export const errorHandlerService = new ErrorHandlerService();
