import { useState, type ChangeEvent, type FormEvent } from "react";

import ApiClient from "../ApiClient";
import type { User } from "../types";

type LoginFormProps = {
  onLogin: (user: User) => void;
};

type LoginFormState = {
  email: string;
  password: string;
};

type LoginResponse = {
  token?: string;
  message?: string;
};

type ProfileResponse = {
  user?: User;
  message?: string;
};

function LoginForm({ onLogin }: LoginFormProps) {
  const [form, setForm] = useState<LoginFormState>({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof LoginFormState;
    const { value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${ApiClient.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await ApiClient.readJson<LoginResponse>(response);

      if (!response.ok || !data.token) {
        throw new Error(data.message ?? "Login failed.");
      }

      localStorage.setItem("token", data.token);

      const profileResponse = await fetch(`${ApiClient.baseUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const profileData = await ApiClient.readJson<ProfileResponse>(
        profileResponse
      );

      if (!profileResponse.ok || !profileData.user) {
        localStorage.removeItem("token");
        throw new Error(profileData.message ?? "Profile could not be loaded.");
      }

      onLogin(profileData.user);
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <h2>Login</h2>

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}

export default LoginForm;
