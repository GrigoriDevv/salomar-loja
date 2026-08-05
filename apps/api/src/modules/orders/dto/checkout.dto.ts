import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CheckoutDto {
  @IsString()
  @MinLength(8)
  token!: string;

  @IsString()
  paymentMethodId!: string;

  @IsInt()
  @Min(1)
  installments!: number;

  @IsOptional()
  @IsString()
  issueId?: string;
}
