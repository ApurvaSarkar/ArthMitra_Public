import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Icon } from '@rneui/themed';

interface ChatMenuProps {
  visible: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

const ChatMenu: React.FC<ChatMenuProps> = ({ visible, onClose, onNewChat }) => {
  // Animation value for fade-in effect
  const [fadeAnim] = React.useState(new Animated.Value(0));
  
  // Run animation when visibility changes
  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[styles.menuContainer, { opacity: fadeAnim }]}
        >
          <View style={styles.menu}>
            <Text style={styles.title}>Chat with Mitra Saathi</Text>
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={onNewChat}
            >
              <Icon 
                name="message-text-outline" 
                type="material-community" 
                color="#9c6df2" 
                size={24} 
              />
              <Text style={styles.menuItemText}>New Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Icon 
                name="close" 
                type="material-community" 
                color="#aaa" 
                size={24} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    maxWidth: 300,
  },
  menu: {
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
});

export default ChatMenu;