import { IsBoolean, IsOptional } from "class-validator";
import { CreateCategoryDto } from "./create-category.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
