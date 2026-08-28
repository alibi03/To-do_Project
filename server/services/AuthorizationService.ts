import { injectable } from "inversify";

import {
  AuthorizationError,
  NotFoundError,
} from "../errors/ApplicationErrors";
import type Todo from "../models/domain/Todo";
import {
  TodoUpdateField,
  type UpdateTodoRequestDto,
} from "../models/requests/TodoRequests";
import type { AuthorizationServicePort } from "../ports/ServicePorts";
import type { AuthenticatedUser } from "../types/AuthTypes";
import { UserRole } from "../types/AuthTypes";

@injectable()
class AuthorizationService implements AuthorizationServicePort {
  private readonly memberUpdateFields = new Set<TodoUpdateField>([
    TodoUpdateField.Status,
  ]);

  requireAdmin(
    role: UserRole,
    message = "Only administrators can perform this action."
  ): void {
    if (role !== UserRole.Admin) {
      throw new AuthorizationError(message);
    }
  }

  requireTodoUpdatePermission(
    currentUser: AuthenticatedUser,
    todo: Todo,
    input: UpdateTodoRequestDto
  ): void {
    if (currentUser.role === UserRole.Admin) {
      return;
    }

    if (todo.assignedToUserId !== currentUser.userId) {
      throw new NotFoundError("To-do not found.");
    }

    const suppliedFields = new Set(
      Object.values(TodoUpdateField).filter(
        (field) => input[field] !== undefined
      )
    );
    const changesOnlyStatus =
      suppliedFields.size === this.memberUpdateFields.size &&
      [...suppliedFields].every((field) =>
        this.memberUpdateFields.has(field)
      );

    if (!changesOnlyStatus) {
      throw new AuthorizationError(
        "Members can only change the status of assigned tasks."
      );
    }
  }
}

export default AuthorizationService;
