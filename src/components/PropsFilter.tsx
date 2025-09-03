import React from 'react';

export interface PropsFilterOptions {
  exclude?: string[];
  include?: string[];
  transform?: Record<string, (value: any) => any>;
}

export const usePropsFilter = () => {
  const filterProps = React.useCallback((
    props: Record<string, any>,
    options: PropsFilterOptions = {}
  ): Record<string, any> => {
    const { exclude = [], include = [], transform = {} } = options;
    
    let filteredProps = { ...props };

    // Apply include filter
    if (include.length > 0) {
      filteredProps = Object.keys(filteredProps)
        .filter(key => include.includes(key))
        .reduce((obj, key) => {
          obj[key] = filteredProps[key];
          return obj;
        }, {} as Record<string, any>);
    }

    // Apply exclude filter
    if (exclude.length > 0) {
      filteredProps = Object.keys(filteredProps)
        .filter(key => !exclude.includes(key))
        .reduce((obj, key) => {
          obj[key] = filteredProps[key];
          return obj;
        }, {} as Record<string, any>);
    }

    // Apply transformations
    Object.keys(transform).forEach(key => {
      if (filteredProps[key] !== undefined) {
        filteredProps[key] = transform[key](filteredProps[key]);
      }
    });

    return filteredProps;
  }, []);

  const filterStyleProps = React.useCallback((
    props: Record<string, any>
  ): Record<string, any> => {
    const styleProps = [
      'style', 'className', 'id', 'width', 'height', 'margin', 'padding',
      'backgroundColor', 'color', 'fontSize', 'fontWeight', 'textAlign',
      'flex', 'flexDirection', 'justifyContent', 'alignItems', 'position',
      'top', 'left', 'right', 'bottom', 'zIndex', 'opacity', 'transform',
      'borderRadius', 'borderWidth', 'borderColor', 'shadowColor',
      'shadowOffset', 'shadowOpacity', 'shadowRadius', 'elevation'
    ];

    return filterProps(props, { include: styleProps });
  }, [filterProps]);

  const filterEventProps = React.useCallback((
    props: Record<string, any>
  ): Record<string, any> => {
    const eventProps = [
      'onPress', 'onPressIn', 'onPressOut', 'onLongPress', 'onFocus',
      'onBlur', 'onChange', 'onChangeText', 'onSubmit', 'onScroll',
      'onLayout', 'onContentSizeChange', 'onMomentumScrollBegin',
      'onMomentumScrollEnd', 'onScrollBeginDrag', 'onScrollEndDrag'
    ];

    return filterProps(props, { include: eventProps });
  }, [filterProps]);

  const filterAccessibilityProps = React.useCallback((
    props: Record<string, any>
  ): Record<string, any> => {
    const accessibilityProps = [
      'accessible', 'accessibilityLabel', 'accessibilityHint',
      'accessibilityRole', 'accessibilityState', 'accessibilityValue',
      'accessibilityActions', 'accessibilityViewIsModal',
      'accessibilityElementsHidden', 'accessibilityLiveRegion'
    ];

    return filterProps(props, { include: accessibilityProps });
  }, [filterProps]);

  return {
    filterProps,
    filterStyleProps,
    filterEventProps,
    filterAccessibilityProps,
  };
};

export const PropsFilter: React.FC<{
  children: React.ReactNode;
  filter: (props: Record<string, any>) => Record<string, any>;
}> = ({ children, filter }) => {
  // This component is primarily for configuration, not rendering
  return <>{children}</>;
};

export default PropsFilter;


