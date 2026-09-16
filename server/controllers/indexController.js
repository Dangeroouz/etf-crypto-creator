import { isDatabaseReady } from '../config/database.js';
import Index from '../models/Index.js';

function transformIndex(index) {
  return {
    id: index._id.toString(),
    userId: index.userId.toString(),
    name: index.name,
    selected: index.selected,
    weights: index.weights,
    initialInvestment: index.initialInvestment,
    createdAt: index.createdAt,
    updatedAt: index.updatedAt,
  };
}

export async function createIndex(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Index service unavailable' });
    }

    const { name, selected, weights, initialInvestment } = req.body;

    const createdIndex = await Index.create({
      userId: req.userId,
      name,
      selected,
      weights,
      initialInvestment,
    });

    res.status(201).json({
      message: 'Index created successfully',
      index: transformIndex(createdIndex),
    });
  } catch (error) {
    next(error);
  }
}

export async function getIndices(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Index service unavailable' });
    }

    const indices = await Index.find({ userId: req.userId });
    res.json(indices.map(transformIndex));
  } catch (error) {
    next(error);
  }
}

export async function getIndexById(req, res, next) {
  try {
    const { indexId } = req.params;
    const index = await Index.findOne({ _id: indexId, userId: req.userId });

    if (!index) {
      return res.status(404).json({ error: 'Index not found' });
    }

    res.json(transformIndex(index));
  } catch (error) {
    next(error);
  }
}

export async function updateIndex(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Index service unavailable' });
    }

    const { indexId } = req.params;
    const { name, selected, weights, initialInvestment } = req.body;

    const updatedIndex = await Index.findOneAndUpdate(
      { _id: indexId, userId: req.userId },
      { name, selected, weights, initialInvestment },
      { new: true, runValidators: true }
    );

    if (!updatedIndex) {
      return res.status(404).json({ error: 'Index not found' });
    }

    res.json({
      message: 'Index updated successfully',
      index: transformIndex(updatedIndex),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteIndex(req, res, next) {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Index service unavailable' });
    }

    const { indexId } = req.params;
    const deletedIndex = await Index.findOneAndDelete({ _id: indexId, userId: req.userId });

    if (!deletedIndex) {
      return res.status(404).json({ error: 'Index not found' });
    }

    res.json({
      message: 'Index deleted successfully',
      index: transformIndex(deletedIndex),
    });
  } catch (error) {
    next(error);
  }
}
