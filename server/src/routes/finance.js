import { Router } from 'express';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(500);
    const budgets = await Budget.find({ user: req.userId }).sort({ month: -1, category: 1 });
    const goals = await Goal.find({ user: req.userId }).sort({ createdAt: -1 });
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    res.json({ transactions, budgets, goals, totals: { income, expenses, balance: income - expenses } });
  } catch (error) { next(error); }
});

router.get('/budgets', async (req, res, next) => {
  try { res.json(await Budget.find({ user: req.userId }).sort({ month: -1 })); }
  catch (error) { next(error); }
});
router.post('/budgets', async (req, res, next) => {
  try {
    const category = String(req.body.category || '').trim();
    const limit = Number(req.body.limit);
    const month = String(req.body.month || '');
    if (!category) return res.status(400).json({ message: 'Category is required.' });
    if (!Number.isFinite(limit) || limit <= 0) return res.status(400).json({ message: 'Budget limit must be greater than zero.' });
    if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ message: 'Choose a valid month.' });
    const budget = await Budget.findOneAndUpdate(
      { user: req.userId, category, month }, { $set: { limit } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(budget);
  } catch (error) { next(error); }
});
router.delete('/budgets/:id', async (req, res, next) => {
  try {
    const row = await Budget.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!row) return res.status(404).json({ message: 'Budget not found.' });
    res.json({ message: 'Budget deleted.' });
  } catch (error) { next(error); }
});

router.get('/goals', async (req, res, next) => {
  try { res.json(await Goal.find({ user: req.userId }).sort({ createdAt: -1 })); }
  catch (error) { next(error); }
});
router.post('/goals', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim();
    const target = Number(req.body.target);
    const saved = Number(req.body.saved || 0);
    if (title.length < 2) return res.status(400).json({ message: 'Goal title must be at least 2 characters.' });
    if (!Number.isFinite(target) || target <= 0) return res.status(400).json({ message: 'Target must be greater than zero.' });
    if (!Number.isFinite(saved) || saved < 0 || saved > target) return res.status(400).json({ message: 'Saved amount must be between zero and the target.' });
    const goal = await Goal.create({ user: req.userId, title, target, saved, dueDate: req.body.dueDate || null });
    res.status(201).json(goal);
  } catch (error) { next(error); }
});
router.patch('/goals/:id', async (req, res, next) => {
  try {
    const saved = Number(req.body.saved);
    if (!Number.isFinite(saved) || saved < 0) return res.status(400).json({ message: 'Saved amount must be zero or more.' });
    const goal = await Goal.findOne({ _id: req.params.id, user: req.userId });
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });
    if (saved > goal.target) return res.status(400).json({ message: 'Saved amount cannot exceed target.' });
    goal.saved = saved; await goal.save(); res.json(goal);
  } catch (error) { next(error); }
});
router.delete('/goals/:id', async (req, res, next) => {
  try {
    const row = await Goal.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!row) return res.status(404).json({ message: 'Goal not found.' });
    res.json({ message: 'Goal deleted.' });
  } catch (error) { next(error); }
});

export default router;
