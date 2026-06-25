import { UserModel, IUser } from '../database/models/User.js';

export const userRepository = {
  findByEmail: async (email: string): Promise<IUser | null> => {
    return UserModel.findOne({ email });
  },

  existsByEmail: async (email: string): Promise<boolean> => {
    const exists = await UserModel.exists({ email });
    return !!exists;
  },

  createUser: async (email: string, passwordHash: string, salt: string): Promise<IUser> => {
    const newUser = new UserModel({
      email,
      passwordHash,
      salt,
    });
    return newUser.save();
  },
};
