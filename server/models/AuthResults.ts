class LoginResultModel {
  constructor(readonly token: string) {}
}

class PasswordResetRequestResultModel {
  constructor(readonly resetCode?: string) {}
}

export { LoginResultModel, PasswordResetRequestResultModel };
