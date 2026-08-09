import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export class PayerDocumentDto {
  @IsIn(["CPF", "CNPJ"])
  type!: "CPF" | "CNPJ";

  @IsString()
  @MinLength(11)
  number!: string;
}

export class CheckoutShippingDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @Matches(/^\d{8}$/)
  cep!: string;

  @IsString()
  @MinLength(1)
  street!: string;

  @IsString()
  @MinLength(1)
  number!: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsString()
  @MinLength(1)
  district!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(2)
  state!: string;
}

export class CheckoutDto {
  @ValidateIf((o: CheckoutDto) => requiresCardToken(o.paymentMethodId))
  @IsString()
  @MinLength(8)
  token?: string;

  @IsString()
  paymentMethodId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;

  @IsOptional()
  @IsString()
  issueId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PayerDocumentDto)
  payerDocument?: PayerDocumentDto;

  @ValidateNested()
  @Type(() => CheckoutShippingDto)
  shipping!: CheckoutShippingDto;

  @IsIn(["pac", "express"])
  shippingServiceCode!: "pac" | "express";

  @IsInt()
  @Min(0)
  shippingPriceCents!: number;
}

/** Métodos MP que não usam token de cartão. */
export function requiresCardToken(paymentMethodId: string | undefined): boolean {
  if (!paymentMethodId) return true;
  const id = paymentMethodId.toLowerCase();
  if (id === "pix") return false;
  if (id.includes("bol") || id === "ticket" || id === "pec") return false;
  return true;
}
