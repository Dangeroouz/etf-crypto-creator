import express from 'express';
import { loginUser, registerUser, verifyUser } from '../controllers/authController.js';
import { validateLogin, validateRegister } from '../middleware/validate.js';
import { verifyToken } from '../services/authService.js';

const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.get('/verify', verifyToken, verifyUser);

export default router;
