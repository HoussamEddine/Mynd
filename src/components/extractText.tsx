import React from 'react';

export const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string') {
    return node;
  }

  if (typeof node === 'number') {
    return node.toString();
  }

  if (node === null || node === undefined) {
    return '';
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }

  if (React.isValidElement(node)) {
    const { children, ...props } = node.props;
    
    // Handle special cases for common components
    if (node.type === 'input' || node.type === 'textarea') {
      return props.value || props.defaultValue || '';
    }

    if (node.type === 'img') {
      return props.alt || '';
    }

    if (node.type === 'button') {
      return extractText(children) || props.title || '';
    }

    if (node.type === 'a') {
      return extractText(children) || props.title || '';
    }

    // Recursively extract text from children
    if (children) {
      return extractText(children);
    }

    return '';
  }

  return '';
};

export const extractTextFromComponent = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P
): string => {
  try {
    const element = React.createElement(Component, props);
    return extractText(element);
  } catch (error) {
    console.warn('Failed to extract text from component:', error);
    return '';
  }
};

export const extractTextFromJSX = (jsx: JSX.Element): string => {
  return extractText(jsx);
};

export const extractTextFromString = (text: string): string => {
  return text;
};

export const extractTextFromNumber = (num: number): string => {
  return num.toString();
};

export const extractTextFromArray = (arr: React.ReactNode[]): string => {
  return arr.map(extractText).join('');
};

export const extractTextFromObject = (obj: Record<string, any>): string => {
  if (obj && typeof obj === 'object') {
    // Try to extract text from common text properties
    const textProps = ['text', 'title', 'label', 'content', 'description', 'message', 'value'];
    
    for (const prop of textProps) {
      if (obj[prop] && typeof obj[prop] === 'string') {
        return obj[prop];
      }
    }

    // Recursively search through object properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const text = extractText(obj[key]);
        if (text) {
          return text;
        }
      }
    }
  }
  
  return '';
};

export default extractText;


