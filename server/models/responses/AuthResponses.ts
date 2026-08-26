import type { PublicUserResponseModel } from "./UserResponses";
import MessageResponseModel from "./MessageResponse";

class RegisterResponseModel extends MessageResponseModel {
  constructor(message: string, readonly user: PublicUserResponseModel) {
    super(message);
  }
}

class LoginResponseModel {
  constructor(readonly token: string) {}
}

export { LoginResponseModel, RegisterResponseModel };
