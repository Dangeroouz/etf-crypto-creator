const makeValidationError = (res, message, details = []) => res.status(400).json({
  error: 'Validation failed',
  message,
  details,
});

const validateRegister = (req, res, next) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return makeValidationError(res, 'Email is invalid');
  }

  if (typeof password !== 'string' || password.length < 8) {
    return makeValidationError(res, 'Password must be at least 8 characters long');
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return makeValidationError(res, 'Email is invalid');
  }

  if (typeof password !== 'string' || password.trim().length === 0) {
    return makeValidationError(res, 'Password is required');
  }

  next();
};

const validateIndexPayload = (req, res, next) => {
  const { name, selected, weights, initialInvestment } = req.body || {};

  if (typeof name !== 'string' || name.trim().length < 1 || name.length > 100) {
    return makeValidationError(res, 'Name is required and must be up to 100 characters');
  }

  if (!Array.isArray(selected) || selected.length < 1) {
    return makeValidationError(res, 'Selected assets must be a non-empty array');
  }

  if (!Array.isArray(weights) || weights.length < 1) {
    return makeValidationError(res, 'Weights must be a non-empty array');
  }

  if (selected.length !== weights.length) {
    return makeValidationError(res, 'Selected assets and weights length must match');
  }

  if (typeof initialInvestment !== 'number' || Number.isNaN(initialInvestment) || initialInvestment <= 0) {
    return makeValidationError(res, 'Initial investment must be a positive number');
  }

  if (weights.some((value) => typeof value !== 'number' || Number.isNaN(value))) {
    return makeValidationError(res, 'Weights must contain only numbers');
  }

  const total = weights.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.001) {
    return makeValidationError(res, 'Weights must sum to 100');
  }

  next();
};

const validateIndexId = (req, res, next) => {
  if (typeof req.params?.indexId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(req.params.indexId)) {
    return makeValidationError(res, 'Invalid index id');
  }

  next();
};

const validateHistoryQuery = (req, res, next) => {
  const { days } = req.query || {};
  const parsedDays = Number(days);

  if (days !== undefined && (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 5000)) {
    return makeValidationError(res, 'Days must be between 1 and 5000');
  }

  next();
};

export {
  validateRegister,
  validateLogin,
  validateIndexPayload,
  validateIndexId,
  validateHistoryQuery,
};
