// Define transaction interface
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}