// Initialize MongoDB database and users
db = db.getSiblingDB('etf-crypto');

// Create application user for etf-crypto database
db.createUser({
  user: 'change-me-user',
  pwd: 'change-me-password',
  roles: [
    {
      role: 'readWrite',
      db: 'etf-crypto'
    }
  ]
});

// Create initial collections (optional, but ensures they exist)
db.createCollection('users');
db.createCollection('portfolios');
db.createCollection('transactions');

print('Database etf-crypto initialized with a sample app user. Update credentials in your local environment before production use.');
