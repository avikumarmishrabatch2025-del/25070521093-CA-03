import { Router } from 'express';
import Transaction from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const rows = await Transaction.find({ user: req.userId }).sort({ date: -1 }).limit(250);
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
    const transaction = await Transaction.create({
      user: req.userId, title: String(title).trim(), amount: Number(amount), type,
      category: String(category).trim(), date: date ? new Date(date) : new Date(), note: String(note || '').slice(0, 300)
    });
    res.status(201).json(transaction);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!deleted) return res.status(404).json({ message: 'Transaction not found.' });
    res.json({ message: 'Transaction deleted.' });
  } catch (error) { next(error); }
});

export default router;
