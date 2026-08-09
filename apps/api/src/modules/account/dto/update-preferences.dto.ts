import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdatePreferencesDto {
  @IsBoolean()
  marketing!: boolean;

  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  policyVersion?: string;
}
