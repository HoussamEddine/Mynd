import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

export interface DeprecatedProps {
  children: React.ReactNode;
  message?: string;
  alternative?: string;
  style?: ViewStyle;
  showWarning?: boolean;
  onDeprecationWarning?: (componentName: string, message: string) => void;
}

export const Deprecated: React.FC<DeprecatedProps> = ({
  children,
  message = 'This component is deprecated and will be removed in a future version.',
  alternative,
  style,
  showWarning = true,
  onDeprecationWarning,
}) => {
  React.useEffect(() => {
    if (showWarning) {
      const warningMessage = alternative 
        ? `${message} Please use ${alternative} instead.`
        : message;
      
      console.warn(`[DEPRECATED] ${warningMessage}`);
      onDeprecationWarning?.('Deprecated', warningMessage);
    }
  }, [message, alternative, showWarning, onDeprecationWarning]);

  if (showWarning) {
    return (
      <View style={[{ 
        backgroundColor: theme.foundations.colors.warning + '20',
        borderWidth: 1,
        borderColor: theme.foundations.colors.warning,
        borderRadius: theme.foundations.radii.sm,
        padding: theme.foundations.spacing.sm,
        margin: theme.foundations.spacing.xs,
      }, style]}>
        <Text style={{
          color: theme.foundations.colors.warning,
          fontSize: theme.foundations.fonts.sizes.sm,
          fontFamily: theme.foundations.fonts.families.medium,
        }}>
          ⚠️ Deprecated: {message}
          {alternative && (
            <Text style={{ fontFamily: theme.foundations.fonts.families.regular }}>
              {'\n'}Use {alternative} instead.
            </Text>
          )}
        </Text>
        {children}
      </View>
    );
  }

  return <>{children}</>;
};

export default Deprecated;


