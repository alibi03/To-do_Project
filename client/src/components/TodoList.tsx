import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import ApiClient from "../ApiClient";
import type {
  AssignmentUser,
  MessageResponse,
  SortOrder,
  Todo,
  TodoSortField,
  TodoStatus,
  User,
} from "../types";

type TodoListProps = {
  currentUser: User;
};

type TodoFormState = {
  title: string;
  description: string;
  dueDate: string;
  assignedToUserId: string;
};

type TodosResponse = {
  todos: Todo[];
};

type UsersResponse = {
  users: AssignmentUser[];
};

type StatusOption = {
  value: TodoStatus;
  label: string;
};

const STATUS_OPTIONS: readonly StatusOption[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

function TodoList({ currentUser }: TodoListProps) {
  const isAdmin = currentUser.role === "admin";
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<AssignmentUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<TodoSortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<TodoFormState>({
    title: "",
    description: "",
    dueDate: "",
    assignedToUserId: "",
  });

  useEffect(() => {
    async function loadTodos() {
      const query = new URLSearchParams({ sortBy, sortOrder });

      if (search) {
        query.set("search", search);
      }

      try {
        const response = await fetch(
          `${ApiClient.baseUrl}/api/todos?${query.toString()}`,
          { headers: ApiClient.getBearerHeaders() }
        );
        const data = await ApiClient.readJson<
          TodosResponse & Partial<MessageResponse>
        >(response);

        if (!response.ok) {
          throw new Error(data.message ?? "Tasks could not be loaded.");
        }

        setTodos(data.todos);
      } catch (error) {
        setMessage(ApiClient.getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    }

    void loadTodos();
  }, [refreshKey, search, sortBy, sortOrder]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    async function loadUsers() {
      try {
        const response = await fetch(`${ApiClient.baseUrl}/api/users`, {
          headers: ApiClient.getBearerHeaders(),
        });
        const data = await ApiClient.readJson<
          UsersResponse & Partial<MessageResponse>
        >(response);

        if (!response.ok) {
          throw new Error(data.message ?? "Users could not be loaded.");
        }

        setUsers(data.users);
        setForm((current) => ({
          ...current,
          assignedToUserId:
            current.assignedToUserId || String(data.users[0]?.id ?? ""),
        }));
      } catch (error) {
        setMessage(ApiClient.getErrorMessage(error));
      }
    }

    void loadUsers();
  }, [isAdmin]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const field = event.target.name as keyof TodoFormState;
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setSearch(searchInput.trim());
    setRefreshKey((current) => current + 1);
  }

  function clearSearch() {
    setIsLoading(true);
    setSearchInput("");
    setSearch("");
    setRefreshKey((current) => current + 1);
  }

  function changeSortBy(event: ChangeEvent<HTMLSelectElement>) {
    setIsLoading(true);
    setSortBy(event.target.value as TodoSortField);
  }

  function changeSortOrder(event: ChangeEvent<HTMLSelectElement>) {
    setIsLoading(true);
    setSortOrder(event.target.value as SortOrder);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${ApiClient.baseUrl}/api/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ApiClient.getBearerHeaders(),
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          dueDate: form.dueDate || null,
          assignedToUserId: Number(form.assignedToUserId),
        }),
      });
      const data = await ApiClient.readJson<Partial<MessageResponse>>(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Task could not be created.");
      }

      setForm((current) => ({
        title: "",
        description: "",
        dueDate: "",
        assignedToUserId: current.assignedToUserId,
      }));
      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    }
  }

  async function updateStatus(todo: Todo, status: TodoStatus) {
    setMessage("");

    try {
      const response = await fetch(`${ApiClient.baseUrl}/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...ApiClient.getBearerHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      const data = await ApiClient.readJson<Partial<MessageResponse>>(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Task status could not be updated.");
      }

      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    }
  }

  async function deleteTodo(todoId: string) {
    setMessage("");

    try {
      const response = await fetch(`${ApiClient.baseUrl}/api/todos/${todoId}`, {
        method: "DELETE",
        headers: ApiClient.getBearerHeaders(),
      });
      const data = await ApiClient.readJson<Partial<MessageResponse>>(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Task could not be deleted.");
      }

      setIsLoading(true);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    }
  }

  const emptyMessage = search
    ? `No tasks match “${search}”.`
    : isAdmin
      ? "No tasks yet. Create the first one above."
      : "No tasks are assigned to you.";

  return (
    <div className="todo-layout">
      {isAdmin && (
        <section className="card create-card">
          <h2>Create a task</h2>
          <form className="task-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="wide-field">
              Description
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
              />
            </label>

            <label>
              Due date
              <input
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={handleChange}
              />
            </label>

            <label>
              Assign to
              <select
                name="assignedToUserId"
                value={form.assignedToUserId}
                onChange={handleChange}
                required
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
            </label>

            <button className="wide-field" type="submit" disabled={!users.length}>
              Add task
            </button>
          </form>
        </section>
      )}

      <section className="task-section">
        <div className="section-heading">
          <div>
            <h2>{isAdmin ? "All tasks" : "My assigned tasks"}</h2>
            <span>{todos.length} shown</span>
          </div>
        </div>

        <form className="task-controls card" onSubmit={handleSearch}>
          <label className="search-control">
            Search tasks
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Title or description"
              maxLength={100}
            />
          </label>

          <button type="submit">Search</button>
          {search && (
            <button className="secondary" type="button" onClick={clearSearch}>
              Clear
            </button>
          )}

          <label>
            Sort by
            <select value={sortBy} onChange={changeSortBy}>
              <option value="dueDate">Due date</option>
              <option value="status">Status</option>
            </select>
          </label>

          <label>
            Order
            <select value={sortOrder} onChange={changeSortOrder}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </form>

        {message && <p className="form-message">{message}</p>}
        {isLoading && <p>Loading tasks...</p>}
        {!isLoading && todos.length === 0 && (
          <div className="empty-state">{emptyMessage}</div>
        )}

        <div className="task-list">
          {todos.map((todo) => (
            <article className="card task-card" key={todo.id}>
              <div className="task-card-heading">
                <div>
                  <h3>{todo.title}</h3>
                  <p className="task-meta">
                    Created by {todo.created_by_username} · Assigned to{" "}
                    {todo.assigned_to_username}
                  </p>
                </div>
                <span className={`status-badge status-${todo.status}`}>
                  {STATUS_OPTIONS.find((option) => option.value === todo.status)?.label ??
                    todo.status}
                </span>
              </div>

              {todo.description && (
                <p className="task-description">{todo.description}</p>
              )}
              {todo.due_date && (
                <p className="task-meta">Due {todo.due_date.slice(0, 10)}</p>
              )}

              <div className="task-actions">
                <label>
                  Status
                  <select
                    value={todo.status}
                    onChange={(event) =>
                      void updateStatus(todo, event.target.value as TodoStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {isAdmin && (
                  <button
                    className="danger"
                    type="button"
                    onClick={() => void deleteTodo(todo.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default TodoList;
