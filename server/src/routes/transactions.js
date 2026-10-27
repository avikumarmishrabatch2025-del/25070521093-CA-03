import { Router } from 'express';
import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';
import { memTransactions, memUsers } from '../config/memStore.js';

const router = Router();
router.use(requireAuth);
const isDbReady = () => mongoose.connection.readyState === 1;
const shouldUseMem = (userId) => !isDbReady() || memUsers.some(u => u._id === userId);

router.get('/', async (req, res, next) => {
  try {
    if (!shouldUseMem(req.userId)) {
      return res.json(await Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(250));
    }
    const rows = memTransactions.filter(t => t.user === req.userId || memUsers.some(u => u._id === t.user))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, amount, type, category, date, note } = req.body;
    if (!String(title || '').trim()) return res.status(400).json({ message: 'Transaction title is required.' });
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ message: 'Amount must be greater than zero.' });
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ message: 'Choose income or expense.' });
    if (!String(category || '').trim()) return res.status(400).json({ message: 'Category is required.' });

    if (!shouldUseMem(req.userId)) {
      const transaction = await Transaction.create({
        user: req.userId, title: String(title).trim(), amount: Number(amount), type,
        category: String(category).trim(), date: date ? new Date(date) : new Date(), note: String(note || '').slice(0, 300)
      });
      return res.status(201).json(transaction);
    }

    const memItem = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: req.userId, title: String(title).trim(), amount: Number(amount), type,
      category: String(category).trim(), date: date ? new Date(date) : new Date(), note: String(note || '').slice(0, 300)
    };
    memTransactions.unshift(memItem);
    res.status(201).json(memItem);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!shouldUseMem(req.userId)) {
      const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
      if (!deleted) return res.status(404).json({ message: 'Transaction not found.' });
      return res.json({ message: 'Transaction deleted.' });
    }
    const idx = memTransactions.findIndex(t => t._id === req.params.id);
    if (idx !== -1) memTransactions.splice(idx, 1);
    res.json({ message: 'Transaction deleted.' });
  } catch (error) { next(error); }
});

export default router;
