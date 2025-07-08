import { supabase } from './supabase';
import { createTransaction } from './TransactionService';
import { SmsMessage } from './SmsService';
import { Transaction } from './types';

// Primary and backup Gemini API keys for SMS scanning
let PRIMARY_SMS_API_KEY = process.env.EXPO_PUBLIC_PRIMARY_GEMINI_SMS_API_KEY;
let BACKUP_SMS_API_KEY = process.env.EXPO_PUBLIC_SECONDARY_GEMINI_SMS_API_KEY;
let CURRENT_SMS_API_KEY = PRIMARY_SMS_API_KEY;

// Function to switch to backup API key
const switchToBackupSmsApiKey = () => {
  console.log('Switching to backup SMS Gemini API key');
  CURRENT_SMS_API_KEY = BACKUP_SMS_API_KEY;
};

// Function to reset to primary API key
export const resetToPrimarySmsApiKey = () => {
  console.log('Resetting to primary SMS Gemini API key');
  CURRENT_SMS_API_KEY = PRIMARY_SMS_API_KEY;
};

// Interface for extracted transaction data
interface ExtractedTransaction {
  amount: number;
  type: 'income' | 'expense';
  description: string;
  provider: string;
}

// Function to call Gemini API for SMS analysis
const callGeminiSmsApi = async (prompt: string, retryWithBackup = false): Promise<any> => {
  const apiKey = retryWithBackup ? BACKUP_SMS_API_KEY : CURRENT_SMS_API_KEY;
  
  if (!apiKey) {
    throw new Error('No Gemini API key available for SMS scanning');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    if (response.status === 429 || response.status === 403) {
      if (!retryWithBackup && BACKUP_SMS_API_KEY) {
        console.log('Primary SMS API key failed, trying backup...');
        switchToBackupSmsApiKey();
        return callGeminiSmsApi(prompt, true);
      }
    }
    throw new Error(`Gemini SMS API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
};

// Function to extract transaction data from SMS message using Gemini AI
export const extractTransactionFromSms = async (message: SmsMessage): Promise<ExtractedTransaction | null> => {
  try {
    const prompt = `
Analyze this SMS message and extract transaction information. Return ONLY a JSON object with the following structure:
{
  "isTransaction": boolean,
  "amount": number (without currency symbols),
  "type": "credit" or "debit",
  "description": "brief description of the transaction",
  "provider": "sender name from the message"
}

If this is not a transaction message, return {"isTransaction": false}.

SMS Message:
From: ${message.address}
Content: ${message.body}

Rules:
- Look for keywords like: credited, debited, received, paid, transferred, withdrawn, deposited
- Extract the amount (numbers only, no currency symbols)
- Credit/received/deposited = "credit"
- Debit/paid/withdrawn/transferred = "debit"
- Be very strict - only return transaction data for clear financial transactions
- Provider should be the sender name (like bank name, payment service, etc.)
`;

    const response = await callGeminiSmsApi(prompt);
    
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
      console.log('No valid response from Gemini for SMS:', message._id);
      return null;
    }

    const responseText = response.candidates[0].content.parts[0].text;
    
    // Clean the response text to extract JSON
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    const parsedResponse = JSON.parse(cleanedResponse);
    
    if (!parsedResponse.isTransaction) {
      return null;
    }

    return {
      amount: parsedResponse.amount,
      type: parsedResponse.type === 'credit' ? 'income' : 'expense',
      description: parsedResponse.description,
      provider: parsedResponse.provider
    };
  } catch (error) {
    console.error('Error extracting transaction from SMS:', error);
    return null;
  }
};

// Function to check if a similar transaction already exists
const checkDuplicateTransaction = async (amount: number, type: string, provider: string, messageDate: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Convert message date to a readable format for comparison
    const transactionDate = new Date(parseInt(messageDate));
    const dateString = `${transactionDate.getDate().toString().padStart(2, '0')}/${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}/${transactionDate.getFullYear()}`;
    
    // Check for existing transactions with same amount, type, and similar date
    const { data: existingTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('amount', amount)
      .eq('type', type)
      .eq('deleted', false)
      .ilike('title', `%${provider}%`);

    if (error) {
      console.error('Error checking duplicate transactions:', error);
      return false;
    }

    // Check if any existing transaction has the same date
    const isDuplicate = existingTransactions?.some(transaction => {
      return transaction.date === dateString;
    });

    return isDuplicate || false;
  } catch (error) {
    console.error('Error in duplicate check:', error);
    return false;
  }
};

// Function to scan multiple SMS messages and create transactions
export const scanSmsMessagesForTransactions = async (messages: SmsMessage[]): Promise<{
  success: number;
  failed: number;
  skipped: number;
  duplicates: number;
  errors: string[];
}> => {
  let success = 0;
  let failed = 0;
  let skipped = 0;
  let duplicates = 0;
  const errors: string[] = [];

  console.log(`Starting to scan ${messages.length} SMS messages for transactions...`);

  for (const message of messages) {
    try {
      const extractedTransaction = await extractTransactionFromSms(message);
      
      if (!extractedTransaction) {
        skipped++;
        continue;
      }

      // Check for duplicate transactions
      const isDuplicate = await checkDuplicateTransaction(
        extractedTransaction.amount,
        extractedTransaction.type,
        extractedTransaction.provider,
        message.date.toString()
      );

      if (isDuplicate) {
        duplicates++;
        console.log(`Duplicate transaction detected: ${extractedTransaction.description} - ₹${extractedTransaction.amount}`);
        continue;
      }

      // Create transaction date in DD/MM/YYYY format with timezone consideration
      const transactionDate = new Date(parseInt(message.date.toString()));
      const dateString = `${transactionDate.getDate().toString().padStart(2, '0')}/${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}/${transactionDate.getFullYear()}`;

      // Create transaction with "Via SMS" category
      const transactionData = {
        title: extractedTransaction.description,
        amount: extractedTransaction.amount,
        type: extractedTransaction.type,
        category: 'Via SMS',
        date: dateString, // Use formatted date string instead of ISO string
        icon: extractedTransaction.type === 'income' ? 'trending-up' : 'trending-down',
        iconColor: extractedTransaction.type === 'income' ? '#10B981' : '#EF4444',
        iconBg: extractedTransaction.type === 'income' ? '#D1FAE5' : '#FEE2E2'
      };

      const result = await createTransaction(transactionData);
      
      if (result.error) {
        failed++;
        errors.push(`Failed to create transaction for message from ${message.address}: ${result.error instanceof Error ? result.error.message : 'Unknown error'}`);
      } else {
        success++;
        console.log(`Successfully created transaction: ${extractedTransaction.description} - ₹${extractedTransaction.amount}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error processing message from ${message.address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`SMS scanning completed: ${success} success, ${failed} failed, ${skipped} skipped, ${duplicates} duplicates`);
  
  return {
    success,
    failed,
    skipped,
    duplicates,
    errors
  };
};