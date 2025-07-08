import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TransactionInsights from './TransactionInsights';

interface InsightsTabProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  balance: number;
  income: number;
  expense: number;
  transactions?: {
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    icon?: string;
    iconBg?: string;
    iconColor?: string;
  }[];
}

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

const InsightsTab = ({ fadeAnim, slideAnim, balance, income, expense, transactions = [] }: InsightsTabProps) => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [activeInsightsTab, setActiveInsightsTab] = useState<'overview' | 'analytics'>('overview');
  
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
  
  // Calculate savings rate based on user data
  const calculateSavingsRate = () => {
    if (income === 0) return 0;
    // Savings = Income - Expense
    const savings = income - expense;
    // Calculate savings rate as a percentage of income
    const savingsRate = (savings / income) * 100;
    return Math.max(0, Math.min(100, Math.round(savingsRate))); // Ensure between 0-100%
  };
  
  // Generate category data based on transactions
  useEffect(() => {
    const generateCategoryData = () => {
      // Define category colors
      const categoryColors: Record<string, string> = {
        'Food': '#FF6B6B',
        'Transportation': '#4ECDC4',
        'Entertainment': '#FFD166',
        'Shopping': '#6A0572',
        'Utilities': '#1A535C',
        'Housing': '#3A86FF',
        'Healthcare': '#8338EC',
        'Education': '#FB5607',
        'Travel': '#FCBF49',
        'Personal': '#F72585',
        'Salary': '#4361EE',
        'Investment': '#3A0CA3',
        'Gift': '#7209B7',
        'Other': '#4CC9F0'
      };
      
      // Default color for categories not in the list
      const defaultColor = '#888888';
      
      // Filter only expense transactions
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      
      if (expenseTransactions.length === 0) {
        return [];
      }
      
      // Group transactions by category
      const categoryTotals: Record<string, number> = {};
      
      expenseTransactions.forEach(transaction => {
        const category = transaction.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      });
      
      // Calculate total expense
      const totalExpense = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
      
      // Convert to array and calculate percentages
      const data = Object.entries(categoryTotals).map(([category, amount]) => {
        return {
          category,
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
          color: categoryColors[category] || defaultColor
        };
      });
      
      // Sort by amount (highest first)
      return data.sort((a, b) => b.amount - a.amount);
    };
    
    const categoryDataResult = generateCategoryData();
    setCategoryData(categoryDataResult);
    
    // Reset selected category when data changes
    setSelectedCategory(null);
  }, [transactions]);
  
  const savingsRate = calculateSavingsRate();
  
  // Find the maximum value for scaling the chart
  const maxValue = Math.max(
    ...categoryData.map(item => item.amount),
    1000 // Set a minimum scale value to make bars visible even with small amounts
  );
  
  console.log('Category Data:', JSON.stringify(categoryData));
  console.log('Max Value for Chart:', maxValue);
  
  // Calculate the width percentage based on the value
  const getBarWidth = (value: number) => {
    // Ensure even small values have a minimum visible width
    if (value > 0 && value < 100) {
      return 30; // Minimum width for visibility
    }
    return (value / maxValue) * 200; // 200 is the maximum bar width in pixels
  };

  return (
    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.insightsHeader}>
        <TouchableOpacity style={styles.insightsTab} onPress={() => setActiveInsightsTab('overview')}>
          <Text style={activeInsightsTab === 'overview' ? styles.insightsTabActive : styles.insightsTabInactive}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.insightsTab} onPress={() => setActiveInsightsTab('analytics')}>
          <Text style={activeInsightsTab === 'analytics' ? styles.insightsTabActive : styles.insightsTabInactive}>Analytics</Text>
        </TouchableOpacity>
      </View>
      
      {activeInsightsTab === 'overview' ? (
        <>
          {/* Category Chart section */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Spending by Category</Text>
            
            {categoryData.length > 0 ? (
              <ScrollView style={styles.categoryChartContainer}>
                {categoryData.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.categoryRow}
                    onPress={() => {
                      const newSelectedCategory = selectedCategory === index ? null : index;
                      setSelectedCategory(newSelectedCategory);
                      if (newSelectedCategory !== null) {
                        setTimeout(() => setSelectedCategory(null), 2000);
                      }
                    }}
                  >
                    <View style={styles.categoryLabelContainer}>
                      <View style={[styles.categoryColorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.categoryLabel}>{item.category}</Text>
                    </View>
                    
                    <View style={styles.barOuterContainer}>
                      <View 
                        style={[
                          styles.categoryBar, 
                          { width: getBarWidth(item.amount), backgroundColor: item.color }
                        ]} 
                      />
                      <Text style={styles.categoryAmount}>
                        {currencySymbol}{item.amount.toLocaleString()}
                      </Text>
                    </View>
                    
                    <Text style={styles.categoryPercentage}>
                      {Math.round(item.percentage)}%
                    </Text>
                    
                    {selectedCategory === index && (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipTitle}>{item.category}</Text>
                        <Text style={styles.tooltipAmount}>
                          Amount: {currencySymbol}{item.amount.toLocaleString()}
                        </Text>
                        <Text style={styles.tooltipPercentage}>
                          {Math.round(item.percentage)}% of total expenses
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No expense data available</Text>
                <Text style={styles.noDataSubtext}>Add some transactions to see your spending by category</Text>
              </View>
            )}
          </View>
          
          <View style={styles.insightsCardsContainer}>
            <View style={styles.savingsCard}>
              <Text style={styles.savingsTitle}>Savings Rate</Text>
              <Text style={styles.savingsPercentage}>{savingsRate}%</Text>
              <Text style={styles.savingsSubtitle}>of income saved</Text>
            </View>
            
            <View style={styles.totalSavedCard}>
              <Text style={styles.savingsTitle}>Total Saved</Text>
              <Text style={styles.totalSavedAmount}>{currencySymbol}{balance.toLocaleString()}</Text>
              <Text style={styles.savingsSubtitle}>this year</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Analytics Section */}
          <TransactionInsights transactions={transactions} />
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 10,
  },
  insightsTab: {
    marginRight: 20,
    paddingVertical: 8,
  },
  insightsTabActive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#4361ee',
    paddingBottom: 5,
    textShadowColor: 'rgba(67, 97, 238, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  insightsTabInactive: {
    fontSize: 18,
    color: '#999999',
  },
  chartCard: {
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
    backdropFilter: 'blur(10px)',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textShadowColor: 'rgba(67, 97, 238, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryChartContainer: {
    maxHeight: 300,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  categoryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
  barOuterContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  categoryBar: {
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryAmount: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    width: 40,
    textAlign: 'right',
    marginTop: 20,
  },
  tooltip: {
    position: 'absolute',
    top: -5,
    right: -180,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.6)',
    width: 170,
    zIndex: 10,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    backdropFilter: 'blur(5px)',
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  tooltipAmount: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 2,
  },
  tooltipPercentage: {
    fontSize: 12,
    color: '#cccccc',
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
  insightsCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  savingsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    backdropFilter: 'blur(8px)',
  },
  totalSavedCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    backdropFilter: 'blur(8px)',
  },
  savingsTitle: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 10,
  },
  savingsPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9c6df2',
    marginBottom: 5,
    textShadowColor: 'rgba(156, 109, 242, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  totalSavedAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9c6df2',
    marginBottom: 5,
    textShadowColor: 'rgba(156, 109, 242, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  savingsSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
});

export default InsightsTab;