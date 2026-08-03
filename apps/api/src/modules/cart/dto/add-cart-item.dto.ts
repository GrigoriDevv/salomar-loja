import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class AddCartItemDto {
  @IsString()
  productVariantId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
