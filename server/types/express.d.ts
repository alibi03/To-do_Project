import type { AuthenticatedUser } from "./AuthTypes";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
