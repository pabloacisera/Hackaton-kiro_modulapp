import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class InitiateRegistrationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyInviteCodeDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class CompleteRegistrationDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
