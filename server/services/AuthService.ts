import crypto from "node:crypto";

import bcrypt from "bcrypt";
import { inject, injectable } from "inversify";
import { DatabaseError } from "pg";

import type { ApplicationConfig } from "../config/ApplicationConfig";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/ApplicationErrors";
import type User from "../models/domain/User";
import type {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
} from "../models/requests/AuthRequests";
import {
  ConsumePasswordResetModel,
  CreatePasswordResetModel,
} from "../models/repositories/PasswordResetModels";
import { CreateUserModel } from "../models/repositories/UserModels";
import type {
  LoginResult,
  PasswordResetRequestResult,
} from "../models/results/AuthResults";
import type {
  PasswordResetRepositoryPort,
  UserRepositoryPort,
} from "../ports/RepositoryPorts";
import type { AuthServicePort, TokenServicePort } from "../ports/ServicePorts";

@injectable()
class AuthService implements AuthServicePort {
  constructor(
    @inject(DependencySymbols.UserRepository)
    private readonly userRepository: UserRepositoryPort,
    @inject(DependencySymbols.PasswordResetRepository)
    private readonly passwordResetRepository: PasswordResetRepositoryPort,
    @inject(DependencySymbols.TokenService)
    private readonly tokenService: TokenServicePort,
    @inject(DependencySymbols.ApplicationConfig)
    private readonly config: ApplicationConfig
  ) {}

  async register(input: RegisterRequestDto): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
      return await this.userRepository.create(
        new CreateUserModel(
          input.username,
          this.normalizeEmail(input.email),
          passwordHash
        )
      );
    } catch (error) {
      if (error instanceof DatabaseError && error.code === "23505") {
        throw new ConflictError("Username or email already exists.");
      }

      throw error;
    }
  }

  async login(input: LoginRequestDto): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(
      this.normalizeEmail(input.email)
    );

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AuthenticationError("Invalid email or password.");
    }

    return { token: this.tokenService.create(user.id) };
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    return user;
  }

  async requestPasswordReset(
    input: ForgotPasswordRequestDto
  ): Promise<PasswordResetRequestResult> {
    const user = await this.userRepository.findByEmail(
      this.normalizeEmail(input.email)
    );

    if (!user) {
      return {};
    }

    const resetCode = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.passwordResetRepository.replaceActiveForUser(
      new CreatePasswordResetModel(user.id, codeHash, expiresAt)
    );

    return this.config.jwt.exposePasswordResetCode ? { resetCode } : {};
  }

  async resetPassword(input: ResetPasswordRequestDto): Promise<void> {
    const user = await this.userRepository.findByEmail(
      this.normalizeEmail(input.email)
    );
    const resetEntry = user
      ? await this.passwordResetRepository.findLatestActiveForUser(user.id)
      : null;

    if (
      !user ||
      !resetEntry ||
      !(await bcrypt.compare(input.code, resetEntry.codeHash))
    ) {
      throw new ValidationError("Reset code is invalid or expired.");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    const updated =
      await this.passwordResetRepository.consumeAndUpdatePassword(
        new ConsumePasswordResetModel(resetEntry.id, user.id, passwordHash)
      );

    if (!updated) {
      throw new ValidationError("Reset code is invalid or expired.");
    }
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase();
  }
}

export default AuthService;
