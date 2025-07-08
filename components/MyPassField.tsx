import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Input, Icon } from '@rneui/themed';
import InputStyles from '../lib/InputStyles';

interface MyPassFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  showForgotPassword?: boolean;
  onForgotPasswordPress?: () => void;
  required?: boolean;
}

const MyPassField = ({
  label,
  placeholder,
  value,
  onChangeText,
  showForgotPassword = false,
  onForgotPasswordPress,
  required = false,
}: MyPassFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={InputStyles.verticallySpaced}>
      <Text style={InputStyles.inputLabel}>{label}{required ? '*' : ''}</Text>
      <Input
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        secureTextEntry={!showPassword}
        autoCapitalize={'none'}
        inputContainerStyle={InputStyles.inputContainer}
        inputStyle={InputStyles.input}
        containerStyle={InputStyles.inputWrapper}
        leftIcon={<Icon name="lock" type="material" color="rgba(255,255,255,0.7)" size={20} />}
        rightIcon={
          <Icon 
            name={showPassword ? "visibility" : "visibility-off"} 
            type="material" 
            color="rgba(255,255,255,0.7)" 
            size={20} 
            onPress={() => setShowPassword(!showPassword)} 
          />
        }
      />
      {showForgotPassword && (
        <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPasswordPress}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Specific styles for MyPassField
const styles = StyleSheet.create({
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -5,
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#4361ee',
    fontSize: 14,
  },
});

export default MyPassField;