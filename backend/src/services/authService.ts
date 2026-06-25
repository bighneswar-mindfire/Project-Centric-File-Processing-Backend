import crypto from 'node:crypto';
import { SignJWT } from 'jose';
import { userRepository } from '../repositories/userRepository.js';

const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const hashPassword = (password: string, salt: string): string => {
  return crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
};

//sign JWT tokens
export const generateToken = async (email: string): Promise<string> => {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
};

export const authService = {
  registerUser: async (email: string, password: string) => {
    const userExists = await userRepository.existsByEmail(email);
    if (userExists) {
      throw new Error('User with this email already exists.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const newUser = await userRepository.createUser(email, passwordHash, salt);

    //signed JWT token
    const token = await generateToken(email);

    return {
      token,
      user: {
        email: newUser.email,
      },
    };
  },

  authenticateUser: async (email: string, password: string) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const targetHash = hashPassword(password, user.salt);
    if (user.passwordHash !== targetHash) {
      throw new Error('Invalid email or password.');
    }

    //signed JWT token
    const token = await generateToken(email);

    return {
      token,
      user: {
        email: user.email,
      },
    };
  },
};
