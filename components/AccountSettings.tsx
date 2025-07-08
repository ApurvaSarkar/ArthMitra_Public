import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Alert, Text, ScrollView, TouchableOpacity, Animated, Easing, Platform, Pressable, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, Input, Icon } from '@rneui/themed';
import { Session } from '@supabase/supabase-js';
import Avatar from './Avatar';
import { useScreenDimensions } from '../lib/useScreenDimensions';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as AuthService from '../lib/AuthService';

export default function AccountSettings({ session }: { session: Session }) {
  const { isDesktop } = useScreenDimensions();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (session) getProfile();
    // No animation start code here
  }, [session]);
  


  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await AuthService.getProfile(session);
      
      if (error) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      const { error } = await AuthService.updateProfile(session, {
        username,
        website,
        avatar_url
      });

      if (error) {
        throw error;
      }
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // Button press animation
  const createButtonAnimation = () => {
    const buttonScale = new Animated.Value(1);
    
    const onPressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };
    
    const onPressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    return { buttonScale, onPressIn, onPressOut };
  };
  
  // Create button animations
  const updateButtonAnim = createButtonAnimation();
  const signOutButtonAnim = createButtonAnimation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      

      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        <Text style={styles.cardTitle}>Account</Text>
        
        <View style={styles.profileSection}>
          <Avatar
            size={80}
            url={avatarUrl}
            onUpload={(url: string) => {
              setAvatarUrl(url);
              updateProfile({ username, website, avatar_url: url });
            }}
          />
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{username || 'User'}</Text>
            <Text style={styles.profileEmail}>{session?.user?.email}</Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Username</Text>
          <Input
            value={username || ''}
            onChangeText={(text) => setUsername(text)}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.input}
            containerStyle={styles.inputWrapper}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <Input
            value={website || ''}
            onChangeText={(text) => setWebsite(text)}
            inputContainerStyle={styles.inputContainer}
            inputStyle={styles.input}
            containerStyle={styles.inputWrapper}
            keyboardType="phone-pad"
            leftIcon={<Icon name="phone" type="material" color="#4361ee" size={18} style={{marginRight: 10}} />}
          />
        </View>
        

        
        <Pressable
          onPressIn={updateButtonAnim.onPressIn}
          onPressOut={updateButtonAnim.onPressOut}
          style={styles.buttonContainer}
        >
          <Animated.View style={{ transform: [{ scale: updateButtonAnim.buttonScale }], width: '100%' }}>
            <Button
              title={loading ? 'Saving...' : 'Save Changes'}
              onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
              disabled={loading}
              buttonStyle={styles.button}
              titleStyle={styles.buttonTitle}
            />
          </Animated.View>
        </Pressable>
        
        <Pressable
          onPressIn={signOutButtonAnim.onPressIn}
          onPressOut={signOutButtonAnim.onPressOut}
          style={[styles.buttonContainer, styles.logoutButtonContainer]}
        >
          <Animated.View style={{ transform: [{ scale: signOutButtonAnim.buttonScale }], width: '100%' }}>
            <Button
              title="Sign Out"
              onPress={() => AuthService.signOut()}
              buttonStyle={styles.logoutButton}
              titleStyle={styles.logoutButtonTitle}
              icon={<Icon name="logout" type="material" color="#4361ee" size={18} style={styles.logoutIcon} />}
              iconPosition="left"
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
    marginTop: 80, // Add significant top margin to move the component down
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    backdropFilter: 'blur(8px)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textShadowColor: 'rgba(245, 158, 11, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  toggleContainer: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#e0e0ff',
  },
  toggleSwitch: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  toggleSwitchActive: {
    alignItems: 'flex-end',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#bdbdbd',
  },
  toggleKnobActive: {
    backgroundColor: '#4361ee',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 0.5,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textShadowColor: 'rgba(67, 97, 238, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 2,
    flexWrap: 'nowrap',
    width: '100%',
    overflow: 'hidden',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginLeft: 10,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapper: {
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 8,
    height: 50,
  },
  input: {
    fontSize: 16,
    color: '#ffffff',
    paddingHorizontal: 12,
  },
  buttonContainer: {
    marginTop: 8,
    width: '100%',
  },
  button: {
    backgroundColor: '#9c6df2',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.4)',
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButtonContainer: {
    marginTop: 12,
  },
  logoutButton: {
    backgroundColor: '#333333',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#444444',
  },
  logoutButtonTitle: {
    color: '#4361ee',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    backdropFilter: 'blur(8px)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  currencyOptionSelected: {
    backgroundColor: 'rgba(67, 97, 238, 0.2)',
    borderWidth: 1,
    borderColor: '#4361ee',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
  },
  currencyName: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#444444',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backdropFilter: 'blur(8px)',
  },
  currencySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
  },
  currencyLabel: {
    fontSize: 16,
    color: '#cccccc',
  },
});