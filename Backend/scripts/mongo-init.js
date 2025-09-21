// MongoDB initialization script for BreakIn database

// Create application database
db = db.getSiblingDB('breakin');

// Create application user
db.createUser({
  user: 'breakin_user',
  pwd: 'breakin_password',
  roles: [
    {
      role: 'readWrite',
      db: 'breakin'
    }
  ]
});

// Create initial collections with some basic indexes
db.createCollection('users');
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'pseudonym': 1 }, { unique: true });

db.createCollection('sprints');
db.sprints.createIndex({ 'status': 1 });
db.sprints.createIndex({ 'created_at': 1 });

db.createCollection('scores');
db.scores.createIndex({ 'user_pseudonym': 1, 'sprint_id': 1 }, { unique: true });

db.createCollection('feedback');
db.feedback.createIndex({ 'sprint_id': 1 });
db.feedback.createIndex({ 'created_at': 1 });

db.createCollection('submissions');
db.submissions.createIndex({ 'sprint_id': 1 });
db.submissions.createIndex({ 'user_id': 1 });

print('BreakIn database initialized successfully!');