import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteTransaction, undoTransaction } from '../lib/TransactionService';

interface HomeTabProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  balance: number;
  income: number;
  expense: number;
  transactions: Transaction[];
  getGreeting: () => string;
  getFirstName: () => string;
  setShowTransactionModal: (show: boolean) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setExpense: (expense: number) => void;
  setBalance: (balance: number) => void;
  setIncome: (income: number) => void;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  icon?: string;
  iconBg?: string;
  iconColor?: string;
}

const HomeTab = ({
  fadeAnim,
  slideAnim,
  balance,
  income,
  expense,
  transactions,
  getGreeting,
  getFirstName,
  setShowTransactionModal,
  setTransactions,
  setExpense,
  setBalance,
  setIncome
}: HomeTabProps) => {
  const displayedTransactions = transactions.slice(0, 2);
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [deletedTransaction, setDeletedTransaction] = useState<Transaction | null>(null);
  const [showUndoPopup, setShowUndoPopup] = useState(false);
  const undoTimeout = useRef<NodeJS.Timeout>();
  const popupAnimation = useRef(new Animated.Value(0)).current;
  const swipeCountRef = useRef<{[key: string]: number}>({});
  const swipeAnimations = useRef<{[key: string]: Animated.Value}>({});

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

  useEffect(() => {
    if (showUndoPopup) {
      Animated.timing(popupAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      undoTimeout.current = setTimeout(() => {
        hideUndoPopup();
      }, 5000); // Changed to 5 seconds
    } else {
      Animated.timing(popupAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (undoTimeout.current) {
        clearTimeout(undoTimeout.current);
      }
    };
  }, [showUndoPopup]);

  const hideUndoPopup = () => {
    setShowUndoPopup(false);
    setDeletedTransaction(null);
  };

  const handleDelete = async (transaction: Transaction) => {
    try {
      const { error } = await deleteTransaction(transaction.id);
      if (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
        return;
      }

      if (transaction.type === 'expense') {
        setExpense(expense - transaction.amount);
        setBalance(balance + transaction.amount);
      } else {
        setIncome(income - transaction.amount);
        setBalance(balance - transaction.amount);
      }

      setTransactions(transactions.filter(t => t.id !== transaction.id));
      setDeletedTransaction(transaction);
      setShowUndoPopup(true);
    } catch (err) {
      console.error('Error in delete operation:', err);
      alert('Failed to delete transaction');
    }
  };

  const handleUndo = async () => {
    if (!deletedTransaction) return;

    try {
      const { error } = await undoTransaction(deletedTransaction.id);
      if (error) {
        console.error('Error undoing transaction:', error);
        alert('Failed to undo deletion');
        return;
      }

      if (deletedTransaction.type === 'expense') {
        setExpense(expense + deletedTransaction.amount);
        setBalance(balance - deletedTransaction.amount);
      } else {
        setIncome(income + deletedTransaction.amount);
        setBalance(balance + deletedTransaction.amount);
      }

      setTransactions([deletedTransaction, ...transactions]);
      hideUndoPopup();
    } catch (err) {
      console.error('Error in undo operation:', err);
    }
  };

  return (
    <View style={{flex: 1}}>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.appTitle}>{`${getGreeting()}, ${getFirstName()}`}</Text>
        
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Icon name="account-balance-wallet" type="material" color="#4361ee" size={24} style={styles.walletIcon} />
          </View>
          <Text style={styles.balanceAmount}>{currencySymbol}{balance.toLocaleString()}</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.incomeContainer}>
              <View style={styles.summaryIconContainer}>
                <Icon name="trending-up" type="material" color="#00C853" size={20} />
              </View>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={styles.incomeAmount}>{currencySymbol}{income.toLocaleString()}</Text>
            </View>
            
            <View style={styles.expenseContainer}>
              <View style={styles.summaryIconContainer}>
                <Icon name="trending-down" type="material" color="#FF5252" size={20} />
              </View>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={styles.expenseAmount}>{currencySymbol}{expense.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <View style={styles.transactionButtons}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowTransactionModal(true)}
            >
              <Icon name="add" type="material" color="#4361ee" size={20} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {transactions.length > 2 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/transactions')}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
            <Icon name="chevron-right" type="material" color="#4361ee" size={16} />
          </TouchableOpacity>
        )}
        
        <View style={styles.transactionsList}>
          {displayedTransactions.map((transaction) => {
            // Initialize swipe animation for this transaction if it doesn't exist
            if (!swipeAnimations.current[transaction.id]) {
              swipeAnimations.current[transaction.id] = new Animated.Value(0);
            }
            
            // Create pan responder for this transaction
            const panResponder = PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onPanResponderMove: (_, gestureState) => {
                // Only allow left swipe (negative dx)
                if (gestureState.dx < 0) {
                  // Limit the swipe to -100
                  const newX = Math.max(gestureState.dx, -100);
                  swipeAnimations.current[transaction.id].setValue(newX);
                }
              },
              onPanResponderRelease: (_, gestureState) => {
                // If swiped left more than 50 pixels
                if (gestureState.dx < -50) {
                  // Count the swipe
                  swipeCountRef.current[transaction.id] = (swipeCountRef.current[transaction.id] || 0) + 1;
                  
                  // If swiped twice, delete the transaction
                  if (swipeCountRef.current[transaction.id] >= 2) {
                    handleDelete(transaction);
                    // Reset the swipe count and animation
                    swipeCountRef.current[transaction.id] = 0;
                    swipeAnimations.current[transaction.id].setValue(0);
                  } else {
                    // Show visual feedback for first swipe
                    Animated.sequence([
                      Animated.timing(swipeAnimations.current[transaction.id], {
                        toValue: -80,
                        duration: 200,
                        useNativeDriver: true
                      }),
                      Animated.timing(swipeAnimations.current[transaction.id], {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true
                      })
                    ]).start();
                    
                    // Reset swipe count after 2 seconds if not swiped again
                    setTimeout(() => {
                      if (swipeCountRef.current[transaction.id] === 1) {
                        swipeCountRef.current[transaction.id] = 0;
                      }
                    }, 2000);
                  }
                } else {
                  // If not swiped far enough, reset position
                  Animated.spring(swipeAnimations.current[transaction.id], {
                    toValue: 0,
                    useNativeDriver: true
                  }).start();
                }
              }
            });
            
            return (
              <Animated.View 
                key={transaction.id} 
                style={[styles.transactionItem, {
                  transform: [{ translateX: swipeAnimations.current[transaction.id] }]
                }]}
                {...panResponder.panHandlers}
              >
                <View style={[styles.transactionIcon, {backgroundColor: transaction.iconBg}]}>
                  <Icon 
                    name={transaction.icon as string} 
                    type="material" 
                    color={transaction.iconColor as string} 
                    size={24} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>{transaction.title}</Text>
                  <View style={styles.transactionCategoryContainer}>
                    <View style={styles.transactionDateBox}>
                      <Text style={styles.transactionCategoryText}>{transaction.date}</Text>
                    </View>
                    <View style={styles.transactionCategoryBox}>
                      <Text style={styles.transactionCategoryText}>{transaction.category}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionRightSection}>
                  <View style={styles.transactionAmountContainer}>
                    <Text style={[transaction.type === 'income' ? styles.transactionAmountPositive : styles.transactionAmountNegative, styles.transactionAmountText]}>
                      {transaction.type === 'income' ? '+ ' : '- '}{currencySymbol}{transaction.amount.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDelete(transaction)}
                  >
                    <Icon name="delete-outline" type="material" color="#FF5252" size={18} />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })}
          
          {/* View All button moved to header */}
        </View>
      </Animated.View>

      <Animated.View 
        style={[
          styles.undoPopup,
          {
            transform: [],
            opacity: popupAnimation,
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 'auto',
            top: 'auto'
          }
        ]}
      >
        {showUndoPopup && (
          <View style={styles.undoPopupContent}>
            <Text style={styles.undoPopupText}>Transaction deleted</Text>
            <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
              <Text style={styles.undoButtonText}>UNDO</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textShadowColor: 'rgba(67, 97, 238, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  balanceCard: {
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
  incomeExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  incomeCard: {
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
  expenseCard: {
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
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#BBBBBB',
  },
  walletIcon: {
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeContainer: {
    flex: 1,
    marginRight: 8,
  },
  expenseContainer: {
    flex: 1,
    marginLeft: 8,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 61, 61, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00C853',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF5252',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionButtons: {
    flexDirection: 'row',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 45, 45, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.3)',
  },
  addButtonText: {
    color: '#4361ee',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    backdropFilter: 'blur(8px)',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDateBox: {
    backgroundColor: '#3D3D3D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  transactionCategoryBox: {
    backgroundColor: '#3D3D3D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  transactionCategoryText: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  transactionRightSection: {
    alignItems: 'flex-end',
  },
  transactionAmountContainer: {
    marginBottom: 4,
  },
  transactionAmountText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionAmountPositive: {
    color: '#4CAF50',
  },
  transactionAmountNegative: {
    color: '#F44336',
  },
  deleteButton: {
    padding: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    marginLeft: 2,
    shadowColor: '#9c6df2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(156, 109, 242, 0.2)',
    backdropFilter: 'blur(8px)',
  },
  viewAllButtonText: {
    color: '#4361ee',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 2,
  },
  undoPopup: {
    position: 'absolute',
    width: 'auto',
    maxWidth: 180,
    backgroundColor: '#323232',
    borderRadius: 8,
    padding: 10,
    zIndex: 9999,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  undoPopupContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoPopupText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  undoButton: {
    marginLeft: 16,
  },
  undoButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HomeTab;