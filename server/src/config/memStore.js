import bcrypt from 'bcryptjs';

export const DEMO_USER_ID = '654321098765432109876543';

export const memUsers = [
  {
    _id: DEMO_USER_ID,
    name: 'Avikumar Mishra',
    email: 'demo@finpilot.local',
    passwordHash: bcrypt.hashSync('demo1234', 8)
  }
];

export const memTransactions = [
  { _id: '654321098765432109870001', user: DEMO_USER_ID, title: 'Monthly Salary', amount: 65000, type: 'income', category: 'Salary', date: new Date(), note: 'Monthly earnings' },
  { _id: '654321098765432109870002', user: DEMO_USER_ID, title: 'Apartment Rent', amount: 18000, type: 'expense', category: 'Housing', date: new Date(), note: 'Monthly rent' },
  { _id: '654321098765432109870003', user: DEMO_USER_ID, title: 'Groceries & Supplies', amount: 4500, type: 'expense', category: 'Food & dining', date: new Date(), note: 'Weekly groceries' },
  { _id: '654321098765432109870004', user: DEMO_USER_ID, title: 'Electricity & Internet', amount: 2800, type: 'expense', category: 'Utilities', date: new Date(), note: 'Broadband + power' },
  { _id: '654321098765432109870005', user: DEMO_USER_ID, title: 'Freelance Design', amount: 15000, type: 'income', category: 'Freelance', date: new Date(), note: 'Client project' }
];

export const memBudgets = [
  { _id: '654321098765432109870011', user: DEMO_USER_ID, category: 'Food & dining', limit: 12000, month: new Date().toISOString().slice(0, 7) },
  { _id: '654321098765432109870012', user: DEMO_USER_ID, category: 'Transport', limit: 5000, month: new Date().toISOString().slice(0, 7) },
  { _id: '654321098765432109870013', user: DEMO_USER_ID, category: 'Shopping', limit: 8000, month: new Date().toISOString().slice(0, 7) }
];

export const memGoals = [
  { _id: '654321098765432109870021', user: DEMO_USER_ID, title: 'Emergency Fund', target: 100000, saved: 45000, dueDate: '2027-06-30' },
  { _id: '654321098765432109870022', user: DEMO_USER_ID, title: 'New Laptop', target: 80000, saved: 60000, dueDate: '2026-12-31' }
];
