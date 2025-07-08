import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Icon } from '@rneui/themed';
import { BlurView } from 'expo-blur';
import { createTransaction } from '../lib/TransactionService';

// Define transaction categories with their icons and colors
const CATEGORIES = {
  income: [
    { id: 'salary', name: 'Salary', icon: 'account-balance', color: '#00C853', bgColor: '#E0FFE0' },
    { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#2196F3', bgColor: '#E0F7FF' },
    { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#7B68EE', bgColor: '#E0E0FF' },
    { id: 'gift', name: 'Gift', icon: 'card-giftcard', color: '#FF4081', bgColor: '#FFE0F0' },
    { id: 'other_income', name: 'Other', icon: 'attach-money', color: '#FF9800', bgColor: '#FFF3E0' },
  ],
  expense: [
    { id: 'food', name: 'Food & Dining', icon: 'restaurant', color: '#FFC107', bgColor: '#FFF8E0' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#7B68EE', bgColor: '#E0E0FF' },
    { id: 'transport', name: 'Transportation', icon: 'directions-car', color: '#2196F3', bgColor: '#E0F7FF' },
    { id: 'entertainment', name: 'Entertainment', icon: 'movie', color: '#E91E63', bgColor: '#FFE0EB' },
    { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#FF5722', bgColor: '#FFE0E0' },
    { id: 'health', name: 'Health', icon: 'healing', color: '#00BCD4', bgColor: '#E0FAFF' },
    { id: 'education', name: 'Education', icon: 'school', color: '#9C27B0', bgColor: '#F3E0FF' },
    { id: 'travel', name: 'Travel', icon: 'flight', color: '#4CAF50', bgColor: '#E0FFE5' },
    { id: 'other_expense', name: 'Other', icon: 'attach-money', color: '#FF9800', bgColor: '#FFF3E0' },
  ]
};

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (transaction: {
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    icon: string;
    iconColor: string;
    iconBg: string;
  }) => void;
}

export default function TransactionModal({ visible, onClose, onSave }: TransactionModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [icon, setIcon] = useState('');
  const [iconColor, setIconColor] = useState('');
  const [iconBg, setIconBg] = useState('');
  
  // Reset form when modal is opened
  useEffect(() => {
    if (visible) {
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory('');
      setCategoryName('');
      setIcon('');
      setIconColor('');
      setIconBg('');
    }
  }, [visible]);
  
  // Handle category selection
  const handleCategorySelect = (cat: { id: string; name: string; icon: string; color: string; bgColor: string }) => {
    setCategory(cat.id);
    setCategoryName(cat.name);
    setIcon(cat.icon);
    setIconColor(cat.color);
    setIconBg(cat.bgColor);
  };
  
  // Handle save transaction
  const handleSave = async () => {
    // Validate inputs
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!category) {
      alert('Please select a category');
      return;
    }
    
    // Create new transaction object
    const newTransaction = {
      title: title.trim(),
      amount: Number(amount),
      type,
      category: categoryName,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }),
      icon,         
      iconColor,    
      iconBg,       
      deleted: false
    };
    
    // Save transaction using TransactionService
    const { data, error } = await createTransaction(newTransaction);
    if (error) {
      alert('Error creating transaction');
      console.error('Error creating transaction:', error);
      return;
    }
    
    // Save transaction
    if (data) {
      onSave(data);
    }
    
    // Reset form and close modal
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('');
    setCategoryName('');
    setIcon('');
    setIconColor('');
    setIconBg('');
    onClose();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <BlurView intensity={10} tint="light" style={styles.blurContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" type="material" color="#333" size={24} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => setType('expense')}
              >
                <Icon name="trending-down" type="material" color={type === 'expense' ? '#fff' : '#FF5252'} size={20} />
                <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>Expense</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeButton, type === 'income' && styles.typeButtonActive, type === 'income' && styles.incomeButton]}
                onPress={() => setType('income')}
              >
                <Icon name="trending-up" type="material" color={type === 'income' ? '#fff' : '#00C853'} size={20} />
                <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter title"
                value={title}
                onChangeText={setTitle}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            
            <Text style={styles.categoryLabel}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES[type].map((cat) => (
                <TouchableOpacity 
                  key={cat.id}
                  style={[styles.categoryItem, category === cat.id && styles.categoryItemSelected]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.bgColor }]}>
                    <Icon name={cat.icon} type="material" color={cat.color} size={24} />
                  </View>
                  <Text style={styles.categoryText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(67, 97, 238, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeButton: {
    padding: 5,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#444444',
  },
  typeButtonActive: {
    backgroundColor: '#FF5252',
  },
  incomeButton: {
    backgroundColor: '#00C853',
  },
  typeButtonText: {
    marginLeft: 8,
    fontWeight: '500',
    color: '#cccccc',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#444444',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
  },
  categoriesContainer: {
    maxHeight: 120,
    marginBottom: 20,
  },
  categoriesContent: {
    paddingBottom: 8,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(67, 97, 238, 0.2)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 2,
    borderColor: '#4361ee',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4361ee',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(67, 97, 238, 0.6)',
    shadowColor: '#4361ee',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
});