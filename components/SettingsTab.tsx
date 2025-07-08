import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Modal, FlatList, Alert, Linking } from 'react-native';
import { Icon } from '@rneui/themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsTabProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  themeMode: string;
  updateThemeMode: (mode: 'dark' | 'light' | 'system') => () => void;
}

interface CurrencyOption {
  symbol: string;
  name: string;
}

const SettingsTab = ({ fadeAnim, slideAnim, themeMode, updateThemeMode }: SettingsTabProps) => {
  const [currency, setCurrency] = useState('₹');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  
  // Currency options
  const currencies: CurrencyOption[] = [
    { symbol: '₹', name: 'Indian Rupee (INR)' },
    { symbol: '$', name: 'US Dollar (USD)' },
    { symbol: '€', name: 'Euro (EUR)' },
    { symbol: '£', name: 'British Pound (GBP)' },
    { symbol: '¥', name: 'Japanese Yen (JPY)' },
    { symbol: '₩', name: 'Korean Won (KRW)' },
    { symbol: '₽', name: 'Russian Ruble (RUB)' },
    { symbol: '₿', name: 'Bitcoin (BTC)' },
  ];
  
  // Load saved currency
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const savedCurrency = await AsyncStorage.getItem('@ArthMitra:currency');
        if (savedCurrency) {
          setCurrency(savedCurrency);
        }
      } catch (error) {
        console.error('Error loading currency', error);
      }
    };
    
    loadCurrency();
  }, []);
  
  // Save currency to AsyncStorage
  const saveCurrency = async (newCurrency: string) => {
    try {
      await AsyncStorage.setItem('@ArthMitra:currency', newCurrency);
      setCurrency(newCurrency);
      setShowCurrencyModal(false);
      Alert.alert('Success', 'Currency updated successfully');
    } catch (error) {
      console.error('Error saving currency', error);
      Alert.alert('Error', 'Failed to update currency');
    }
  };
  return (
    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.settingsTitle}>Settings</Text>
      
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCategoryTitle}>Appearance</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Icon name="brightness-6" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>Dark Mode</Text>
          </View>
          <View style={styles.toggleSwitch}>
            <TouchableOpacity 
              style={[styles.toggleButton, themeMode === 'dark' ? styles.toggleActive : styles.toggleInactive]}
              onPress={updateThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            >
              <View style={[styles.toggleCircle, themeMode === 'dark' ? styles.toggleCircleRight : styles.toggleCircleLeft]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCategoryTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Icon name="public" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>Currency</Text>
          </View>
          <TouchableOpacity 
            style={styles.currencySelector}
            onPress={() => setShowCurrencyModal(true)}
          >
            <Text style={styles.currencyText}>{currency} {currencies.find(c => c.symbol === currency)?.name.split(' ')[0]}</Text>
            <Icon name="arrow-drop-down" type="material" color="#cccccc" size={24} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Icon name="notifications" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>Notifications</Text>
          </View>
          <View style={styles.toggleSwitch}>
            <TouchableOpacity style={[styles.toggleButton, styles.toggleActive]}>
              <View style={[styles.toggleCircle, styles.toggleCircleRight]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/whitelist-messages')}
        >
          <View style={styles.settingItemLeft}>
            <Icon name="message" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>Whitelist Messages</Text>
          </View>
          <Icon name="chevron-right" type="material" color="#cccccc" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingsCard}>
        <Text style={styles.settingsCategoryTitle}>About</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Icon name="phone-android" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>App Version: 1.0.0</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => router.push('/help')}
        >
          <View style={styles.settingItemLeft}>
            <Icon name="help" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>Help & Support</Text>
          </View>
          <Icon name="chevron-right" type="material" color="#cccccc" size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            Alert.alert(
              'Contact Support',
              'Need help? Reach out to our support team!',
              [
                {text: 'Email Us', onPress: () => Linking.openURL('mailto:ArthMitraofficial@outlook.com')},
                {text: 'Cancel', style: 'cancel'}
              ]
            );
          }}
        >
          <View style={styles.settingItemLeft}>
            <Icon name="mail" type="material" color="#cccccc" size={24} />
            <Text style={styles.settingItemText}>Contact Us</Text>
          </View>
          <Icon name="chevron-right" type="material" color="#cccccc" size={24} />
        </TouchableOpacity>
        
        <View style={styles.teamMessageContainer}>
          <Text style={styles.teamMessageText}>Created By Team Mitra with <Text style={{color: '#F13C20'}}>❤</Text></Text>
        </View>
      </View>
      
      {/* Currency Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCurrencyModal}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            
            <FlatList
              data={currencies}
              keyExtractor={(item) => item.symbol}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={[styles.currencyOption, currency === item.symbol && styles.currencyOptionSelected]}
                  onPress={() => saveCurrency(item.symbol)}
                >
                  <Text style={styles.currencySymbol}>{item.symbol}</Text>
                  <Text style={styles.currencyName}>{item.name}</Text>
                  {currency === item.symbol && (
                    <Icon name="check" type="material" color="#4361ee" size={20} />
                  )}
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCurrencyModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#000000',
  },
  settingsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textShadowColor: 'rgba(67, 97, 238, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  settingsCard: {
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
  settingsCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textShadowColor: 'rgba(67, 97, 238, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 2,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 15,
  },
  toggleSwitch: {
    alignItems: 'flex-end',
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleActive: {
    backgroundColor: '#9c6df2',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  toggleInactive: {
    backgroundColor: '#444444',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleCircleRight: {
    alignSelf: 'flex-end',
  },
  toggleCircleLeft: {
    alignSelf: 'flex-start',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    backdropFilter: 'blur(8px)',
  },
  currencyText: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 5,
  },
  profileButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  profileButtonText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.3)',
    maxHeight: '80%',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
    backdropFilter: 'blur(15px)',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  currencyOptionSelected: {
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 12,
  },
  currencyName: {
    fontSize: 16,
    color: '#cccccc',
    flex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
  },
  closeButtonText: {
    color: '#9c6df2', // This overwrites the previous color
    fontSize: 16,
    fontWeight: 'bold', // Retain the more relevant value
    marginRight: 10,
  },
  teamMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamMessageText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(67, 97, 238, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});

export default SettingsTab;