import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(9)
  cep!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  number!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  complement?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(9)
  cep?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  street?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  complement?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  district?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
