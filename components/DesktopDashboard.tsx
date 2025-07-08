import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, Alert, Modal, FlatList, Linking } from 'react-native';
import { Icon } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { generateDashboardInsights, DashboardInsights } from '../lib/DashboardService';
import { Transaction } from '../lib/types';
import { fetchEconomicNews, NewsArticle, formatNewsDate, checkApiKeyValidity } from '../lib/NewsService';
import { downloadAvatar } from '../lib/AvatarService';
import { supabase } from '../lib/supabase';
import TransactionsPage from './TransactionsPage';
import SettingsTab from './SettingsTab';
import TransactionInsights from './TransactionInsights';
import AccountSettings from './AccountSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteTransaction } from '../lib/TransactionService';

interface DesktopDashboardProps {
  transactions: Transaction[];
  balance: number;
  income: number;
  expense: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  username: string;
  onAddTransaction: () => void;
  onViewTransactions: () => void;
  onViewProfile: () => void;
  onSignOut: () => void;
  setTransactions: (transactions: Transaction[]) => void;
  setExpense: (expense: number) => void;
  setBalance: (balance: number) => void;
  setIncome: (income: number) => void;
  fadeAnim?: any;
  slideAnim?: any;
  themeMode?: string;
  updateThemeMode?: (mode: 'dark' | 'light' | 'system') => () => void;
  session?: any;
}

