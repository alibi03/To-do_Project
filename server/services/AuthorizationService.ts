import type { UpdateTodoRequestDto } from "../dtos/requests/TodoRequests";
import { TodoUpdateField } from "../dtos/requests/TodoRequests";
import type Todo from "../domain/Todo";
import {
  AuthorizationError,
  NotFoundError,
} from "../errors/ApplicationErrors";
import type { AuthenticatedUser } from "../types/authTypes";
import { UserRole } from "../types/authTypes";

class AuthorizationService {
  private static readonly memberUpdateFields = new Set<TodoUpdateField>([
    TodoUpdateField.Status,
  ]);

  static requireAdmin(
    role: UserRole,
    message = "Only administrators can perform this action."
  ): void {
    if (role !== UserRole.Admin) {
      throw new AuthorizationError(message);
    }
  }

  static requireTodoUpdatePermission(
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
      [...suppliedFields].every((field) => this.memberUpdateFields.has(field));

    if (!changesOnlyStatus) {
      throw new AuthorizationError(
        "Members can only change the status of assigned tasks."
      );
    }
  }
}

export default AuthorizationService;
