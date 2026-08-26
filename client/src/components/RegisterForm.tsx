import { useState, type ChangeEvent, type FormEvent } from "react";

import ApiClient from "../ApiClient";
import type { MessageResponse } from "../types";

type RegistrationFormState = {
  username: string;
  email: string;
  password: string;
};

function RegisterForm() {
  const [form, setForm] = useState<RegistrationFormState>({
    username: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof RegistrationFormState;
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
      const response = await fetch(`${ApiClient.baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await ApiClient.readJson<MessageResponse>(response);

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage("Registration successful. You can now log in.");
      setForm({ username: "", email: "", password: "" });
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <h2>Register</h2>

      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </label>

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
            minLength={8}
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}

export default RegisterForm;
