import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import {
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
} from "../models/requests/AuthRequests";
import type MessageResponse from "../models/responses/MessageResponse";
import type { ForgotPasswordResponse } from "../models/responses/PasswordResetResponses";
import type { AuthServicePort } from "../ports/ServicePorts";
import RequestValidator from "../utils/RequestValidator";

type EmptyParams = Record<string, never>;

@injectable()
class PasswordResetController {
  constructor(
    @inject(DependencySymbols.AuthService)
    private readonly authService: AuthServicePort
  ) {}

  readonly forgotPassword = async (
    request: Request<EmptyParams, ForgotPasswordResponse, object>,
    response: Response<ForgotPasswordResponse>
  ): Promise<Response<ForgotPasswordResponse>> => {
    const input = await RequestValidator.validate(
      ForgotPasswordRequestDto,
      request.body
    );
    const result = await this.authService.requestPasswordReset(input);

    return response.json({
      message: "If that email is registered, a reset code was created.",
      ...(result.resetCode ? { resetCode: result.resetCode } : {}),
    });
  };

  readonly resetPassword = async (
    request: Request<EmptyParams, MessageResponse, object>,
    response: Response<MessageResponse>
  ): Promise<Response<MessageResponse>> => {
    const input = await RequestValidator.validate(
      ResetPasswordRequestDto,
      request.body
    );
    await this.authService.resetPassword(input);

    return response.json({
      message: "Password reset successfully. You can now log in.",
    });
  };
}

export default PasswordResetController;
