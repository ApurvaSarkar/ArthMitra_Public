import { Transaction } from './types';

const GEMINI_DASHBOARD_API_KEY = process.env.EXPO_PUBLIC_GEMINI_DASHBOARD_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface DashboardInsights {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topCategories: Array<{ category: string; amount: number; percentage: number }>;
  trendAnalysis: string;
  recommendations: string[];
  chartData: {
    monthlyTrends: Array<{ month: string; income: number; expense: number }>;
    categoryBreakdown: Array<{ category: string; amount: number; color: string }>;
    weeklySpending: Array<{ day: string; amount: number }>;
  };
}

export interface AIInsightResponse {
  insights: string;
  recommendations: string[];
  trendAnalysis: string;
}

// Generate AI insights using Gemini
export const generateAIInsights = async (transactions: Transaction[]): Promise<AIInsightResponse> => {
  if (!GEMINI_DASHBOARD_API_KEY) {
    console.error('Gemini Dashboard API key not configured');
    throw new Error('Gemini Dashboard API key not configured');
  }

  if (!transactions || transactions.length === 0) {
    return {
      insights: "No transaction data available yet. Start adding transactions to get AI-powered insights!",
      recommendations: [
        "Begin tracking your daily expenses",
        "Set up income sources",
        "Create spending categories"
      ],
      trendAnalysis: "Insufficient data for trend analysis"
    };
  }

  // Prepare transaction summary for AI analysis
  const transactionSummary = {
    totalTransactions: transactions.length,
    totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    categories: transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>),
    recentTransactions: transactions.slice(-10)
  };

  const prompt = `
    Analyze the following financial data and provide insights:
    
    Transaction Summary:
    - Total Transactions: ${transactionSummary.totalTransactions}
    - Total Income: ₹${transactionSummary.totalIncome}
    - Total Expenses: ₹${transactionSummary.totalExpenses}
    - Net Balance: ₹${transactionSummary.totalIncome - transactionSummary.totalExpenses}
    
    Category Breakdown:
    ${Object.entries(transactionSummary.categories).map(([cat, amount]) => `- ${cat}: ₹${amount}`).join('\n')}
    
    Recent Transactions:
    ${transactionSummary.recentTransactions.map(t => `- ${t.title}: ₹${t.amount} (${t.type}) - ${t.category}`).join('\n')}
    
    Please provide:
    1. A brief financial health insight (2-3 sentences)
    2. 3-5 actionable recommendations
    3. Trend analysis based on spending patterns
    
    Format your response as JSON with keys: insights, recommendations (array), trendAnalysis
  `;

  try {
    console.log('Calling Gemini API for dashboard insights');
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_DASHBOARD_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received Gemini API response');
    const aiResponse = data.candidates[0]?.content?.parts[0]?.text;

    if (!aiResponse) {
      console.error('No response from Gemini API');
      throw new Error('No response from Gemini API');
    }

    // Try to parse JSON response
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        insights: parsedResponse.insights || "AI analysis completed",
        recommendations: Array.isArray(parsedResponse.recommendations) ? parsedResponse.recommendations : [
          "Monitor your spending patterns",
          "Set monthly budgets for each category",
          "Review and optimize recurring expenses"
        ],
        trendAnalysis: parsedResponse.trendAnalysis || "Trend analysis in progress"
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      // If JSON parsing fails, extract insights from plain text
      return {
        insights: aiResponse.substring(0, 200) + "...",
        recommendations: [
          "Review your spending habits",
          "Create a monthly budget",
          "Track expenses regularly"
        ],
        trendAnalysis: "Based on your transaction patterns, consider optimizing your spending"
      };
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return {
      insights: "Unable to generate AI insights at the moment. Please try again later.",
      recommendations: [
        "Review your recent transactions",
        "Set spending limits for categories",
        "Monitor your income vs expenses"
      ],
      trendAnalysis: "Manual review of spending patterns recommended"
    };
  }
};

// Generate comprehensive dashboard insights
export const generateDashboardInsights = async (transactions: Transaction[]): Promise<DashboardInsights> => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Filter current month transactions
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });

  // Calculate basic metrics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpenses;
  
  const monthlyIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

  // Calculate top categories
  const categoryTotals = transactions.reduce((acc, t) => {
    if (t.type === 'expense') {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Generate chart data
  const chartData = {
    monthlyTrends: generateMonthlyTrends(transactions),
    categoryBreakdown: generateCategoryBreakdown(topCategories),
    weeklySpending: generateWeeklySpending(transactions)
  };

  // Get AI insights
  const aiInsights = await generateAIInsights(transactions);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    topCategories,
    trendAnalysis: aiInsights.trendAnalysis,
    recommendations: aiInsights.recommendations,
    chartData
  };
};

// Helper function to generate monthly trends
const generateMonthlyTrends = (transactions: Transaction[]) => {
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expense += t.amount;
    }
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      income: data.income,
      expense: data.expense
    }));
};

// Helper function to generate category breakdown
const generateCategoryBreakdown = (topCategories: Array<{ category: string; amount: number; percentage: number }>) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  
  return topCategories.map((cat, index) => ({
    category: cat.category,
    amount: cat.amount,
    color: colors[index % colors.length]
  }));
};

// Helper function to generate weekly spending
const generateWeeklySpending = (transactions: Transaction[]) => {
  const weeklyData: Record<string, number> = {
    'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
  };
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const date = new Date(t.date);
      const dayName = dayNames[date.getDay()];
      weeklyData[dayName] += t.amount;
    });

  return Object.entries(weeklyData).map(([day, amount]) => ({ day, amount }));
};