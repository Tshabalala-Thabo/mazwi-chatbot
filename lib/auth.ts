import { getDb } from './db';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  name: string;
  email: string;
  tenant_id: number;
}

export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  try {
    const db = getDb();
    
    // For demo purposes, we'll accept any user from the database with a simple password check
    // In production, you'd have proper password hashing
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
    
    if (!user) {
      return null;
    }
    
    // For demo: accept "password" or "demo123" as valid passwords
    if (password === 'password' || password === 'demo123') {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        tenant_id: user.tenant_id
      };
    }
    
    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function getUserById(id: number): User | null {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
    return user || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
