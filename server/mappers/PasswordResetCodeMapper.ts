import PasswordResetCode from "../models/domain/PasswordResetCode";

type PasswordResetCodeDatabaseRecord = {
  id: number;
  user_id: number;
  code_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
};

class PasswordResetCodeMapper {
  static fromDatabase(record: PasswordResetCodeDatabaseRecord): PasswordResetCode {
    const { id, user_id, code_hash, expires_at, used_at, created_at } = record;
    return new PasswordResetCode(
      id,
      user_id,
      code_hash,
      expires_at,
      used_at,
      created_at
    );
  }
}

export { PasswordResetCodeMapper, type PasswordResetCodeDatabaseRecord };
