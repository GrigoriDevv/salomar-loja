import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

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

  @IsInt()
  @Min(0)
  stock!: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sizes!: string[];
}
