import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export enum OrderStatusUpdate {
  pending = "pending",
  paid = "paid",
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
}