const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  transactions,
  balance,
  income,
  expense,
  activeTab,
  setActiveTab,
  username,
  onAddTransaction,
  onViewTransactions,
  onViewProfile,
  onSignOut,
  setTransactions,
  setExpense,
  setBalance,
  setIncome,
  fadeAnim,
  slideAnim,
  themeMode = 'dark',
  updateThemeMode
}) => {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [economicNews, setEconomicNews] = useState<NewsArticle[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const dashboardInsights = await generateDashboardInsights(transactions);
        setInsights(dashboardInsights);
      } catch (error) {
        console.error('Error loading dashboard insights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [transactions]);

  useEffect(() => {
    const loadEconomicNews = async () => {
      try {
        setNewsLoading(true);
        
        // First check if the API key is valid
        const isApiKeyValid = await checkApiKeyValidity();
        console.log('API key validity check:', isApiKeyValid ? 'Valid' : 'Invalid');
        
        const news = await fetchEconomicNews(6);
        setEconomicNews(news);
        // Check if we're using mock data by looking at the URL
        const isMockData = news.length > 0 && news[0].url === '#';
        console.log('Using mock news data:', isMockData);
        
        if (isMockData && isApiKeyValid === false) {
          console.warn('Using mock data because API key is invalid or API request failed');
        }
      } catch (error) {
        console.error('Error loading economic news:', error);
      } finally {
        setNewsLoading(false);
      }
    };

    loadEconomicNews();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUserSession(session);
        
        if (session?.user) {
          // Get user profile data including avatar_url
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile data:', profileError);
            return;
          }
          
          if (profileData?.avatar_url) {
            // Download the avatar using the avatar_url from profile
            const avatarUrl = await downloadAvatar(profileData.avatar_url);
            if (avatarUrl?.data) {
              setProfileImage(URL.createObjectURL(avatarUrl.data));
            } else if (avatarUrl?.error) {
              console.error('Error setting profile image:', avatarUrl.error);
              setProfileImage(null);
            }
          } else {
            setProfileImage(null);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const chartConfig = {
    backgroundColor: '#000000',
    backgroundGradientFrom: '#000000',
    backgroundGradientTo: '#1a1a1a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffffff'
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const menuItems = [
    { id: 'home', icon: 'dashboard', label: 'Dashboard', active: activeTab === 'home' },
    { id: 'transactions', icon: 'receipt', label: 'Transactions', active: activeTab === 'transactions' },
    { id: 'insights', icon: 'analytics', label: 'Insights', active: activeTab === 'insights' },
    { id: 'settings', icon: 'settings', label: 'Settings', active: activeTab === 'settings' }
  ];

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.sidebarGradient}
      >
        {/* Logo and App Name */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Icon name="account-balance-wallet" size={32} color="#fff" />
          </View>
          <Text style={styles.appName}>ArthMitra</Text>
          <Text style={styles.appTagline}>Financial Dashboard</Text>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <TouchableOpacity style={styles.userAvatar} onPress={onViewProfile}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Icon name="person" size={24} color="#ffffff" />
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{username || 'User'}</Text>
          <Text style={styles.userRole}>Premium Member</Text>
        </View>

        {/* Navigation Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.active && styles.menuItemActive]}
              onPress={() => setActiveTab(item.id)}
            >
              <Icon 
                name={item.icon} 
                size={20} 
                color={item.active ? '#000000' : 'rgba(255,255,255,0.7)'} 
              />
              <Text style={[styles.menuText, item.active && styles.menuTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onAddTransaction}>
            <Icon name="add" size={16} color="#000000" />
            <Text style={styles.quickActionText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
          <Icon name="logout" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderMainContent = () => {
    if (activeTab === 'home') {
      return renderDashboardContent();
    } else if (activeTab === 'transactions') {
      return renderTransactionsContent();
    } else if (activeTab === 'insights') {
      return renderInsightsContent();
    } else if (activeTab === 'settings') {
      return renderSettingsContent();
    } else if (activeTab === 'profile') {
      return renderProfileContent();
    }
    return renderDashboardContent();
  };

  const renderDashboardContent = () => (
    <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {username}!</Text>
          <Text style={styles.headerSubtitle}>Here's your financial overview</Text>
        </View>
        <TouchableOpacity style={styles.profilePhotoContainer} onPress={onViewProfile}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.headerProfileImage} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Icon name="person" size={24} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Financial Overview Cards */}
      <View style={styles.overviewCards}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.balanceCard}>
          <Text style={styles.cardLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceChange}>
            <Icon name="trending-up" size={16} color="#4ade80" />
            <Text style={styles.changeText}>+2.5% from last month</Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="arrow-downward" size={20} color="#10b981" />
              <Text style={styles.statLabel}>Income</Text>
            </View>
            <Text style={styles.statAmount}>{formatCurrency(income)}</Text>
            <Text style={styles.statChange}>+12% this month</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="arrow-upward" size={20} color="#ef4444" />
              <Text style={styles.statLabel}>Expenses</Text>
            </View>
            <Text style={styles.statAmount}>{formatCurrency(expense)}</Text>
            <Text style={styles.statChange}>-5% this month</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Icon name="savings" size={20} color="#8b5cf6" />
              <Text style={styles.statLabel}>Savings Rate</Text>
            </View>
            <Text style={styles.statAmount}>{insights?.savingsRate.toFixed(1)}%</Text>
            <Text style={styles.statChange}>Target: 20%</Text>
          </View>
        </View>
      </View>

      {/* Charts Section */}
      <View style={styles.chartsSection}>
        <View style={styles.chartContainer}>
          <View style={styles.chartTitleContainer}>
            <Text style={styles.chartTitle}>Economic News</Text>
            {economicNews.length > 0 && economicNews[0].url === '#' && (
              <Text style={styles.mockDataIndicator}>Demo Data</Text>
            )}
          </View>
          {newsLoading ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Loading economic news...</Text>
            </View>
          ) : (
            <ScrollView style={styles.newsContainer} showsVerticalScrollIndicator={false}>
              {economicNews.map((article, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.newsItem}
                  onPress={() => article.url !== '#' && Linking.openURL(article.url)}
                >
                  <View style={styles.newsHeader}>
                    <Text style={styles.newsTitle} numberOfLines={2}>{article.title}</Text>
                    <Text style={styles.newsTime}>{formatNewsDate(article.published_at)}</Text>
                  </View>
                  <Text style={styles.newsDescription} numberOfLines={2}>{article.description}</Text>
                  <View style={styles.newsFooter}>
                    <Text style={styles.newsSource}>{article.source}</Text>
                    {article.entities && article.entities[0] && (
                      <Text style={styles.newsSymbol}>{article.entities[0].symbol}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Category Breakdown</Text>
          {insights?.chartData.categoryBreakdown && insights.chartData.categoryBreakdown.length > 0 ? (
            <PieChart
              data={insights.chartData.categoryBreakdown.map(cat => ({
                name: cat.category,
                population: cat.amount,
                color: cat.color,
                legendFontColor: '#ffffff',
                legendFontSize: 12
              }))}
              width={screenWidth * 0.45 - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
              absolute
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No category data available</Text>
            </View>
          )}
        </View>
      </View>

      {/* AI Insights */}
      <View style={styles.insightsSection}>
        <Text style={styles.sectionTitle}>AI-Powered Insights</Text>
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Icon name="psychology" size={24} color="#667eea" />
            <Text style={styles.insightTitle}>Financial Analysis</Text>
          </View>
          {loading ? (
            <Text style={styles.insightText}>Analyzing your financial data...</Text>
          ) : (
            <TransactionInsights transactions={transactions} />
          )}
        </View>

        <View style={styles.recommendationsCard}>
          <Text style={styles.recommendationTitle}>Recommendations</Text>
          {loading ? (
            <Text style={styles.loadingText}>Generating recommendations...</Text>
          ) : (
            insights?.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Icon name="lightbulb" size={16} color="#f59e0b" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={onViewTransactions}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {transactions.slice(0, 5).map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Icon 
                  name={transaction.icon || 'receipt'} 
                  size={20} 
                  color={transaction.type === 'income' ? '#10b981' : '#ef4444'} 
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[
                  styles.transactionAmountText,
                  { color: transaction.type === 'income' ? '#10b981' : '#ef4444' }
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(transaction.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderTransactionsContent = () => (
    <View style={styles.mainContent}>
      <TransactionsPage
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        transactions={transactions}
        setTransactions={setTransactions}
        setExpense={setExpense}
        setBalance={setBalance}
        setIncome={setIncome}
        expense={expense}
        balance={balance}
        income={income}
        loading={loading}
      />
    </View>
  );

  const renderInsightsContent = () => (
    <View style={styles.mainContent}>
      <Text style={styles.pageTitle}>Insights</Text>
      <Text style={styles.pageSubtitle}>Detailed financial analytics</Text>
      <TransactionInsights transactions={transactions} />
    </View>
  );

  const renderSettingsContent = () => (
    <View style={styles.mainContent}>
      <SettingsTab
        fadeAnim={fadeAnim}
        slideAnim={slideAnim}
        themeMode={themeMode || 'dark'}
        updateThemeMode={updateThemeMode || (() => () => {})}
      />
    </View>
  );

  const renderProfileContent = () => (
    <View style={styles.mainContent}>
      <Text style={styles.pageTitle}>Profile</Text>
      <Text style={styles.pageSubtitle}>Manage your account settings</Text>
      {userSession && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <AccountSettings session={userSession} />
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderSidebar()}
      {renderMainContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000000',
  },
  sidebar: {
    width: 280,
    height: '100%',
  },
  sidebarGradient: {
    flex: 1,
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  appTagline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  userSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: '#ffffff',
  },
  menuText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 15,
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 10,
  },
  quickActionText: {
    color: '#000000',
    marginLeft: 8,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    padding: 30,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cccccc',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePhotoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  headerProfileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewCards: {
    marginBottom: 30,
  },
  balanceCard: {
    padding: 25,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  cardLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    color: '#4ade80',
    marginLeft: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 8,
  },
  statAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  statChange: {
    fontSize: 12,
    color: '#10b981',
  },
  chartsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  chartContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  mockDataIndicator: {
    fontSize: 12,
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#cccccc',
  },
  newsContainer: {
    height: 220,
  },
  newsItem: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  newsTime: {
    fontSize: 12,
    color: '#cccccc',
  },
  newsDescription: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 8,
    lineHeight: 16,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 11,
    color: '#999999',
  },
  newsSymbol: {
    fontSize: 11,
    color: '#4ade80',
    fontWeight: '600',
  },
  insightsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 10,
  },
  insightText: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
  recommendationsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 14,
    color: '#cccccc',
    fontStyle: 'italic',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  recentSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  transactionsList: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#cccccc',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#cccccc',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#cccccc',
  },
});

export default DesktopDashboard;