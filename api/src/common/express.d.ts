import type { UserRow } from '../db/schema.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserRow;
    }
  }
}

export {};
