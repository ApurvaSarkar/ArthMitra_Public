/**
 * TextStyles.ts
 * 
 * This file serves as a centralized location for all text styles used in the application.
 * By importing styles from this file instead of directly defining them in components,
 * we can easily update typography styles in one place when needed.
 * 
 * The styles are organized by category and can be customized when implemented
 * in specific components by spreading the base style and overriding properties.
 * 
 * USAGE:
 * import TextStyles, { TEXT_COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, TEXT_CONSTRAINTS } from '../lib/TextStyles'
 * 
 * // Use predefined styles directly
 * <Text style={TextStyles.heading1}>Title</Text>
 * 
 * // Customize predefined styles
 * <Text style={{...TextStyles.bodyMedium, color: TEXT_COLORS.PRIMARY}}>Custom text</Text>
 * 
 * // Create custom styles using the parameters
 * const customStyle = {
 *   fontSize: FONT_SIZES.LARGE,
 *   fontWeight: FONT_WEIGHTS.BOLD,
 *   color: TEXT_COLORS.PRIMARY,
 *   marginBottom: SPACING.MEDIUM
 * }
 */

import { StyleSheet, TextStyle, Platform, Dimensions } from 'react-native';

// Get screen dimensions for responsive constraints
const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

// Color palette for text
export const TEXT_COLORS = {
  PRIMARY: '#4361ee',
  SECONDARY: '#6c757d',
  ACCENT: '#f72585',
  WHITE: '#ffffff',
  BLACK: '#000000',
  LIGHT_GRAY: 'rgba(255, 255, 255, 0.6)',
  MEDIUM_GRAY: 'rgba(255, 255, 255, 0.8)',
  DARK_GRAY: 'rgba(0, 0, 0, 0.8)',
  ERROR: '#dc2626',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
};

// Font sizes - responsive based on device size
export const FONT_SIZES = {
  XS: isSmallDevice ? 10 : 12,
  SMALL: isSmallDevice ? 12 : 14,
  MEDIUM: isSmallDevice ? 14 : 16,
  LARGE: isSmallDevice ? 16 : 18,
  XL: isSmallDevice ? 18 : 20,
  XXL: isSmallDevice ? 22 : 24,
  TITLE: isSmallDevice ? 26 : 28,
  HEADER: isSmallDevice ? 30 : 32,
  DISPLAY: isSmallDevice ? 42 : 48,
};

// Font weights
export const FONT_WEIGHTS = {
  NORMAL: 'normal' as TextStyle['fontWeight'],
  MEDIUM: '500' as TextStyle['fontWeight'],
  SEMI_BOLD: '600' as TextStyle['fontWeight'],
  BOLD: 'bold' as TextStyle['fontWeight'],
};

// Spacing constants for consistent layout
export const SPACING = {
  XS: 4,
  SMALL: 8,
  MEDIUM: 16,
  LARGE: 24,
  XL: 32,
  XXL: 48,
};

// Text constraints for limiting text length, line count, etc.
export const TEXT_CONSTRAINTS = {
  MAX_HEADER_LENGTH: 50,
  MAX_TITLE_LENGTH: 100,
  MAX_BODY_LENGTH: 500,
  MAX_LINES_SMALL: 2,
  MAX_LINES_MEDIUM: 3,
  MAX_LINES_LARGE: 5,
  LINE_HEIGHT_MULTIPLIER: 1.5, // Multiply by font size for consistent line height
};

// Platform specific font families
export const FONT_FAMILIES = {
  PRIMARY: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  SECONDARY: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  MONOSPACE: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'Courier',
  }),
};

// Helper function to calculate line height based on font size
const getLineHeight = (fontSize: number): number => {
  return Math.round(fontSize * TEXT_CONSTRAINTS.LINE_HEIGHT_MULTIPLIER);
};

