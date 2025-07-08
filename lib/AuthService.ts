import { Alert, Platform } from 'react-native'
import { supabase } from './supabase'
import { Session } from '@supabase/supabase-js'
import { router } from 'expo-router'
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession(); // required for web only
const redirectTo = makeRedirectUri({
  scheme: 'arthmitra',
  path: 'login-callback'
});
console.log('Redirect URL:', redirectTo);

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    console.error('Error parsing URL params:', errorCode);
    throw new Error(errorCode);
  }

  console.log('URL params:', params);

  if (params.error) {
    console.error('OAuth error in URL params:', params.error_description || params.error);
    throw new Error(params.error_description || params.error);
  }

  const code = params.code;

  if (!code) {
    // Fallback for non-PKCE flow or if access_token is directly in URL (less common for mobile)
    const { access_token, refresh_token } = params;
    if (access_token) {
      console.log('Found access_token in URL, setting session directly.');
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sessionError) {
        console.error('Error setting session with tokens:', sessionError);
        throw sessionError;
      }
      console.log('Session set directly with tokens:', data.session ? 'Success' : 'Failed');
      return data.session;
    }
    console.error('No authorization code or access_token found in URL params');
    throw new Error('No authorization code or access_token found in callback URL.');
  }

  console.log('Authorization code found:', code);
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError);
    throw exchangeError;
  }

  console.log('Session exchanged successfully:', data.session ? 'Success' : 'Failed');
  return data.session;
};

// Types for profile data
export interface Profile {
  username: string
  website: string
  avatar_url: string
}

export interface ProfileUpdateParams {
  username: string
  website: string
  avatar_url: string
}

// Authentication functions
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) Alert.alert(error.message)
    return { error }
  } catch (error) {
    if (error instanceof Error) {
      Alert.alert(error.message)
    }
    return { error }
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) Alert.alert(error.message)
    if (!session) Alert.alert('Please check your inbox for email verification!')
    return { session, error }
  } catch (error) {
    if (error instanceof Error) {
      Alert.alert(error.message)
    }
    return { session: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    
    // Redirect to welcome page after sign out
    router.replace('/welcome')
    
    return { error }
  } catch (error) {
    if (error instanceof Error) {
      Alert.alert(error.message)
    }
    return { error }
  }
}

// Profile management functions
export const getProfile = async (session: Session | null) => {
  try {
    if (!session?.user) throw new Error('No user on the session!')

    const { data, error, status } = await supabase
      .from('profiles')
      .select(`username, website, avatar_url`)
      .eq('id', session?.user.id)
      .single()

    if (error && status !== 406) {
      throw error
    }

    return { data, error }
  } catch (error) {
    if (error instanceof Error) {
      Alert.alert(error.message)
    }
    return { data: null, error }
  }
}

export const updateProfile = async (session: Session | null, updates: ProfileUpdateParams) => {
  try {
    if (!session?.user) throw new Error('No user on the session!')

    const profileData = {
      id: session?.user.id,
      ...updates,
      updated_at: new Date(),
    }

    const { error } = await supabase.from('profiles').upsert(profileData)

    if (error) {
      throw error
    }

    return { error: null }
  } catch (error) {
    if (error instanceof Error) {
      Alert.alert(error.message)
    }
    return { error }
  }
}

// Session management
export const setupAutoRefresh = () => {
  // This function sets up the auto refresh for the session
  // It should be called once when the app starts
  const handleAppStateChange = (state: string) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  }
  
  return handleAppStateChange
}

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in process');
    console.log('Redirect URL:', redirectTo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error('OAuth initiation error:', error);
      throw error;
    }

    if (!data?.url) {
      console.error('No OAuth URL returned from Supabase');
      throw new Error('No OAuth URL returned');
    }

    console.log('Opening OAuth URL:', data.url);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
      {
        showInRecents: true,
        createTask: Platform.OS === 'android'
      }
    );
    
    console.log('WebBrowser result:', result);

    if (result.type === 'success' && result.url) {
      console.log('OAuth callback URL received:', result.url);
      try {
        const session = await createSessionFromUrl(result.url);
        if (session) {
          console.log('Session created successfully, redirecting to home');
          router.replace('/home');
          return { error: null };
        } else {
          console.error('Failed to create session from URL');
          throw new Error('Failed to create session');
        }
      } catch (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }
    } else if (result.type === 'cancel') {
      console.log('User cancelled OAuth flow');
      return { error: new Error('Sign-in cancelled') };
    } else {
      console.error('OAuth flow failed:', result);
      throw new Error('OAuth authentication failed');
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    if (error instanceof Error) {
      Alert.alert('Sign-in Error', error.message);
    }
    return { error };
  }
}