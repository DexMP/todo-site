import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Placeholder for database interactions - replace with actual DB calls later
export const usersDB: any[] = []; // In-memory store for now // EXPORTED for project controller

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable in production

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    // 2. Check if user already exists (placeholder)
    const existingUser = usersDB.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Store the new user (placeholder)
    const newUser = {
      id: usersDB.length + 1, // simple id generation for now
      username,
      email,
      password_hash,
      created_at: new Date(),
      updated_at: new Date(),
    };
    usersDB.push(newUser);

    // 5. Return a success message or JWT token
    // For now, just a success message. Later, generate and return JWT.
    res.status(201).json({ message: 'User registered successfully', userId: newUser.id });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 2. Find the user by email (placeholder)
    const user = usersDB.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }

    // 3. Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials - password mismatch' });
    }

    // 4. If valid, generate a JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    // 5. Return the token
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

export const logout = (req: Request, res: Response) => {
  // For JWT, logout is primarily handled client-side by deleting the token.
  // Server-side, you might implement token blacklisting if needed.
  res.status(200).json({ message: 'Logout successful (client should clear token)' });
};
