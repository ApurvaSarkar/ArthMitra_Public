import { useState, useEffect } from 'react'
import { StyleSheet, View, Image, Alert, Text, Pressable } from 'react-native'
import { downloadAvatar, uploadAvatar } from '../lib/AvatarService'

interface Props {
  size: number
  url: string | null
  onUpload: (filePath: string) => void
}

export default function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarSize = { height: size, width: size }

  useEffect(() => {
    if (url) downloadImage(url)
  }, [url])

  async function downloadImage(path: string) {
    const { data, error } = await downloadAvatar(path)
    
    if (error) {
      console.log('Error downloading image: ', error)
      return
    }
    
    if (data) {
      const fr = new FileReader()
      fr.readAsDataURL(data)
      fr.onload = () => {
        setAvatarUrl(fr.result as string)
      }
    }
  }

  async function handleAvatarUpload() {
    try {
      setUploading(true)
      
      const { path, error } = await uploadAvatar()
      
      if (error) {
        Alert.alert('Upload failed', error.message || 'An error occurred during upload')
        return
      }
      
      if (path) {
        // Successfully uploaded avatar, notify parent component
        onUpload(path)
      }
    } catch (error) {
      // Handle any unexpected errors not caught by uploadAvatar
      if (error instanceof Error) {
        Alert.alert('Unexpected error', error.message)
      } else {
        Alert.alert('Unexpected error', 'An unknown error occurred')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <View>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.avatar, styles.image]}
        />
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage]} />
      )}
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleAvatarUpload}
          disabled={uploading}
          style={styles.uploadButton}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>{uploading ? 'Uploading ...' : 'Upload'}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 5,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(200, 200, 200)',
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 8,
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#4361ee',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
})