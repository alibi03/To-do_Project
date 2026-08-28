import type MessageResponse from "./MessageResponse";
import type { PublicUserResponse } from "./UserResponses";

interface RegisterResponse extends MessageResponse {
  user: PublicUserResponse;
}

interface LoginResponse {
  token: string;
}

export { type LoginResponse, type RegisterResponse };
