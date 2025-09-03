import { useState, useEffect, useCallback } from 'react';
import LanguageService, { SupportedLanguage, SUPPORTED_LANGUAGES } from '../services/languageService';

export function useLanguage() {
  const [languageService] = useState(() => LanguageService.getInstance());
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Get the current language from the service
        const language = languageService.getCurrentLanguage();
        setCurrentLanguage(language);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing language hook:', error);
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, [languageService]);

  const updateLanguage = useCallback(async (language: SupportedLanguage) => {
    try {
      await languageService.updateLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  }, [languageService]);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    return languageService.t(key, params);
  }, [languageService]);

  const getDeviceLanguageInfo = useCallback(() => {
    return languageService.getDeviceLanguageInfo();
  }, [languageService]);

  return {
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isInitialized,
    updateLanguage,
    t,
    getDeviceLanguageInfo,
    languageService
  };
} 