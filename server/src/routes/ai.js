import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req, res, next) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) return res.status(400).json({ message: 'Type a question first.' });
    const [transactions, budgets, goals] = await Promise.all([
      Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(300),
      Budget.find({ user: req.userId }),
      Goal.find({ user: req.userId })
    ]);
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const categories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => categories[t.category] = (categories[t.category] || 0) + t.amount);
    const top = Object.entries(categories).sort((a,b) => b[1]-a[1])[0];
    let answer = `Based on your recorded data, total income is ₹${income.toFixed(2)} and total expenses are ₹${expenses.toFixed(2)}. Your recorded net is ₹${(income-expenses).toFixed(2)}. `;
    if (top) answer += `Your largest expense category is ${top[0]} (₹${top[1].toFixed(2)}). `;
    if (expenses > income) answer += 'Your recorded expenses are higher than income. Review recurring costs and set a realistic spending limit before increasing discretionary spending. ';
    else if (income > 0) answer += `Your recorded expenses are ${(expenses/income*100).toFixed(0)}% of income. Consider directing part of the remaining amount toward an emergency fund or a savings goal. `;
    if (budgets.length) answer += `You have ${budgets.length} budget item(s) configured. Compare current-month category spending against each limit. `;
    if (goals.length) answer += `You are tracking ${goals.length} savings goal(s). `;
    if (process.env.AI_API_KEY) {
      try {
        const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
        const response = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
          body: JSON.stringify({
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are FinPilot, a cautious personal finance education assistant. Use only the user-provided financial summary, be clear this is educational not professional financial advice, and do not claim bank connectivity.' },
              { role: 'user', content: `Question: ${message}\nRecorded financial summary: income ₹${income.toFixed(2)}, expenses ₹${expenses.toFixed(2)}, net ₹${(income-expenses).toFixed(2)}, expense categories ${JSON.stringify(categories)}, budgets ${budgets.length}, goals ${goals.length}` }
            ],
            temperature: 0.4
          })
        });
        if (response.ok) {
          const data = await response.json();
          answer = data.choices?.[0]?.message?.content || answer;
        }
      } catch { /* retain local fallback if the provider is unavailable */ }
    } else {
      answer = `You asked: “${message}”\n\n${answer}\n\nThis is a rule-based insight from your saved transactions. Add an AI provider key in server/.env if you want provider-powered responses.`;
    }
    res.json({ answer });
  } catch (error) { next(error); }
});

export default router;
