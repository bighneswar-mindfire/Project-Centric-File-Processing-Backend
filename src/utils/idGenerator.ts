import { randomInt } from 'crypto';

export const generateId = (prefix: 'proj' | 'file' | 'job'): string => {
  const uniqueNum = randomInt(1000, 10000);
  return `${prefix}_${uniqueNum}`;
};
