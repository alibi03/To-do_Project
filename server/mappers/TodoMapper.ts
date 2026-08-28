import Todo, { type TodoStatus } from "../models/domain/Todo";

type TodoDatabaseRecord = {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  due_date: string | null;
  created_at: Date;
  updated_at: Date;
  created_by_user_id: number;
  assigned_to_user_id: number;
  created_by_username: string;
  assigned_to_username: string;
};

class TodoMapper {
  static fromDatabase(record: TodoDatabaseRecord): Todo {
    const {
      id,
      title,
      description,
      status,
      due_date,
      created_at,
      updated_at,
      created_by_user_id,
      assigned_to_user_id,
      created_by_username,
      assigned_to_username,
    } = record;

    return new Todo(
      id,
      title,
      description,
      status,
      due_date,
      created_at,
      updated_at,
      created_by_user_id,
      assigned_to_user_id,
      created_by_username,
      assigned_to_username
    );
  }
}

export { TodoMapper, type TodoDatabaseRecord };
