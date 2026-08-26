import type TodoResponseModel from "./TodoResponse";
import MessageResponseModel from "./MessageResponse";

class TodoListResponseModel {
  constructor(readonly todos: TodoResponseModel[]) {}
}

class TodoMutationResponseModel extends MessageResponseModel {
  constructor(message: string, readonly todo: TodoResponseModel) {
    super(message);
  }
}

export { TodoListResponseModel, TodoMutationResponseModel };
