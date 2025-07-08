import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, View, Alert, Text, ScrollView, Image, TouchableOpacity, Animated, Easing } from 'react-native'
import { Button, Input, Icon } from '@rneui/themed'
import { Session } from '@supabase/supabase-js'
import Avatar from './Avatar'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import * as AuthService from '../lib/AuthService'
import { router } from 'expo-router'

export default function ProfileSettings({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    if (session) getProfile()
    
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic)
      })
    ]).start()
  }, [session])

  async function getProfile() {
    try {
      setLoading(true)
      const { data, error } = await AuthService.getProfile(session)
      
      if (error) {
        throw error
      }

      if (data) {
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string
    website: string
    avatar_url: string
  }) {
    try {
      setLoading(true)
      const { error } = await AuthService.updateProfile(session, {
        username,
        website,
        avatar_url
      })

      if (error) {
        throw error
      }
      Alert.alert('Success', 'Profile updated successfully')
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // Button press animation
  const createButtonAnimation = () => {
    const buttonScale = new Animated.Value(1)
    
    const onPressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start()
    }
    
    const onPressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start()
    }
    
    return { buttonScale, onPressIn, onPressOut }
  }
  
  // Create button animations
  const updateButtonAnim = createButtonAnimation()
  const signOutButtonAnim = createButtonAnimation()

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.avatarContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <Avatar
          size={100}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url)
            updateProfile({ username, website, avatar_url: url })
          }}
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.inputContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.inputLabel}>Email</Text>
        <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
          <Input
            value={session?.user?.email}
            disabled
            inputContainerStyle={styles.inputField}
            inputStyle={styles.inputText}
            containerStyle={styles.inputWrapper}
            disabledInputStyle={styles.disabledInput}
            leftIcon={<Icon name="email" type="material" color="rgba(255,255,255,0.5)" size={20} />}
          />
        </BlurView>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.inputLabel}>Username</Text>
        <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
          <Input
            value={username || ''}
            onChangeText={(text) => setUsername(text)}
            inputContainerStyle={styles.inputField}
            inputStyle={styles.inputText}
            containerStyle={styles.inputWrapper}
            leftIcon={<Icon name="person" type="material" color="rgba(255,255,255,0.5)" size={20} />}
          />
        </BlurView>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.inputContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.inputLabel}>Website</Text>
        <BlurView intensity={10} tint="dark" style={styles.inputBlur}>
          <Input
            value={website || ''}
            onChangeText={(text) => setWebsite(text)}
            inputContainerStyle={styles.inputField}
            inputStyle={styles.inputText}
            containerStyle={styles.inputWrapper}
            leftIcon={<Icon name="language" type="material" color="rgba(255,255,255,0.5)" size={20} />}
          />
        </BlurView>
      </Animated.View>

      <Animated.View 
        style={[
          styles.buttonContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <TouchableOpacity
          onPressIn={updateButtonAnim.onPressIn}
          onPressOut={updateButtonAnim.onPressOut}
          style={styles.buttonWrapper}
        >
          <Animated.View style={{ transform: [{ scale: updateButtonAnim.buttonScale }] }}>
            <LinearGradient
              colors={['#4361ee', '#3a56d4', '#314bc0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Button
                title={loading ? 'Updating...' : 'Update Profile'}
                onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
                disabled={loading}
                buttonStyle={styles.updateButton}
                titleStyle={styles.buttonTitle}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: ['transparent', 'transparent'],
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 1 }
                }}
              />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Logout Button */}
      <Animated.View 
        style={[
          styles.buttonContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginTop: 15 }
        ]}
      >
        <TouchableOpacity
          onPressIn={signOutButtonAnim.onPressIn}
          onPressOut={signOutButtonAnim.onPressOut}
          style={styles.buttonWrapper}
        >
          <Animated.View style={{ transform: [{ scale: signOutButtonAnim.buttonScale }] }}>
            <LinearGradient
              colors={['#f72585', '#e5267e', '#d31e77']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Button
                title="Logout"
                onPress={async () => {
                  const { error } = await AuthService.signOut();
                  if (!error) {
                    // Navigate to welcome page after successful logout
                    router.replace('/welcome');
                  }
                }}
                buttonStyle={styles.logoutButton}
                titleStyle={styles.buttonTitle}
                icon={<Icon name="logout" type="material" color="#ffffff" size={20} style={{ marginRight: 10 }} />}
                ViewComponent={LinearGradient}
                linearGradientProps={{
                  colors: ['transparent', 'transparent'],
                  start: { x: 0, y: 0 },
                  end: { x: 1, y: 1 }
                }}
              />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#ffffff',
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  inputBlur: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputField: {
    borderBottomWidth: 0,
  },
  inputText: {
    color: '#ffffff',
    fontSize: 14,
  },
  inputWrapper: {
    paddingHorizontal: 0,
  },
  disabledInput: {
    color: 'rgba(255, 255, 255, 0.5)',
    opacity: 0.7,
  },
  buttonContainer: {
    marginTop: 10,
  },
  buttonWrapper: {
    width: '100%',
  },
  buttonGradient: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  updateButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  buttonTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
})