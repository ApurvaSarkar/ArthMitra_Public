import { Alert, Platform } from 'react-native'
import { supabase } from './supabase'
import * as ImagePicker from 'expo-image-picker'

// Avatar management functions
export const downloadAvatar = async (path: string) => {
  try {
    // Validate path parameter
    if (!path || typeof path !== 'string') {
      console.error('Invalid avatar path provided:', path)
      return { data: null, error: new Error('Invalid avatar path') }
    }
    
    // Check if the path is an external URL
    if (path.startsWith('http')) {
      // For external URLs, fetch directly
      const response = await fetch(path)
      if (!response.ok) {
        throw new Error(`Failed to fetch external avatar: ${response.statusText}`)
      }
      const data = await response.blob()
      return { data, error: null }
    }
    
    // Download from Supabase storage for local paths
    const { data, error } = await supabase.storage.from('avatars').download(path)

    if (error) {
      console.error('Supabase download error:', error)
      throw error
    }
    return { data, error: null }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error downloading avatar:', error.message)
    } else {
      console.error('Unknown error downloading avatar')
    }
    return { data: null, error }
  }
}

export const uploadAvatar = async () => {
  try {
    // Request permission if needed (for older iOS versions)
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      return { 
        path: null, 
        error: new Error('Permission to access media library is required') 
      }
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Restrict to only images
      allowsMultipleSelection: false, // Can only select one image
      allowsEditing: true, // Allows the user to crop / rotate their photo before uploading it
      quality: 0.8, // Slightly reduced quality for better performance
      exif: false, // We don't want nor need that data.
      aspect: [1, 1], // Square aspect ratio for avatar
    })

    if (result.canceled || !result.assets || result.assets.length === 0) {
      console.log('User cancelled image picker.')
      return { path: null, error: null }
    }

    const image = result.assets[0]
    
    if (!image.uri) {
      throw new Error('No image URI available')
    }

    // Handle image data differently based on platform
    let fileData;
    let contentType = image.mimeType ?? 'image/jpeg';
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      // For web, we need to handle the file differently
      // The URI on web is already a blob URL, so we need to fetch it and get the blob
      const response = await fetch(image.uri);
      fileData = await response.blob();
      // On web, the mimeType might not be correctly set, so we ensure it's set from the blob
      contentType = fileData.type || contentType;
    } else {
      // For mobile platforms, convert image to array buffer for upload
      fileData = await fetch(image.uri).then((res) => res.arrayBuffer());
    }

    // Generate unique filename with timestamp
    const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg'
    const path = `${Date.now()}.${fileExt}`
    
    // Upload to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, fileData, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    console.log('Avatar uploaded successfully:', data.path)
    return { path: data.path, error: null }
  } catch (error) {
    console.error('Avatar upload failed:', error)
    return { 
      path: null, 
      error: error instanceof Error ? error : new Error('Unknown error during avatar upload') 
    }
  }
}