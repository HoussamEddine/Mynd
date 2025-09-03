import React from 'react';
import * as Font from 'expo-font';

export interface FontConfig {
  family: string;
  weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  style?: 'normal' | 'italic';
}

export interface FontProcessorOptions {
  fonts: FontConfig[];
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onLoadError?: (error: Error) => void;
}

export const useFontProcessor = () => {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadFonts = React.useCallback(async (options: FontProcessorOptions) => {
    try {
      setLoading(true);
      setError(null);
      options.onLoadStart?.();

      const fontMap: Record<string, any> = {};
      
      options.fonts.forEach(font => {
        const key = `${font.family}-${font.weight}${font.style === 'italic' ? '-italic' : ''}`;
        fontMap[key] = require(`../assets/fonts/${font.family}-${font.weight}${font.style === 'italic' ? 'Italic' : ''}.ttf`);
      });

      await Font.loadAsync(fontMap);
      
      setFontsLoaded(true);
      options.onLoadComplete?.();
    } catch (err) {
      const fontError = err instanceof Error ? err : new Error('Failed to load fonts');
      setError(fontError);
      options.onLoadError?.(fontError);
    } finally {
      setLoading(false);
    }
  }, []);

  const preloadFonts = React.useCallback(async (fontFamilies: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const fontMap: Record<string, any> = {};
      
      fontFamilies.forEach(family => {
        // Preload common weights
        ['Regular', 'Medium', 'SemiBold', 'Bold'].forEach(weight => {
          const key = `${family}-${weight}`;
          try {
            fontMap[key] = require(`../assets/fonts/${family}-${weight}.ttf`);
          } catch {
            // Font file doesn't exist, skip
          }
        });
      });

      if (Object.keys(fontMap).length > 0) {
        await Font.loadAsync(fontMap);
      }
      
      setFontsLoaded(true);
    } catch (err) {
      const fontError = err instanceof Error ? err : new Error('Failed to preload fonts');
      setError(fontError);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFontFamily = React.useCallback((family: string, weight: string = 'Regular') => {
    return `${family}-${weight}`;
  }, []);

  return {
    fontsLoaded,
    loading,
    error,
    loadFonts,
    preloadFonts,
    getFontFamily,
  };
};

export const FontProcessor: React.FC<FontProcessorOptions> = ({ 
  fonts, 
  onLoadStart, 
  onLoadComplete, 
  onLoadError 
}) => {
  const { loadFonts } = useFontProcessor();

  React.useEffect(() => {
    loadFonts({ fonts, onLoadStart, onLoadComplete, onLoadError });
  }, [fonts, onLoadStart, onLoadComplete, onLoadError, loadFonts]);

  // This component is primarily for configuration, not rendering
  return null;
};

export default FontProcessor;


