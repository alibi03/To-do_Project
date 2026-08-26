import { useState, type ChangeEvent, type FormEvent } from "react";

import ApiClient from "../ApiClient";
import type { MessageResponse } from "../types";

type PasswordResetFormState = {
  email: string;
  code: string;
  newPassword: string;
};

function ForgotPasswordForm() {
  const [form, setForm] = useState<PasswordResetFormState>({
    email: "",
    code: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const field = event.target.name as keyof PasswordResetFormState;
    const { value } = event.target;
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function requestCode() {
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${ApiClient.baseUrl}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        }
      );
      const data = await ApiClient.readJson<MessageResponse>(response);

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(data.message);
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${ApiClient.baseUrl}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await ApiClient.readJson<MessageResponse>(response);

      if (!response.ok) {
        throw new Error(data.message);
      }

      setMessage(data.message);
      setForm({ email: "", code: "", newPassword: "" });
    } catch (error) {
      setMessage(ApiClient.getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card auth-card">
      <h2>Reset password</h2>
      <form className="stack-form" onSubmit={handleReset}>
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

        <button
          type="button"
          className="secondary"
          onClick={() => void requestCode()}
          disabled={isSubmitting}
        >
          Get reset code
        </button>

        <label>
          Six-digit code
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            value={form.code}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          New password
          <input
            name="newPassword"
            type="password"
            minLength={8}
            value={form.newPassword}
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          Reset password
        </button>
      </form>

      {message && <p className="form-message">{message}</p>}
    </section>
  );
}

export default ForgotPasswordForm;
