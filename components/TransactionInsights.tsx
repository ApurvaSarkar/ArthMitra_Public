import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Using a modified transaction type to handle optional icon properties
interface TransactionWithOptionalIcons {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
}

interface TransactionInsightsProps {
  transactions: TransactionWithOptionalIcons[];
}

const TransactionInsights: React.FC<TransactionInsightsProps> = ({ transactions }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  // Load currency symbol from AsyncStorage
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const savedCurrency = await AsyncStorage.getItem('@ArthMitra:currency');
        if (savedCurrency) {
          setCurrencySymbol(savedCurrency);
        }
      } catch (error) {
        console.error('Error loading currency', error);
      }
    };
    
    loadCurrency();
  }, []);

  // Function to get insights from Gemini API
  const getInsightsFromGemini = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare transaction data for the API
      const transactionData = transactions.map(t => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.date
      }));
      
      // Create a prompt for the Gemini API
      const prompt = {
        contents: [{
          parts: [{
            text: `You are a financial advisor. Analyze the following transaction data and provide 3-4 concise, actionable insights about spending patterns, savings opportunities, and financial health. 

Format your response with the following requirements:
1. Start each insight with an appropriate emoji (like 💰, 📊, 💡, 📈, 💸, 🔍, 🎯, etc.)
2. Use bullet points for each insight
3. Bold any key numbers or important phrases
4. Use the currency symbol ${currencySymbol} when mentioning monetary values
5. End with a motivational one-liner with an emoji

Transaction data: ${JSON.stringify(transactionData)}`
          }]
        }]
      };
      
      // Primary and secondary API keys for Gemini API
      const PRIMARY_GEMINI_API_KEY = process.env.EXPO_PUBLIC_PRIMARY_GEMINI_TRANSACTION_API_KEY;
      const SECONDARY_GEMINI_API_KEY = process.env.EXPO_PUBLIC_SECONDARY_GEMINI_TRANSACTION_API_KEY;
      
      // Try with primary key first
      let response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'x-goog-api-key': PRIMARY_GEMINI_API_KEY || ''
        }),
        body: JSON.stringify(prompt)
      });
      
      // If primary key fails, try with secondary key
      if (!response.ok) {
        console.log('Primary API key failed, trying secondary key...');
        response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
          method: 'POST',
          headers: new Headers({
            'Content-Type': 'application/json',
            'x-goog-api-key': SECONDARY_GEMINI_API_KEY || ''
          }),
          body: JSON.stringify(prompt)
        });
      }
      
      // If both keys fail, throw an error
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API error:', errorData);
        throw new Error('Failed to get insights from AI with both API keys');
      }
      
      const data = await response.json();
      
      // Extract the insights from the response
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Unexpected API response format');
      }
      
      const insightsText = data.candidates[0].content.parts[0].text;
      setInsights(insightsText);
    } catch (error) {
      console.error('Error getting insights:', error);
      setError('Could not generate insights at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get insights when transactions change
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      getInsightsFromGemini();
    } else {
      setInsights('');
      setLoading(false);
    }
  }, [transactions]);
  
  // Function to refresh insights
  const handleRefresh = () => {
    if (transactions && transactions.length > 0) {
      getInsightsFromGemini();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Analysis Summary</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" type="material" color="#9c6df2" size={20} />
        </TouchableOpacity>
      </View>
      
      {transactions.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No transaction data available</Text>
          <Text style={styles.noDataSubtext}>Add some transactions to get personalized insights</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9c6df2" />
          <Text style={styles.loadingText}>Analyzing your transactions...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.insightsContainer}>
          {insights.split('\n').map((line, index) => {
            // Skip empty lines
            if (!line.trim()) return null;
            
            // Filter out asterisks and check if this is a bullet point line
            const cleanedLine = line.replace(/\*/g, '');
            const isBulletPoint = cleanedLine.trim().startsWith('•') || cleanedLine.trim().startsWith('-');
            
            return (
              <View key={index} style={isBulletPoint ? styles.bulletPointContainer : styles.paragraphContainer}>
                <Text style={[styles.insightsText, isBulletPoint ? styles.bulletPoint : {}]}>{cleanedLine}</Text>
              </View>
            );
          })}
          
          {/* Disclaimer message */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>This is an AI-generated analysis. For any discrepancies, please refresh or contact our support team.</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.3)',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(67, 97, 238, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  refreshButton: {
    padding: 5,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noDataText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'rgba(156, 109, 242, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9c6df2',
  },
  retryButtonText: {
    color: '#9c6df2',
    fontSize: 14,
  },
  insightsContainer: {
    padding: 10,
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 5,
  },
  paragraphContainer: {
    marginBottom: 15,
  },
  bulletPoint: {
    marginLeft: 5,
  },
  insightsText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  disclaimerContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(156, 109, 242, 0.3)',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TransactionInsights;