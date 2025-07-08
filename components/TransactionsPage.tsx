import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, ScrollView, PanResponder, PanResponderInstance, FlatList, Alert, Modal } from 'react-native';
import { Icon } from '@rneui/themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteTransaction, undoTransaction } from '../lib/TransactionService';
import { Transaction } from '../lib/types';

interface TransactionsPageProps {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  setExpense: (expense: number) => void;
  setBalance: (balance: number) => void;
  setIncome: (income: number) => void;
  expense: number;
  balance: number;
  income: number;
  loading: boolean;
}

const TransactionsPage = ({
  fadeAnim,
  slideAnim,
  transactions,
  setTransactions,
  setExpense,
  setBalance,
  setIncome,
  expense,
  balance,
  income
}: TransactionsPageProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'year' | 'all'>('all');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
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

  const filteredTransactions = transactions.filter(t => {
    if (filterMode === 'all' || !selectedDate) return true;
    
    try {
      // Parse the transaction date string into a Date object
      // Handle both old format (DD/MM/YYYY) and new format (MMM DD, YYYY)
      let transactionDate;
      
      if (t.date.includes('/')) {
        // Old format: DD/MM/YYYY
        const dateParts = t.date.split('/');
        if (dateParts.length !== 3) return false;
        
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1;
        const year = parseInt(dateParts[2]);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
        
        transactionDate = new Date(year, month, day);
      } else {
        // New format: MMM DD, YYYY (from toLocaleDateString)
        transactionDate = new Date(t.date);
        
        // If parsing failed, return false
        if (isNaN(transactionDate.getTime())) {
          console.error('Failed to parse date:', t.date);
          return false;
        }
      }
      
      if (filterMode === 'day') {
        return (
          transactionDate.getDate() === selectedDate.getDate() &&
          transactionDate.getMonth() === selectedDate.getMonth() &&
          transactionDate.getFullYear() === selectedDate.getFullYear()
        );
      } else if (filterMode === 'month') {
        return (
          transactionDate.getMonth() === selectedDate.getMonth() && 
          transactionDate.getFullYear() === selectedDate.getFullYear()
        );
      } else if (filterMode === 'year') {
        return transactionDate.getFullYear() === selectedDate.getFullYear();
      }
    } catch (error) {
      console.error('Error parsing date:', t.date, error);
      return false;
    }
    
    return true;
  });



  return (
    <View style={{flex: 1, backgroundColor: '#000000'}}>
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>      
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" type="material" color="#ffffff" size={24} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>All Transactions</Text>
        </View>
        
        <View style={styles.filterContainer}>
          <View style={styles.filterModeContainer}>
            <TouchableOpacity 
              style={[styles.filterModeButton, filterMode === 'all' && styles.filterModeButtonActive]}
              onPress={() => {
                setFilterMode('all');
                setSelectedDate(null);
              }}
            >
              <Text style={styles.filterModeButtonText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterModeButton, filterMode === 'day' && styles.filterModeButtonActive]}
              onPress={() => setFilterMode('day')}
            >
              <Text style={styles.filterModeButtonText}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterModeButton, filterMode === 'month' && styles.filterModeButtonActive]}
              onPress={() => setFilterMode('month')}
            >
              <Text style={styles.filterModeButtonText}>Month</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterModeButton, filterMode === 'year' && styles.filterModeButtonActive]}
              onPress={() => setFilterMode('year')}
            >
              <Text style={styles.filterModeButtonText}>Year</Text>
            </TouchableOpacity>
          </View>
          
          {filterMode !== 'all' && (
            <TouchableOpacity 
              style={[styles.datePickerButton, selectedDate && styles.datePickerButtonActive]}
              onPress={() => setShowCalendar(true)}
            >
              <Icon name="calendar-today" type="material" color="#FFFFFF" size={16} style={styles.calendarIcon} />
              <Text style={styles.datePickerButtonText}>
                {selectedDate ? selectedDate.toLocaleDateString() : `Select ${filterMode}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          style={styles.transactionsList}
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={true}
          renderItem={({ item: transaction }) => {
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
                    {/* Delete button is still here but can be removed if not needed */}
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDelete(transaction)}
                    >
                      <Icon name="delete-outline" type="material" color="#FF5252" size={18} />
                    </TouchableOpacity>
                  </View>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.noTransactionsContainer}>
              <Text style={styles.noTransactionsText}>No transactions found</Text>
            </View>
          }
        />
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

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.calendarContainer}>
          <View style={styles.calendarContent}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date</Text>
              <TouchableOpacity 
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <Icon name="close" type="material" color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarNavigation}>
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCalendarDate(newDate);
                }}
              >
                <Icon name="chevron-left" type="material" color="#FFFFFF" size={24} />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthYear}>
                {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => {
                  const newDate = new Date(calendarDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCalendarDate(newDate);
                }}
              >
                <Icon name="chevron-right" type="material" color="#FFFFFF" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
              
              {(() => {
                const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1);
                const lastDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const days = [];
                for (let i = 0; i < 42; i++) {
                  const currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + i);
                  const isCurrentMonth = currentDate.getMonth() === calendarDate.getMonth();
                  const isToday = currentDate.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && currentDate.toDateString() === selectedDate.toDateString();
                  
                  days.push(
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.calendarDay,
                        !isCurrentMonth && styles.calendarDayInactive,
                        isToday && styles.calendarDayToday,
                        isSelected && styles.calendarDaySelected
                      ]}
                      onPress={() => {
                        if (isCurrentMonth) {
                          setSelectedDate(new Date(currentDate));
                          setShowCalendar(false);
                        }
                      }}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        !isCurrentMonth && styles.calendarDayTextInactive,
                        isToday && styles.calendarDayTextToday,
                        isSelected && styles.calendarDayTextSelected
                      ]}>
                        {currentDate.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                }
                return days;
              })()}
            </View>
            
            <View style={styles.calendarActions}>
              <TouchableOpacity 
                style={styles.calendarActionButton}
                onPress={() => {
                  setSelectedDate(new Date());
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.calendarActionButtonText}>Today</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.calendarClearButton}
                onPress={() => {
                  setSelectedDate(null);
                  setShowCalendar(false);
                }}
              >
                <Text style={styles.calendarClearButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D2D2D',
    paddingTop: 40, // Add padding to avoid status bar overlap
  },
  backButton: {
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#2D2D2D',
    zIndex: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#3D3D3D',
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#3D3D3D',
    marginBottom: 8,
  },
  datePickerButtonActive: {
    backgroundColor: '#4361ee',
  },
  calendarIcon: {
    marginRight: 8,
  },
  datePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterModeContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  filterModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#3D3D3D',
  },
  filterModeButtonActive: {
    backgroundColor: '#4361ee',
  },
  filterModeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContent: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 350,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calendarCloseButton: {
    padding: 4,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    color: '#BBBBBB',
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  calendarDayInactive: {
    opacity: 0.3,
  },
  calendarDayToday: {
    backgroundColor: '#007AFF',
  },
  calendarDaySelected: {
    backgroundColor: '#4361ee',
  },
  calendarDayText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  calendarDayTextInactive: {
    color: '#666666',
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  calendarActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarClearButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  calendarClearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    alignItems: 'center',
    backgroundColor: '#000000',
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
  noTransactionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noTransactionsText: {
    color: '#BBBBBB',
    fontSize: 16,
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
    bottom: 80, // Moved higher from the bottom
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

export default TransactionsPage;