import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator'

export class ShippingCartItemDto {
  @IsString()
  productVariantId!: string

  @IsInt()
  @Min(1)
  quantity!: number
}

export class CalculateShippingDto {
  @IsString()
  @Matches(/^\d{8}$/, { message: 'CEP deve ter 8 dígitos' })
  cep!: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShippingCartItemDto)
  items!: ShippingCartItemDto[]
}
