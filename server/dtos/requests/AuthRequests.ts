import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

import StringTransformer from "../../utils/StringTransformer";

class RegisterRequestDto {
  @Transform(StringTransformer.trim)
  @IsString({ message: "Username must be text." })
  @IsNotEmpty({ message: "Username is required." })
  @MaxLength(50, { message: "Username must contain 50 characters or fewer." })
  declare username: string;

  @Transform(StringTransformer.trim)
  @IsEmail({}, { message: "A valid email address is required." })
  declare email: string;

  @IsString({ message: "Password is required." })
  @MinLength(8, { message: "Password must contain at least 8 characters." })
  declare password: string;
}

class LoginRequestDto {
  @Transform(StringTransformer.trim)
  @IsEmail({}, { message: "A valid email address is required." })
  declare email: string;

  @IsString({ message: "Password is required." })
  @IsNotEmpty({ message: "Password is required." })
  declare password: string;
}

class ForgotPasswordRequestDto {
  @Transform(StringTransformer.trim)
  @IsEmail({}, { message: "A valid email address is required." })
  declare email: string;
}

class ResetPasswordRequestDto {
  @Transform(StringTransformer.trim)
  @IsEmail({}, { message: "A valid email address is required." })
  declare email: string;

  @Transform(StringTransformer.trim)
  @IsString({ message: "Reset code is required." })
  @Matches(/^\d{6}$/, { message: "Reset code must contain six digits." })
  declare code: string;

  @IsString({ message: "New password is required." })
  @MinLength(8, { message: "Password must contain at least 8 characters." })
  declare newPassword: string;
}

export {
  ForgotPasswordRequestDto,
  LoginRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
};
