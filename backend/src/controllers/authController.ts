import { Request, Response } from 'express';
import { authService } from '../services/authService.js'; // Import service layer

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const result = await authService.registerUser(email, password);

    res.status(201).json(result);
  } catch (error: unknown) {
    const err = error as Error;

    if (err.message.includes('already exists')) {
      res.status(400).json({ error: err.message });
      return;
    }

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

    const result = await authService.authenticateUser(email, password);

    res.status(200).json(result);
  } catch (error: unknown) {
    const err = error as Error;

    if (err.message.includes('Invalid')) {
      res.status(400).json({ error: err.message });
      return;
    }

    res.status(500).json({ error: 'Internal server error occurred during login.' });
  }
};
