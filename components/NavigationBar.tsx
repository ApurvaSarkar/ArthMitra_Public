import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, View } from 'react-native';
import { Icon } from '@rneui/themed';
import { BlurView } from 'expo-blur';
import { TEXT_COLORS } from '../lib/TextStyles';

interface NavigationBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Define tab colors for each tab
const TAB_COLORS = {
  home: '#9c6df2', // Light Purple
  insights: '#9c6df2', // Light Purple
  settings: '#9c6df2', // Light Purple
  profile: '#9c6df2' // Light Purple
};

const NavigationBar = ({ activeTab, setActiveTab }: NavigationBarProps) => {
  // Function to render a navigation item with animation
  const renderNavItem = (tabName: string, iconName: string) => {
    const isActive = activeTab === tabName;
    const tabColor = TAB_COLORS[tabName as keyof typeof TAB_COLORS];
    
    return (
      <TouchableOpacity 
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => setActiveTab(tabName)}
        activeOpacity={0.7}
      >
        {isActive && (
          <Animated.View 
            style={{
              position: 'absolute',
              top: 0,
              left: '15%',
              right: '15%',
              height: 3,
              borderRadius: 1.5,
              backgroundColor: tabColor,
            }}
          />
        )}
        <Animated.View 
          style={{
            padding: 8,
            borderRadius: 28,
            backgroundColor: isActive ? `${tabColor}15` : 'transparent', // 15 is hex for 8% opacity
            transform: [{ scale: isActive ? 1.1 : 1 }],
          }}
        >
          <Icon 
            name={iconName} 
            type="material" 
            color={isActive ? tabColor : 'rgba(255, 255, 255, 0.7)'} 
            size={24} 
          />
        </Animated.View>
        <Text 
          style={[styles.navText, isActive && { ...styles.navTextActive, color: tabColor }]}
        >
          {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <BlurView intensity={70} tint="dark" style={styles.navBar}>
      <View style={styles.navBarContent}>
        {renderNavItem('home', 'home')}
        {renderNavItem('insights', 'insights')}
        {renderNavItem('settings', 'settings')}
        {renderNavItem('profile', 'person')}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  navBarContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    position: 'relative',
  },
  navItemActive: {
    // Active state styling is handled in the renderNavItem function
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  navTextActive: {
    fontWeight: '600',
  },
});

export default NavigationBar;