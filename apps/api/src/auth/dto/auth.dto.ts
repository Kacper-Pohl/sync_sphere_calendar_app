import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthProfileDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  picture?: string;

  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}

export class LoginResponseDto {
  token: string;
}
