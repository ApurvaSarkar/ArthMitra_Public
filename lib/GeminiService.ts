import { getTransactions } from './TransactionService';
import { Transaction } from './types';

// Primary and backup Gemini API keys
let PRIMARY_GEMINI_API_KEY = process.env.EXPO_PUBLIC_PRIMARY_GEMINI_SERVICE_API_KEY;
let BACKUP_GEMINI_API_KEY = process.env.EXPO_PUBLIC_SECONDARY_GEMINI_SERVICE_API_KEY;
let CURRENT_API_KEY = PRIMARY_GEMINI_API_KEY;

// Function to set the primary API key
export const setGeminiApiKey = (apiKey: string) => {
  PRIMARY_GEMINI_API_KEY = apiKey;
  CURRENT_API_KEY = PRIMARY_GEMINI_API_KEY;
};

// Function to set the backup API key
export const setBackupGeminiApiKey = (apiKey: string) => {
  BACKUP_GEMINI_API_KEY = apiKey;
};

// Function to switch to backup API key
const switchToBackupApiKey = () => {
  console.log('Switching to backup Gemini API key');
  CURRENT_API_KEY = BACKUP_GEMINI_API_KEY;
};

// Function to reset to primary API key
export const resetToPrimaryApiKey = () => {
  console.log('Resetting to primary Gemini API key');
  CURRENT_API_KEY = PRIMARY_GEMINI_API_KEY;
};

// Function to get financial insights from transaction data
export const getFinancialInsights = async (transactions: Transaction[]) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      topExpenseCategories: [],
      message: "I don't see any transaction data yet. Start tracking your expenses and income to get personalized insights!"
    };
  }

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  // Sort categories by amount spent
  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }));

  return {
    totalIncome,
    totalExpenses,
    balance,
    topExpenseCategories: sortedCategories.slice(0, 3)
  };
};

// Function to query Gemini API with user input and financial data
export const queryGeminiWithFinancialContext = async (userInput: string): Promise<string> => {
  try {
    // Get user's transaction data
    const { data: transactions, error } = await getTransactions();
    
    if (error) {
      console.error('Error fetching transactions for Gemini context:', error);
      return "❌ I'm having trouble accessing your financial data right now. Let's try again later. 🔄";
    }

    // Get user's currency preference
    let currencySymbol = '₹';
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const savedCurrency = await AsyncStorage.getItem('@ArthMitra:currency');
      if (savedCurrency) {
        currencySymbol = savedCurrency;
      }
    } catch (err) {
      console.error('Error loading currency for Gemini context:', err);
      // Continue with default currency if there's an error
    }

    // Get financial insights
    const financialContext = await getFinancialInsights(transactions || []);
    
    // Check if we have a message instead of data (no transactions case)
    const contextMessage = 'message' in financialContext ? financialContext.message : null;

    // Prepare the prompt for Gemini
    const prompt = {
      contents: [
        {
          parts: [
            { text: contextMessage ? 
              `You are a helpful financial assistant. ${contextMessage} The user asks: ${userInput}\n\nProvide a helpful response. Include relevant emojis throughout your response to make it more engaging (e.g., 💰 for money, 📊 for insights, 💸 for expenses, 💼 for income, etc.). Keep your answer concise and focused on their question.` :
              `You are a helpful financial assistant. The user has the following financial data:\n` +
              `Total Income: ${currencySymbol}${financialContext.totalIncome}\n` +
              `Total Expenses: ${currencySymbol}${financialContext.totalExpenses}\n` +
              `Current Balance: ${currencySymbol}${financialContext.balance}\n\n` +
              `Top expense categories:\n` +
              (financialContext.topExpenseCategories.length > 0 ? 
                financialContext.topExpenseCategories.map(c => `- ${c.category}: ${currencySymbol}${c.amount}`).join('\n') : 
                '- No expense data available yet') +
              `\n\nThe user asks: ${userInput}\n\n` +
              `Provide a helpful, personalized response based on their financial data. Always use the currency symbol ${currencySymbol} when mentioning any monetary values. Include relevant emojis throughout your response to make it more engaging (e.g., 💰 for money, 📊 for insights, 💸 for expenses, 💼 for income, etc.). Keep your answer concise and focused on their question.` }
          ]
        }
      ]
    };

    // Check if API keys are set
    if ((!PRIMARY_GEMINI_API_KEY || PRIMARY_GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") && 
        (!BACKUP_GEMINI_API_KEY || BACKUP_GEMINI_API_KEY === "YOUR_GEMINI_API_KEY")) {
      console.error('No Gemini API keys are set');
      return "⚠️ I'm not fully set up yet. Please provide a valid Gemini API key to enable AI-powered financial insights. 🔑";
    }

    // Try with current API key (initially the primary key)
    let response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        'x-goog-api-key': CURRENT_API_KEY || ''
      }),
      body: JSON.stringify(prompt)
    });

    // If primary key fails and we're not already using the backup, try the backup key
    if (!response.ok && CURRENT_API_KEY === PRIMARY_GEMINI_API_KEY && BACKUP_GEMINI_API_KEY) {
      console.error('Primary Gemini API key failed, trying backup key');
      const errorData = await response.json();
      console.error('Primary key error:', errorData);
      
      // Switch to backup key
      switchToBackupApiKey();
      
      // Retry with backup key
      response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'x-goog-api-key': CURRENT_API_KEY || ''
        }),
        body: JSON.stringify(prompt)
      });
    }

    // If still not successful after trying both keys
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error with all available keys:', errorData);
      return "❗ I encountered an issue while processing your request. Please try again later. 🔄";
    }

    const data = await response.json();
    
    // Check if the response has the expected structure
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Unexpected Gemini API response structure:', data);
      return "⚠️ I received an unexpected response format. Please try again later. 🔄";
    }
    
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error('Error querying Gemini API:', error);
    return "📶 I'm having trouble connecting to my AI services right now. Please try again later. 🔄";
  }
};