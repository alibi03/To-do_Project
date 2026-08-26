import type { Request, Response } from "express";

import {
  LoginRequestDto,
  RegisterRequestDto,
} from "../dtos/requests/AuthRequests";
import {
  LoginResponseModel,
  RegisterResponseModel,
} from "../models/responses/AuthResponses";
import authService from "../services/AuthService";
import RequestValidator from "../utils/RequestValidator";

type EmptyParams = Record<string, never>;

async function register(
  request: Request<EmptyParams, RegisterResponseModel, object>,
  response: Response<RegisterResponseModel>
): Promise<Response<RegisterResponseModel>> {
  const input = await RequestValidator.validate(
    RegisterRequestDto,
    request.body
  );
  const user = await authService.register(input);

  return response
    .status(201)
    .json(new RegisterResponseModel("User registered successfully.", user));
}

async function login(
  request: Request<EmptyParams, LoginResponseModel, object>,
  response: Response<LoginResponseModel>
): Promise<Response<LoginResponseModel>> {
  const input = await RequestValidator.validate(LoginRequestDto, request.body);
  const result = await authService.login(input);

  return response.json(new LoginResponseModel(result.token));
}

export { login, register };
