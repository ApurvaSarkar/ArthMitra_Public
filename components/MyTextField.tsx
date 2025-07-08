import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Input, Icon } from '@rneui/themed';
import InputStyles from '../lib/InputStyles';

interface MyTextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  iconName?: string;
  iconType?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
  required?: boolean;
}

const MyTextField = ({
  label,
  placeholder,
  value,
  onChangeText,
  iconName = 'email',
  iconType = 'material',
  autoCapitalize = 'none',
  keyboardType = 'default',
  required = false,
}: MyTextFieldProps) => {
  return (
    <View style={InputStyles.verticallySpaced}>
      <Text style={InputStyles.inputLabel}>{label}{required ? '*' : ''}</Text>
      <Input
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        inputContainerStyle={InputStyles.inputContainer}
        inputStyle={InputStyles.input}
        containerStyle={InputStyles.inputWrapper}
        leftIcon={<Icon name={iconName} type={iconType} color="rgba(255,255,255,0.7)" size={20} />}
      />
    </View>
  );
};

export default MyTextField;