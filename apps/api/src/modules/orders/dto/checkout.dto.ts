import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
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
}

/** Métodos MP que não usam token de cartão. */
export function requiresCardToken(paymentMethodId: string | undefined): boolean {
  if (!paymentMethodId) return true;
  const id = paymentMethodId.toLowerCase();
  if (id === "pix") return false;
  if (id.includes("bol") || id === "ticket" || id === "pec") return false;
  return true;
}
