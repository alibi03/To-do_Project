import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import UserResponseMapper from "../mappers/UserResponseMapper";
import {
  LoginRequestDto,
  RegisterRequestDto,
} from "../models/requests/AuthRequests";
import type {
  LoginResponse,
  RegisterResponse,
} from "../models/responses/AuthResponses";
import type { AuthServicePort } from "../ports/ServicePorts";
import RequestValidator from "../utils/RequestValidator";

type EmptyParams = Record<string, never>;

@injectable()
class AuthController {
  constructor(
    @inject(DependencySymbols.AuthService)
    private readonly authService: AuthServicePort
  ) {}

  readonly register = async (
    request: Request<EmptyParams, RegisterResponse, object>,
    response: Response<RegisterResponse>
  ): Promise<Response<RegisterResponse>> => {
    const input = await RequestValidator.validate(
      RegisterRequestDto,
      request.body
    );
    const user = await this.authService.register(input);

    return response.status(201).json({
      message: "User registered successfully.",
      user: UserResponseMapper.toPublicResponse(user),
    });
  };

  readonly login = async (
    request: Request<EmptyParams, LoginResponse, object>,
    response: Response<LoginResponse>
  ): Promise<Response<LoginResponse>> => {
    const input = await RequestValidator.validate(LoginRequestDto, request.body);
    const result = await this.authService.login(input);

    return response.json({ token: result.token });
  };
}

export default AuthController;
