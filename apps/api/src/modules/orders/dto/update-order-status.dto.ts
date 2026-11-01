import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export enum OrderStatusUpdate {
  pending = "pending",
  paid = "paid",
  shipped = "shipped",
  delivered = "delivered",
  canceled = "canceled",
  failed = "failed",
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusUpdate)
  status!: OrderStatusUpdate;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /** Obrigatório ao marcar como enviado. */
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{6,40}$/, { message: "Código de rastreio inválido" })
  trackingCode?: string;
}
