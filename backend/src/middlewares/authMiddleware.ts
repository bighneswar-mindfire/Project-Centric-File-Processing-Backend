import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { UserModel } from '../database/models/User.js';

const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access denied. Authentication token is missing.' });
      return;
    }

    //verify token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const email = payload.email as string;
    if (!email) {
      res.status(401).json({ error: 'Access denied. Invalid token payload.' });
      return;
    }

    //verify the user exists in database
    const userExists = await UserModel.exists({ email });
    if (!userExists) {
      res.status(401).json({ error: 'Access denied. User no longer exists.' });
      return;
    }

    //for adding user details
    const authReq = req as AuthenticatedRequest;
    authReq.user = { email };

    next();
  } catch {
    // token expired
    res.status(401).json({ error: 'Access denied. Token has expired or is invalid.' });
  }
};
