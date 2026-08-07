import { Type } from "class-transformer";
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";

export class ConsentCategoriesDto {
  @IsBoolean()
  essential!: boolean;

  @IsBoolean()
  analytics!: boolean;

  @IsBoolean()
  marketing!: boolean;
}

export class RecordConsentDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(80)
  visitorId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ConsentCategoriesDto)
  categories!: ConsentCategoriesDto;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  policyVersion!: string;
}
