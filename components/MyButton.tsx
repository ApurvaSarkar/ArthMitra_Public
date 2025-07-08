import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View, Text } from 'react-native';
import { Icon } from '@rneui/themed';
import TextStyles, { TEXT_COLORS, FONT_SIZES, FONT_WEIGHTS } from '../lib/TextStyles';

interface MyButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'primary' | 'secondary' | 'google' | 'link';
  icon?: {
    name: string;
    type?: string;
    color?: string;
    size?: number;
  };
  style?: object;
  titleStyle?: object;
}

const MyButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  type = 'primary',
  icon,
  style,
  titleStyle,
}: MyButtonProps) => {
  // Determine button and text styles based on type
  const getButtonStyle = () => {
    switch (type) {
      case 'secondary':
        return styles.secondaryButton;
      case 'google':
        return styles.googleButton;
      case 'link':
        return styles.linkButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case 'secondary':
        return TextStyles.secondaryButtonText;
      case 'google':
        return {...TextStyles.buttonText, color: TEXT_COLORS.BLACK};
      case 'link':
        return TextStyles.primaryLink;
      case 'primary':
      default:
        return TextStyles.primaryButtonText;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), disabled && styles.disabledButton, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={type === 'google' ? TEXT_COLORS.BLACK : TEXT_COLORS.WHITE} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Icon
              name={icon.name}
              type={icon.type || 'material'}
              color={icon.color || (type === 'google' ? TEXT_COLORS.BLACK : TEXT_COLORS.WHITE)}
              size={icon.size || 16}
              style={styles.buttonIcon}
            />
          )}
          <Text style={[getTextStyle(), titleStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#4361ee',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.5)',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4361ee',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
  },
  linkButton: {
    backgroundColor: 'transparent',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default MyButton;