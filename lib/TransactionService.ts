import { supabase } from './supabase'
import { Transaction } from './types'

// Get all transactions for the current user
export const getTransactions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('deleted', false)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: transactions, error: null };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { data: null, error };
  }
};

// Create a new transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          title: transaction.title,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          date: transaction.date,
          icon: transaction.icon,
          icon_color: transaction.iconColor,
          icon_bg: transaction.iconBg,
          user_id: user.id,
          deleted: false // Initialize as not deleted
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating transaction:', error);
    return { data: null, error };
  }
}

// Delete a transaction (soft delete)
export const deleteTransaction = async (id: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return { error: new Error('No authenticated user found') };
    }

    console.log('Attempting to delete transaction:', { id, userId: user.id });
    
    // Update the deleted flag
    const { data, error } = await supabase
      .from('transactions')
      .update({ deleted: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return { error };
    }

    if (!data || data.length === 0) {
      console.error('Transaction not found or unauthorized');
      return { error: new Error('Transaction not found or unauthorized') };
    }

    console.log('Transaction marked as deleted:', id);
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error marking transaction as deleted:', error);
    return { error };
  }
};

// Update a transaction
export const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        title: updates.title,
        amount: updates.amount,
        type: updates.type,
        category: updates.category,
        date: updates.date,
        icon: updates.icon,
        icon_color: updates.iconColor,
        icon_bg: updates.iconBg
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating transaction:', error)
    return { data: null, error }
  }
}

// Undo a deleted transaction
export const undoTransaction = async (id: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: new Error('No authenticated user found') };
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({ deleted: false })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      return { error };
    }

    if (!data || data.length === 0) {
      return { error: new Error('Transaction not found or unauthorized') };
    }

    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error undoing transaction deletion:', error);
    return { error };
  }
};

export const subscribeToTransactions = (callback: (payload: any) => void) => {
  const user = supabase.auth.getUser();
  if (!user) return null;

  const subscription = supabase
    .channel('transactions_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions'
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return subscription;
};