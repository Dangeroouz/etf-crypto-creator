import express from 'express';
import {
  createIndex,
  deleteIndex,
  getIndexById,
  getIndices,
  updateIndex,
} from '../controllers/indexController.js';
import { validateIndexId, validateIndexPayload } from '../middleware/validate.js';
import { verifyToken } from '../services/authService.js';

const router = express.Router();

router.post('/', verifyToken, validateIndexPayload, createIndex);
router.get('/', verifyToken, getIndices);
router.get('/:indexId', verifyToken, validateIndexId, getIndexById);
router.put('/:indexId', verifyToken, validateIndexId, validateIndexPayload, updateIndex);
router.delete('/:indexId', verifyToken, validateIndexId, deleteIndex);

export default router;
