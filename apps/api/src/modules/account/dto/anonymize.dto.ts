import { IsIn, IsString } from "class-validator";

export class AnonymizeAccountDto {
  @IsString()
  @IsIn(["EXCLUIR"])
  confirm!: "EXCLUIR";
}
