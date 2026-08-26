import MessageResponseModel from "./MessageResponse";

class ForgotPasswordResponseModel extends MessageResponseModel {
  readonly resetCode?: string;

  constructor(message: string, resetCode?: string) {
    super(message);
    this.resetCode = resetCode;
  }
}

export { ForgotPasswordResponseModel };
