/* eslint-disable no-console */
import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { UserModel } from '../database/models/User.js';

//hash password
const hashPassword = (password: string, salt: string): string => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    //check if user exists
    const userExists = await UserModel.exists({ email });
    if (userExists) {
      res.status(400).json({ error: 'User with this email already exists.' });
      return;
    }

    //salt and hash the password
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newUser = new UserModel({
      email,
      passwordHash,
      salt,
    });

    await newUser.save();

    //session token
    const token =
      crypto.randomUUID() + '.' + Buffer.from(JSON.stringify({ email })).toString('base64');

    res.status(201).json({
      token,
      user: {
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Error inside signup controller:', error);
    res.status(500).json({ error: 'Internal server error occurred during signup.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    //verify password hash
    const targetHash = hashPassword(password, user.salt);
    if (user.passwordHash !== targetHash) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    //session token
    const token =
      crypto.randomUUID() + '.' + Buffer.from(JSON.stringify({ email })).toString('base64');

    res.status(200).json({
      token,
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error inside login controller:', error);
    res.status(500).json({ error: 'Internal server error occurred during login.' });
  }
};
