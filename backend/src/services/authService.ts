import bcrypt from 'bcrypt';
import { query } from '../db/pool';
import { CreateUserDTO, LoginDTO, User } from '../types';
import { generateToken } from '../middleware/auth';

const SALT_ROUNDS = 10;

export class AuthService {
  async register(dto: CreateUserDTO) {
    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [dto.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, avatar_url, created_at`,
      [dto.email, passwordHash, dto.full_name]
    );

    const user = result.rows[0];
    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      token,
    };
  }

  async login(dto: LoginDTO) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [dto.email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({ userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const result = await query(
      'SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}
