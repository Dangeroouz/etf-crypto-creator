import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'development-secret-change-me';
}

export async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.userId = new mongoose.Types.ObjectId(decoded.userId);
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
