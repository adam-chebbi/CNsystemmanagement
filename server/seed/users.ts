import { db } from '../db/connection.js';

export const seedUsers = (): void => {
  db.prepare('INSERT INTO users (id, full_name, cin, created_at) VALUES (?, ?, ?, ?)').run(
    'user-1',
    'Adam CHEBBI',
    '12345678',
    new Date().toISOString()
  );
};
