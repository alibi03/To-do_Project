import type {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
} from "../models/requests/AuthRequests";
import type {
  CreateTodoRequestDto,
  TodoListQueryDto,
  UpdateTodoRequestDto,
} from "../models/requests/TodoRequests";
import type Todo from "../models/domain/Todo";
import type User from "../models/domain/User";
import type {
  LoginResult,
  PasswordResetRequestResult,
} from "../models/results/AuthResults";
import type { AuthenticatedUser, UserRole } from "../types/AuthTypes";

interface AuthServicePort {
  register(input: RegisterRequestDto): Promise<User>;
  login(input: LoginRequestDto): Promise<LoginResult>;
  getProfile(userId: number): Promise<User>;
  requestPasswordReset(
    input: ForgotPasswordRequestDto
  ): Promise<PasswordResetRequestResult>;
  resetPassword(input: ResetPasswordRequestDto): Promise<void>;
}

interface AuthorizationServicePort {
  requireAdmin(role: UserRole, message?: string): void;
  requireTodoUpdatePermission(
    currentUser: AuthenticatedUser,
    todo: Todo,
    input: UpdateTodoRequestDto
  ): void;
}

interface HealthServicePort {
  getDatabaseTime(): Promise<Date>;
}

interface OutboxPublisherServicePort {
  start(): void;
  stop(): Promise<void>;
}

interface TodoServicePort {
  listForUser(
    currentUser: AuthenticatedUser,
    query: TodoListQueryDto
  ): Promise<Todo[]>;
  create(
    currentUser: AuthenticatedUser,
    input: CreateTodoRequestDto
  ): Promise<Todo>;
  update(
    currentUser: AuthenticatedUser,
    todoId: string,
    input: UpdateTodoRequestDto
  ): Promise<Todo>;
  remove(currentUser: AuthenticatedUser, todoId: string): Promise<void>;
}

interface TokenServicePort {
  create(userId: number): string;
  verifyUserId(token: string): number;
}

interface UserServicePort {
  listForAssignment(role: UserRole): Promise<User[]>;
}

export {
  type AuthServicePort,
  type AuthorizationServicePort,
  type HealthServicePort,
  type OutboxPublisherServicePort,
  type TodoServicePort,
  type TokenServicePort,
  type UserServicePort,
};
