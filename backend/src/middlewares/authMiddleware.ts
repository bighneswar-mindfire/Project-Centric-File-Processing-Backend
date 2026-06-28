import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { UserModel } from '../database/models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
  };
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const secretString = process.env.JWT_SECRET;

    if (!secretString) {
      res.status(500).json({ error: 'Internal server configuration error: Secret missing.' });
      return;
    }

    const secretKey = new TextEncoder().encode(secretString);

    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];

    if (!token && req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Access denied. Authentication token is missing.' });
      return;
    }

    const { payload } = await jwtVerify(token, secretKey);

    const email = payload.email as string;
    if (!email) {
      res.status(401).json({ error: 'Access denied. Invalid token payload.' });
      return;
    }

    const userExists = await UserModel.exists({ email });
    if (!userExists) {
      res.status(401).json({ error: 'Access denied. User no longer exists.' });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = { email };

    next();
  } catch {
    res.status(401).json({ error: 'Access denied. Token has expired or is invalid.' });
  }
};
