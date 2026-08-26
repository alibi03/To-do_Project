import type { AuthenticatedUser } from "./authTypes";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
