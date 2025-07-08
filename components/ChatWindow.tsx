import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Keyboard,
  ActivityIndicator,
  Image
} from 'react-native';
import { Icon } from '@rneui/themed';
import { queryGeminiWithFinancialContext, setGeminiApiKey } from '../lib/GeminiService';
import { supabase } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { downloadAvatar } from '../lib/AvatarService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  username?: string;
}

interface ChatWindowProps {
  visible: boolean;
  onClose: () => void;
  selectedCategories?: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ visible, onClose, selectedCategories = [] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [username, setUsername] = useState<string>('User');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  
  // Shimmer animation for messages
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Get user profile information
  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (data) {
          if (data.username) {
            setUsername(data.username);
          }
          
          if (data.avatar_url) {
            try {
              const { data: fileData } = await downloadAvatar(data.avatar_url);
              if (fileData) {
                const fr = new FileReader();
                fr.readAsDataURL(fileData);
                fr.onload = () => {
                  setUserAvatarUrl(fr.result as string);
                };
              }
            } catch (error) {
              console.error('Error downloading avatar:', error);
            }
          }
        }
      }
    };
    
    getUserProfile();
  }, []);
  
  // Run animation when visibility changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Add welcome message when chat opens
      if (messages.length === 0) {
        setMessages([
          {
            id: '1',
            text: `👋 Hello ${username}! I'm Mitra, your personal financial assistant. 💰 How can I help you with your finances today? 📊`,
            isUser: false,
            timestamp: new Date(),
            username: 'Mitra'
          }
        ]);
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);
  
  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (inputText.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
      username: username
    };
    
    const userQuery = inputText.trim();
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Get response from Gemini API with financial context
      const response = await queryGeminiWithFinancialContext(userQuery);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        username: 'Mitra'
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ I'm having trouble connecting right now. Please try again later. 🔄",
        isUser: false,
        timestamp: new Date(),
        username: 'Mitra'
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // State for tracking loading state during API calls
  const [isLoading, setIsLoading] = useState(false);
  
  // Set your Gemini API key here - in a production app, this would be stored securely
  useEffect(() => {
    // This is just a placeholder. The actual API key should be provided by the user
    // and stored securely, not hardcoded in the app
    // setGeminiApiKey('YOUR_GEMINI_API_KEY');
  }, []);
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.chatContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          {/* Chat Header */}
          <LinearGradient
            colors={['#6a11cb', '#2575fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Image 
                source={require('../assets/images/bot-avatar.png')} 
                style={styles.headerAvatar}
              />
              <Text style={styles.headerTitle}>Mitra Saathi</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" type="material-community" color="#fff" size={24} />
            </TouchableOpacity>
          </LinearGradient>
          
          {/* Chat Messages */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.chatContent}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((message) => (
                <View key={message.id} style={styles.messageRow}>
                  {!message.isUser && (
                    <Image 
                      source={require('../assets/images/bot-avatar.png')} 
                      style={styles.avatar}
                    />
                  )}
                  
                  <View style={styles.messageContent}>
                    <Text style={[styles.senderName, message.isUser ? styles.userSenderName : styles.botSenderName]}>
                      {message.username || (message.isUser ? username : 'Mitra')}
                    </Text>
                    
                    <Animated.View 
                      style={[
                        styles.messageBubble,
                        message.isUser ? styles.userBubble : styles.aiBubble,
                        message.isUser ? null : {
                          borderColor: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['#444', '#6a11cb']
                          })
                        }
                      ]}
                    >
                      <Text style={styles.messageText}>{message.text}</Text>
                      <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
                    </Animated.View>
                  </View>
                  
                  {message.isUser && (
                    <Image 
                      source={userAvatarUrl ? { uri: userAvatarUrl } : require('../assets/images/user-avatar.png')} 
                      style={styles.avatar}
                    />
                  )}
                </View>
              ))}
            </ScrollView>
            
            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#aaa"
                multiline
                maxLength={500}
                editable={!isLoading}
              />
              {isLoading ? (
                <View style={styles.loadingButton}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
                  onPress={handleSend}
                  disabled={!inputText.trim()}
                >
                  <Icon name="send" type="material-community" color={inputText.trim() ? '#fff' : '#ccc'} size={20} />
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    width: '90%',
    height: '80%',
    maxWidth: 400,
    maxHeight: 600,
    backgroundColor: '#121212',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#121212',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#121212',
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  messageContent: {
    flex: 1,
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  userSenderName: {
    color: '#9c6df2',
    textAlign: 'right',
  },
  botSenderName: {
    color: '#2575fc',
  },
  messageBubble: {
    maxWidth: '100%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(156, 109, 242, 0.8)',
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: '#9c6df2',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#444',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  sendButton: {
    backgroundColor: '#6a11cb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#444',
  },
  loadingButton: {
    backgroundColor: '#6a11cb',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default ChatWindow;