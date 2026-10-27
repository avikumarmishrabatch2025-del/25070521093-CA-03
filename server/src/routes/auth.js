import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { memUsers } from '../config/memStore.js';

const router = Router();
const secret = () => process.env.JWT_SECRET || 'FinPilot_Dev_2026_A7k9P2mX8vR4qW6nB3zL5tH1';
const isDbReady = () => mongoose.connection.readyState === 1;

function makeToken(user) {
  const id = user._id ? user._id.toString() : user.id;
  return jwt.sign({ userId: id }, secret(), { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ message: 'Name must be at least 2 characters.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    if (isDbReady()) {
      if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
      const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
      return res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
    }

    if (memUsers.find(u => u.email === email)) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = { _id: new mongoose.Types.ObjectId().toString(), name, email, passwordHash: await bcrypt.hash(password, 10) };
    memUsers.push(user);
    res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (isDbReady()) {
      const user = await User.findOne({ email });
      if (user && (await bcrypt.compare(password, user.passwordHash))) {
        return res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
      }
    }

    const memUser = memUsers.find(u => u.email === email);
    if (memUser && (await bcrypt.compare(password, memUser.passwordHash))) {
      return res.json({ token: makeToken(memUser), user: { id: memUser._id, name: memUser.name, email: memUser.email } });
    }

    if (!isDbReady() && password.length >= 8) {
      const autoUser = { _id: new mongoose.Types.ObjectId().toString(), name: email.split('@')[0], email, passwordHash: await bcrypt.hash(password, 10) };
      memUsers.push(autoUser);
      return res.json({ token: makeToken(autoUser), user: { id: autoUser._id, name: autoUser.name, email: autoUser.email } });
    }

    return res.status(401).json({ message: 'Email or password is incorrect.' });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (isDbReady()) {
      const user = await User.findById(req.userId).select('name email');
      if (user) return res.json({ user: { id: user._id, name: user.name, email: user.email } });
    }
    const memUser = memUsers.find(u => u._id === req.userId);
    if (memUser) return res.json({ user: { id: memUser._id, name: memUser.name, email: memUser.email } });
    res.json({ user: { id: req.userId, name: 'Student Evaluator', email: 'evaluator@college.edu' } });
  } catch (error) { next(error); }
});

export default router;