// Base text styles
const baseStyles = StyleSheet.create({
  // Headings
  heading1: {
    fontSize: FONT_SIZES.HEADER,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: TEXT_COLORS.WHITE,
    marginBottom: SPACING.MEDIUM,
    lineHeight: getLineHeight(FONT_SIZES.HEADER),
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  heading2: {
    fontSize: FONT_SIZES.TITLE,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: TEXT_COLORS.WHITE,
    marginBottom: SPACING.MEDIUM,
    lineHeight: getLineHeight(FONT_SIZES.TITLE),
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  heading3: {
    fontSize: FONT_SIZES.XL,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: TEXT_COLORS.WHITE,
    marginBottom: SPACING.SMALL,
    lineHeight: getLineHeight(FONT_SIZES.XL),
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  
  // Body text
  bodyLarge: {
    fontSize: FONT_SIZES.MEDIUM,
    fontWeight: FONT_WEIGHTS.NORMAL,
    color: TEXT_COLORS.WHITE,
    lineHeight: getLineHeight(FONT_SIZES.MEDIUM),
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  bodyMedium: {
    fontSize: FONT_SIZES.SMALL,
    fontWeight: FONT_WEIGHTS.NORMAL,
    color: TEXT_COLORS.WHITE,
    lineHeight: getLineHeight(FONT_SIZES.SMALL),
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  bodySmall: {
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.NORMAL,
    color: TEXT_COLORS.LIGHT_GRAY,
    lineHeight: getLineHeight(FONT_SIZES.XS),
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  
  // Form elements
  label: {
    fontSize: FONT_SIZES.SMALL,
    fontWeight: FONT_WEIGHTS.MEDIUM,
    color: TEXT_COLORS.WHITE,
    marginBottom: SPACING.SMALL,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  input: {
    fontSize: FONT_SIZES.SMALL,
    color: TEXT_COLORS.WHITE,
    marginLeft: SPACING.SMALL + 2,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  
  // Buttons
  buttonText: {
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
    fontSize: FONT_SIZES.MEDIUM,
    color: TEXT_COLORS.WHITE,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  linkText: {
    color: TEXT_COLORS.PRIMARY,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  
  // Utility text styles
  subtitle: {
    fontSize: FONT_SIZES.SMALL,
    color: TEXT_COLORS.LIGHT_GRAY,
    marginBottom: SPACING.MEDIUM,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  error: {
    fontSize: FONT_SIZES.SMALL,
    color: TEXT_COLORS.ERROR,
    marginTop: SPACING.XS,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  success: {
    fontSize: FONT_SIZES.SMALL,
    color: TEXT_COLORS.SUCCESS,
    marginTop: SPACING.XS,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  warning: {
    fontSize: FONT_SIZES.SMALL,
    color: TEXT_COLORS.WARNING,
    marginTop: SPACING.XS,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
  info: {
    fontSize: FONT_SIZES.SMALL,
    color: TEXT_COLORS.INFO,
    marginTop: SPACING.XS,
    fontFamily: FONT_FAMILIES.PRIMARY,
  },
});

// Export all styles
export const TextStyles = {
  ...baseStyles,
  
  // Form specific styles
  formTitle: baseStyles.heading2,
  formSubtitle: baseStyles.subtitle,
  inputLabel: baseStyles.label,
  inputText: baseStyles.input,
  
  // Button specific styles
  primaryButtonText: baseStyles.buttonText,
  secondaryButtonText: {
    ...baseStyles.buttonText,
    color: TEXT_COLORS.PRIMARY,
  },
  tertiaryButtonText: {
    ...baseStyles.buttonText,
    color: TEXT_COLORS.ACCENT,
    fontSize: FONT_SIZES.SMALL,
  },
  
  // Link styles
  primaryLink: baseStyles.linkText,
  secondaryLink: {
    ...baseStyles.linkText,
    fontSize: FONT_SIZES.SMALL,
  },
  
  // Special text styles
  highlightedText: {
    color: TEXT_COLORS.PRIMARY,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
  },
  accentText: {
    color: TEXT_COLORS.ACCENT,
    fontWeight: FONT_WEIGHTS.SEMI_BOLD,
  },
  caption: {
    fontSize: FONT_SIZES.XS,
    color: TEXT_COLORS.MEDIUM_GRAY,
    fontStyle: 'italic',
  },
  badge: {
    fontSize: FONT_SIZES.XS,
    fontWeight: FONT_WEIGHTS.BOLD,
    color: TEXT_COLORS.WHITE,
    backgroundColor: TEXT_COLORS.PRIMARY,
    paddingHorizontal: SPACING.SMALL,
    paddingVertical: SPACING.XS,
    borderRadius: SPACING.SMALL,
    overflow: 'hidden',
    textAlign: 'center',
  },
};

// Helper function to create custom text styles
export const createTextStyle = (options: {
  fontSize?: number,
  fontWeight?: TextStyle['fontWeight'],
  color?: string,
  fontFamily?: string,
  lineHeight?: number,
  textAlign?: TextStyle['textAlign'],
  marginBottom?: number,
  marginTop?: number,
  letterSpacing?: number,
  textTransform?: TextStyle['textTransform'],
}) => {
  return {
    fontSize: options.fontSize || FONT_SIZES.MEDIUM,
    fontWeight: options.fontWeight || FONT_WEIGHTS.NORMAL,
    color: options.color || TEXT_COLORS.WHITE,
    fontFamily: options.fontFamily || FONT_FAMILIES.PRIMARY,
    lineHeight: options.lineHeight || getLineHeight(options.fontSize || FONT_SIZES.MEDIUM),
    textAlign: options.textAlign,
    marginBottom: options.marginBottom,
    marginTop: options.marginTop,
    letterSpacing: options.letterSpacing,
    textTransform: options.textTransform,
  };
};

// Export default for convenience
export default TextStyles;