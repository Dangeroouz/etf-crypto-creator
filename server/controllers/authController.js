import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isDatabaseReady } from '../config/database.js';
import User from '../models/User.js';
import { normalizeEmail } from '../utils/normalize.js';
import { getJwtSecret } from '../services/authService.js';

export async function registerUser(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const createdUser = await User.create({ email: normalizedEmail, password: hashedPassword });

    const token = jwt.sign(
      { userId: createdUser._id, email: createdUser.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: createdUser._id.toString(), email: createdUser.email },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyUser(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user: { id: user._id.toString(), email: user.email } });
  } catch (error) {
    next(error);
  }
}
