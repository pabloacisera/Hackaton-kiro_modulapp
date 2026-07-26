import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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
  password: string;
}
