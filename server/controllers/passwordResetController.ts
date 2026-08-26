import type { Request, Response } from "express";

import {
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
} from "../dtos/requests/AuthRequests";
import { ForgotPasswordResponseModel } from "../models/responses/PasswordResetResponses";
import MessageResponseModel from "../models/responses/MessageResponse";
import authService from "../services/AuthService";
import RequestValidator from "../utils/RequestValidator";

type EmptyParams = Record<string, never>;

async function forgotPassword(
  request: Request<EmptyParams, ForgotPasswordResponseModel, object>,
  response: Response<ForgotPasswordResponseModel>
): Promise<Response<ForgotPasswordResponseModel>> {
  const input = await RequestValidator.validate(
    ForgotPasswordRequestDto,
    request.body
  );
  const result = await authService.requestPasswordReset(input);

  return response.json(
    new ForgotPasswordResponseModel(
      "If that email is registered, a reset code was created.",
      result.resetCode
    )
  );
}

async function resetPassword(
  request: Request<EmptyParams, MessageResponseModel, object>,
  response: Response<MessageResponseModel>
): Promise<Response<MessageResponseModel>> {
  const input = await RequestValidator.validate(
    ResetPasswordRequestDto,
    request.body
  );
  await authService.resetPassword(input);

  return response.json(
    new MessageResponseModel("Password reset successfully. You can now log in.")
  );
}

export { forgotPassword, resetPassword };
