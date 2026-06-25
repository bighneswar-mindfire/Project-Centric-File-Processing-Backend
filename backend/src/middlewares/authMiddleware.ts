/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../database/models/User.js';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    //retrieve the authorization header sent by the client
    const authHeader = req.headers['authorization'];

    //extract the token
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access denied. Authentication token is missing.' });
      return;
    }

    //verify the token structure
    const [uuid, base64Payload] = token.split('.');
    if (!uuid || !base64Payload) {
      res.status(401).json({ error: 'Access denied. Invalid token structure.' });
      return;
    }

    //decode
    const decodedJson = Buffer.from(base64Payload, 'base64').toString('utf8');
    const payload = JSON.parse(decodedJson);

    if (!payload || !payload.email) {
      res.status(401).json({ error: 'Access denied. Invalid token payload.' });
      return;
    }

    //verify that the user still exists in our database
    const userExists = await UserModel.exists({ email: payload.email });
    if (!userExists) {
      res.status(401).json({ error: 'Access denied. User no longer exists.' });
      return;
    }

    //attach the validated user details to the request object for controller use
    (req as any).user = { email: payload.email };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Token validation failed:', error);
    res.status(401).json({ error: 'Access denied. Token is invalid or expired.' });
  }
};
