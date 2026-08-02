import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ProductVariantInputDto {
  @IsString()
  size!: string;

  @IsString()
  color!: string;

  @IsInt()
  @Min(0)
  stock!: number;
}

export class CreateProductDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(200)
  subtitle!: string;

  @IsString()
  categoryId!: string;

  @IsString() material!: string;
  @IsString() fit!: string;
  @IsString() tone!: string;
  @IsString() image!: string;
  @IsString() alt!: string;
  @IsString() focus!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  intents!: string[];

  @IsInt()
  @Min(0)
  priceCents!: number;

  /** Preferir variants; sizes+stock ainda aceitos para gerar variantes com tone. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];
}
