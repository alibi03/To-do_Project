import { useEffect, useState } from "react";

import ApiClient from "./ApiClient";
import "./App.css";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import TodoList from "./components/TodoList";
import type { AuthView, MessageResponse, User } from "./types";

type ProfileResponse = {
  user: User;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState<AuthView>("login");

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(`${ApiClient.baseUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await ApiClient.readJson<ProfileResponse & MessageResponse>(
          response
        );

        if (!response.ok) {
          throw new Error(data.message);
        }

        setUser(data.user);
      } catch (error) {
        console.error(error);
        localStorage.removeItem("token");
      } finally {
        setIsCheckingAuth(false);
      }
    }

    void restoreSession();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setAuthView("login");
  }

  function handleLogin(loggedInUser: User) {
    setUser(loggedInUser);
    setAuthView("login");
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <h1>Staj App</h1>
      </header>

      {isCheckingAuth ? (
        <p>Checking login...</p>
      ) : user ? (
        <section className="dashboard">
          <div className="dashboard-heading">
            <div>
              <p className="eyebrow">Signed in as</p>
              <h2>{user.username}</h2>
              <p className="role-label">
                {user.role === "admin" ? "Administrator" : "Member"}
              </p>
            </div>
            <button className="secondary" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
          <TodoList currentUser={user} />
        </section>
      ) : (
        <section className="auth-shell">
          <div className="auth-tabs" aria-label="Authentication options">
            <button
              className={authView === "login" ? "" : "secondary"}
              type="button"
              onClick={() => setAuthView("login")}
            >
              Login
            </button>
            <button
              className={authView === "register" ? "" : "secondary"}
              type="button"
              onClick={() => setAuthView("register")}
            >
              Register
            </button>
          </div>

          {authView === "login" && <LoginForm onLogin={handleLogin} />}
          {authView === "register" && <RegisterForm />}
          {authView === "reset" && <ForgotPasswordForm />}

          {authView === "reset" && (
            <button
              className="secondary"
              type="button"
              onClick={() => setAuthView("login")}
            >
              Back to login
            </button>
          )}
          {authView === "login" && (
            <button
              className="secondary"
              type="button"
              onClick={() => setAuthView("reset")}
            >
              Forgot password?
            </button>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
