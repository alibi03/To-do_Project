import { AuthenticationError } from "../errors/ApplicationErrors";
import type { AuthenticatedUser } from "../types/AuthTypes";

type RequestWithUser = {
  user?: AuthenticatedUser;
};

class AuthenticatedUserResolver {
  static resolve(request: RequestWithUser): AuthenticatedUser {
    if (!request.user) {
      throw new AuthenticationError("Authentication token is required.");
    }

    return request.user;
  }
}

export default AuthenticatedUserResolver;
