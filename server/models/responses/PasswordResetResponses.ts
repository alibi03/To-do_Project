import type MessageResponse from "./MessageResponse";

interface ForgotPasswordResponse extends MessageResponse {
  resetCode?: string;
}

export { type ForgotPasswordResponse };
