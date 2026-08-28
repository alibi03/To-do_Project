class PasswordResetCode {
  constructor(
    readonly id: number,
    readonly userId: number,
    readonly codeHash: string,
    readonly expiresAt: Date,
    readonly usedAt: Date | null,
    readonly createdAt: Date
  ) {}
}

export default PasswordResetCode;
