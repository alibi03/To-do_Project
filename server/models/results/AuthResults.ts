interface LoginResult {
  token: string;
}

interface PasswordResetRequestResult {
  resetCode?: string;
}

export { type LoginResult, type PasswordResetRequestResult };
