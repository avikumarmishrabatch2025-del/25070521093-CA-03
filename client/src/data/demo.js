const pad = value => String(value).padStart(2, '0');
const monthKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
const dateInMonth = (offset, day) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return `${monthKey(date)}-${pad(Math.min(day, 28))}`;
};

export function createDemoData() {
  const rows = [
    ['Monthly salary', 5200, 'income', 'Salary', 0, 2],
    ['Apartment rent', 1450, 'expense', 'Housing', 0, 3],
    ['Grocery market', 126.4, 'expense', 'Food & dining', 0, 5],
    ['Metro card', 42, 'expense', 'Transport', 0, 7],
    ['Freelance project', 680, 'income', 'Freelance', 0, 9],
    ['Dinner with friends', 74.8, 'expense', 'Food & dining', 0, 12],
    ['Electricity bill', 92.15, 'expense', 'Utilities', 0, 15],
    ['Bookstore', 38.5, 'expense', 'Shopping', 0, 18],
    ['Monthly salary', 5200, 'income', 'Salary', -1, 2],
    ['Apartment rent', 1450, 'expense', 'Housing', -1, 3],
    ['Weekend groceries', 143.2, 'expense', 'Food & dining', -1, 6],
    ['Fuel station', 61.3, 'expense', 'Transport', -1, 10],
    ['Streaming subscription', 15.99, 'expense', 'Entertainment', -1, 13],
    ['Monthly salary', 5200, 'income', 'Salary', -2, 2],
    ['Apartment rent', 1450, 'expense', 'Housing', -2, 3],
    ['Family dinner', 108.75, 'expense', 'Food & dining', -2, 8],
    ['Train tickets', 86, 'expense', 'Transport', -2, 16],
    ['Monthly salary', 5000, 'income', 'Salary', -3, 2],
    ['Apartment rent', 1400, 'expense', 'Housing', -3, 3],
    ['Dental checkup', 120, 'expense', 'Health', -3, 11],
    ['Monthly salary', 5000, 'income', 'Salary', -4, 2],
    ['Apartment rent', 1400, 'expense', 'Housing', -4, 3],
    ['New headphones', 189, 'expense', 'Shopping', -4, 14],
    ['Monthly salary', 5000, 'income', 'Salary', -5, 2],
    ['Apartment rent', 1400, 'expense', 'Housing', -5, 3],
    ['Groceries and supplies', 154.25, 'expense', 'Food & dining', -5, 9]
  ];
  const transactions = rows.map((row, index) => ({
    _id: `demo-${index + 1}`,
    title: row[0], amount: row[1], type: row[2], category: row[3], date: dateInMonth(row[4], row[5]),
    note: 'Sample demo record'
  })).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const income = transactions.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  return {
    transactions,
    totals: { income, expenses, balance: income - expenses },
    budgets: [
      { _id: 'demo-budget-1', category: 'Food & dining', limit: 500, month: monthKey(new Date()) },
      { _id: 'demo-budget-2', category: 'Transport', limit: 220, month: monthKey(new Date()) },
      { _id: 'demo-budget-3', category: 'Shopping', limit: 250, month: monthKey(new Date()) }
    ],
    goals: [
      { _id: 'demo-goal-1', title: 'Emergency fund', target: 10000, saved: 6400, dueDate: dateInMonth(8, 20) },
      { _id: 'demo-goal-2', title: 'Japan trip', target: 3500, saved: 1470, dueDate: dateInMonth(6, 12) },
      { _id: 'demo-goal-3', title: 'New laptop', target: 2200, saved: 1980, dueDate: dateInMonth(2, 5) }
    ]
  };
}

export const demoUser = { name: 'Demo Explorer', email: 'demo@finpilot.local' };
