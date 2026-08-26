class CreatePasswordResetModel {
  constructor(
    readonly userId: number,
    readonly codeHash: string,
    readonly expiresAt: Date
  ) {}
}

class ConsumePasswordResetModel {
  constructor(
    readonly resetCodeId: number,
    readonly userId: number,
    readonly passwordHash: string
  ) {}
}

export { ConsumePasswordResetModel, CreatePasswordResetModel };
