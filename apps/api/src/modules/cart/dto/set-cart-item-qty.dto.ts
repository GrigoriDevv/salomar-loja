import { IsInt, Min } from "class-validator";

export class SetCartItemQtyDto {
  /** 0 = remove a linha */
  @IsInt()
  @Min(0)
  quantity!: number;
}
