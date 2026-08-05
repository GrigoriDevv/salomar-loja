import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export enum OrderStatusFilter {
  pending = "pending",
  paid = "paid",
  canceled = "canceled",
  failed = "failed",
}

export class ListOrdersDto {
  @IsOptional()
  @IsEnum(OrderStatusFilter)
  status?: OrderStatusFilter;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
