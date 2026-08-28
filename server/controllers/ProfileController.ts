import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import UserResponseMapper from "../mappers/UserResponseMapper";
import type ProfileResponse from "../models/responses/ProfileResponse";
import type { AuthServicePort } from "../ports/ServicePorts";
import AuthenticatedUserResolver from "../utils/AuthenticatedUserResolver";

@injectable()
class ProfileController {
  constructor(
    @inject(DependencySymbols.AuthService)
    private readonly authService: AuthServicePort
  ) {}

  readonly getProfile = async (
    request: Request,
    response: Response<ProfileResponse>
  ): Promise<Response<ProfileResponse>> => {
    const currentUser = AuthenticatedUserResolver.resolve(request);
    const user = await this.authService.getProfile(currentUser.userId);

    return response.json({
      user: UserResponseMapper.toPublicResponse(user),
    });
  };
}

export default ProfileController;
