import type MessageResponse from "./MessageResponse";
import type TodoResponse from "./TodoResponse";

interface TodoListResponse {
  todos: TodoResponse[];
}

interface TodoMutationResponse extends MessageResponse {
  todo: TodoResponse;
}

export { type TodoListResponse, type TodoMutationResponse };
