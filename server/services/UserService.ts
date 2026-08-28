import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type User from "../models/domain/User";
import type { UserRepositoryPort } from "../ports/RepositoryPorts";
import type {
  AuthorizationServicePort,
  UserServicePort,
} from "../ports/ServicePorts";
import type { UserRole } from "../types/AuthTypes";

@injectable()
class UserService implements UserServicePort {
  constructor(
    @inject(DependencySymbols.UserRepository)
    private readonly userRepository: UserRepositoryPort,
    @inject(DependencySymbols.AuthorizationService)
    private readonly authorizationService: AuthorizationServicePort
  ) {}

  async listForAssignment(role: UserRole): Promise<User[]> {
    this.authorizationService.requireAdmin(
      role,
      "Only administrators can view assignment options."
    );

    return this.userRepository.listForAssignment();
  }
}

export default UserService;
