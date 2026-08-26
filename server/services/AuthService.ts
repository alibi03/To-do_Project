import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { DatabaseError } from "pg";

import Environment from "../config/Environment";
import type {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
} from "../dtos/requests/AuthRequests";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/ApplicationErrors";
import { UserMapper } from "../mappers/UserMapper";
import {
  LoginResultModel,
  PasswordResetRequestResultModel,
} from "../models/AuthResults";
import {
  ConsumePasswordResetModel,
  CreatePasswordResetModel,
} from "../models/repositories/PasswordResetModels";
import { CreateUserModel } from "../models/repositories/UserModels";
import type { PublicUserResponseModel } from "../models/responses/UserResponses";
import passwordResetRepository from "../repositories/PasswordResetRepository";
import userRepository from "../repositories/UserRepository";
import tokenService from "./TokenService";

export class AuthService {
  private normalizeEmail(email: string): string {
    return email.toLowerCase();
  }

  async register(
    input: RegisterRequestDto
  ): Promise<PublicUserResponseModel> {
    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
      const user = await userRepository.create(
        new CreateUserModel(
          input.username,
          this.normalizeEmail(input.email),
          passwordHash
        )
      );

      return UserMapper.toPublicResponse(user);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === "23505") {
        throw new ConflictError("Username or email already exists.");
      }

      throw error;
    }
  }

  async login(input: LoginRequestDto): Promise<LoginResultModel> {
    const user = await userRepository.findByEmail(
      this.normalizeEmail(input.email)
    );

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AuthenticationError("Invalid email or password.");
    }

    return new LoginResultModel(tokenService.create(user.id));
  }

  async getProfile(userId: number): Promise<PublicUserResponseModel> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return UserMapper.toPublicResponse(user);
  }

  async requestPasswordReset(
    input: ForgotPasswordRequestDto
  ): Promise<PasswordResetRequestResultModel> {
    const user = await userRepository.findByEmail(
      this.normalizeEmail(input.email)
    );

    if (!user) {
      return new PasswordResetRequestResultModel();
    }

    const resetCode = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await passwordResetRepository.replaceActiveForUser(
      new CreatePasswordResetModel(user.id, codeHash, expiresAt)
    );

    return Environment.exposesPasswordResetCode
      ? new PasswordResetRequestResultModel(resetCode)
      : new PasswordResetRequestResultModel();
  }

  async resetPassword(input: ResetPasswordRequestDto): Promise<void> {
    const user = await userRepository.findByEmail(
      this.normalizeEmail(input.email)
    );
    const resetEntry = user
      ? await passwordResetRepository.findLatestActiveForUser(user.id)
      : null;

    if (
      !user ||
      !resetEntry ||
      !(await bcrypt.compare(input.code, resetEntry.codeHash))
    ) {
      throw new ValidationError("Reset code is invalid or expired.");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    const updated = await passwordResetRepository.consumeAndUpdatePassword(
      new ConsumePasswordResetModel(resetEntry.id, user.id, passwordHash)
    );

    if (!updated) {
      throw new ValidationError("Reset code is invalid or expired.");
    }
  }
}

const authService = new AuthService();

export default authService;
