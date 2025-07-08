import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder, Dimensions } from 'react-native';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import ChatMenu from './ChatMenu';
import ChatWindow from './ChatWindow';

interface FloatingButtonProps {
  onPress?: () => void;
  initialPosition?: { x: number; y: number };
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ 
  onPress = () => {}, 
  initialPosition = { x: 20, y: 20 } 
}) => {
  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulsing animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  // State for chat menu and window visibility
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  // Get screen dimensions
  const { width, height } = Dimensions.get('window');
  
  // Create animated values for position
  const pan = useState(new Animated.ValueXY(initialPosition))[0];
  
  // Track current position for calculations
  const [currentPosition, setCurrentPosition] = useState(initialPosition);
  
  // Update dimensions when screen size changes
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', () => {
      const newWidth = Dimensions.get('window').width;
      const newHeight = Dimensions.get('window').height;
      
      // Ensure button stays within new screen bounds
      const boundedX = Math.max(0, Math.min(newWidth - 60, currentPosition.x));
      const boundedY = Math.max(0, Math.min(newHeight - 60, currentPosition.y));
      
      if (boundedX !== currentPosition.x || boundedY !== currentPosition.y) {
        setCurrentPosition({ x: boundedX, y: boundedY });
        pan.setValue({ x: boundedX, y: boundedY });
        savePosition({ x: boundedX, y: boundedY });
      }
    });
    
    return () => {
      // Clean up event listener on unmount
      dimensionsHandler.remove();
    };
  }, [currentPosition]);
  
  // Load saved position from storage if available
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem('@ArthMitra:floatingButtonPosition');
        if (savedPosition) {
          const position = JSON.parse(savedPosition);
          pan.setValue(position);
          setCurrentPosition(position);
        }
      } catch (error) {
        console.error('Error loading button position', error);
      }
    };
    
    loadPosition();
  }, []);
  
  // Save position when it changes
  const savePosition = async (position: { x: number; y: number }) => {
    try {
      await AsyncStorage.setItem('@ArthMitra:floatingButtonPosition', JSON.stringify(position));
    } catch (error) {
      console.error('Error saving button position', error);
    }
  };
  
  // Create pan responder for drag gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to move if it's a significant movement (prevents interference with taps)
      return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
    },
    onPanResponderGrant: () => {
      // Store the current position when the drag starts
      pan.setOffset({
        x: currentPosition.x,
        y: currentPosition.y
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x, dy: pan.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: () => {
      // When released, flatten the offset into the value
      pan.flattenOffset();
      
      // Get current values safely
      const currentX = Number(JSON.stringify(pan.x));
      const currentY = Number(JSON.stringify(pan.y));
      
      // Ensure the button stays within screen bounds
      const newX = Math.max(0, Math.min(width - 60, currentX));
      const newY = Math.max(0, Math.min(height - 60, currentY));
      
      // Update position if needed to stay in bounds
      if (newX !== currentX || newY !== currentY) {
        Animated.spring(pan, {
          toValue: { x: newX, y: newY },
          useNativeDriver: false,
        }).start();
      }
      
      // Update current position state
      setCurrentPosition({ x: newX, y: newY });
      
      // Save the new position
      savePosition({ x: newX, y: newY });
    },
  });
  
  // Handle button press to show chat menu
  const handleButtonPress = () => {
    setShowChatMenu(true);
  };
  
  // Handle new chat selection
  const handleNewChat = () => {
    setShowChatMenu(false);
    setShowChatWindow(true);
  };
  
  // Handle closing chat menu
  const handleCloseMenu = () => {
    setShowChatMenu(false);
  };
  
  // Handle closing chat window
  const handleCloseChat = () => {
    setShowChatWindow(false);
  };
  
  return (
    <>
      <Animated.View
        style={[styles.container, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
        {...panResponder.panHandlers}
      >
        <Animated.View style={{
          transform: [{ scale: pulseAnim }],
          borderRadius: 30,
          overflow: 'hidden',
        }}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleButtonPress}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            delayPressIn={0}
            pressRetentionOffset={{ top: 20, left: 20, bottom: 20, right: 20 }}
          >
            <LinearGradient
              colors={['#9c6df2', '#6a3de8', '#4361ee']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon
                name="robot"
                type="material-community"
                color="#FFFFFF"
                size={26}
                style={styles.icon}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      
      {/* Chat Menu Popup */}
      <ChatMenu 
        visible={showChatMenu} 
        onClose={handleCloseMenu} 
        onNewChat={handleNewChat} 
      />
      
      {/* Chat Window */}
      <ChatWindow 
        visible={showChatWindow} 
        onClose={handleCloseChat} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default FloatingButton;