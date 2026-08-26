import type { Request, Response } from "express";

import ProfileResponseModel from "../models/responses/ProfileResponse";
import authService from "../services/AuthService";
import AuthenticatedUserResolver from "../utils/AuthenticatedUserResolver";

async function getProfile(
  request: Request,
  response: Response<ProfileResponseModel>
): Promise<Response<ProfileResponseModel>> {
  const currentUser = AuthenticatedUserResolver.resolve(request);
  const user = await authService.getProfile(currentUser.userId);

  return response.json(new ProfileResponseModel(user));
}

export { getProfile };
