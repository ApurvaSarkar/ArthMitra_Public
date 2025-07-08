import { Alert, Platform, PermissionsAndroid } from 'react-native';
// @ts-ignore
import SmsAndroid from 'react-native-get-sms-android';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SmsMessage {
  _id: string;
  thread_id: string;
  address: string; // This contains the sender/provider information
  body: string;
  date: string | number; // Can be string or number depending on the source
  date_sent: string | number;
  read: number;
  status: number;
  type: number;
  service_center: string;
}

// Function to request SMS permission
export const requestSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    console.log('SMS functionality is only available on Android');
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'ArthMitra needs access to your SMS to analyze transactions.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('Error requesting SMS permission:', err);
    return false;
  }
};

// Function to get all SMS messages
export const getAllSmsMessages = (): Promise<SmsMessage[]> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'android') {
      reject('SMS functionality is only available on Android');
      return;
    }

    const filter = {
      box: 'inbox',
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => {
        console.log('Failed to list SMS:', fail);
        reject(fail);
      },
      (count: number, smsList: string) => {
        try {
          const messages = JSON.parse(smsList) as SmsMessage[];
          resolve(messages);
        } catch (error) {
          console.error('Error parsing SMS list:', error);
          reject(error);
        }
      },
    );
  });
};

// Function to get transaction SMS messages
export const getTransactionSmsMessages = (): Promise<SmsMessage[]> => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'android') {
      reject('SMS functionality is only available on Android');
      return;
    }

    const filter = {
      box: 'inbox',
      bodyRegex: '(.*)transaction(.*)|(.*)credited(.*)|(.*)debited(.*)|(.*)payment(.*)',
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => {
        console.log('Failed to list transaction SMS:', fail);
        reject(fail);
      },
      (count: number, smsList: string) => {
        try {
          const messages = JSON.parse(smsList) as SmsMessage[];
          resolve(messages);
        } catch (error) {
          console.error('Error parsing transaction SMS list:', error);
          reject(error);
        }
      },
    );
  });
};

// Function to extract unique providers from SMS messages
export const extractSmsProviders = (messages: SmsMessage[]): string[] => {
  const providers = new Set<string>();
  
  messages.forEach(message => {
    if (message.address) {
      providers.add(message.address);
    }
  });

  return Array.from(providers).sort();
};

// Function to save whitelisted providers to AsyncStorage
export const saveWhitelistedProviders = async (providers: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem('@ArthMitra:whitelistedProviders', JSON.stringify(providers));
  } catch (error) {
    console.error('Error saving whitelisted providers:', error);
    throw error;
  }
};

// Function to get whitelisted providers from AsyncStorage
export const getWhitelistedProviders = async (): Promise<string[]> => {
  try {
    const providers = await AsyncStorage.getItem('@ArthMitra:whitelistedProviders');
    return providers ? JSON.parse(providers) : [];
  } catch (error) {
    console.error('Error getting whitelisted providers:', error);
    return [];
  }
};

// Function to filter SMS messages by whitelisted providers
export const filterMessagesByProviders = (messages: SmsMessage[], whitelistedProviders: string[]): SmsMessage[] => {
  if (whitelistedProviders.length === 0) {
    return messages; // Return all messages if no providers are whitelisted
  }
  
  return messages.filter(message => 
    whitelistedProviders.includes(message.address)
  );
};

// Function to save the last scanned message timestamp
export const saveLastScanTimestamp = async (timestamp: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('@ArthMitra:lastScanTimestamp', timestamp);
  } catch (error) {
    console.error('Error saving last scan timestamp:', error);
    throw error;
  }
};

// Function to get the last scanned message timestamp
export const getLastScanTimestamp = async (): Promise<string | null> => {
  try {
    const timestamp = await AsyncStorage.getItem('@ArthMitra:lastScanTimestamp');
    return timestamp;
  } catch (error) {
    console.error('Error getting last scan timestamp:', error);
    return null;
  }
};

// Function to filter messages that are newer than the last scan
export const filterNewMessages = (messages: SmsMessage[], lastScanTimestamp: string | null): SmsMessage[] => {
  if (!lastScanTimestamp) {
    // If no previous scan, return all messages
    return messages;
  }
  
  const lastScanTime = parseInt(lastScanTimestamp);
  
  return messages.filter(message => {
    const messageTime = typeof message.date === 'string' ? parseInt(message.date) : message.date;
    return messageTime > lastScanTime;
  });
};

// Function to get the latest message timestamp from a list of messages
export const getLatestMessageTimestamp = (messages: SmsMessage[]): string | null => {
  if (messages.length === 0) {
    return null;
  }
  
  const latestMessage = messages.reduce((latest, current) => {
    const latestTime = typeof latest.date === 'string' ? parseInt(latest.date) : latest.date;
    const currentTime = typeof current.date === 'string' ? parseInt(current.date) : current.date;
    return currentTime > latestTime ? current : latest;
  });
  
  // Ensure we return a string
  return typeof latestMessage.date === 'string' ? latestMessage.date : latestMessage.date.toString();
};