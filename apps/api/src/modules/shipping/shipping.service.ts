import { createHash } from 'node:crypto'
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { Prisma } from '../../generated/prisma'
import { PrismaService } from '../../prisma/prisma.service'
import type { CalculateShippingDto } from './dto/calculate-shipping.dto'
import {
  SHIPPING_TABLE_VERSION,
  buildShippingOptions,
  isValidCepFormat,
  normalizeCep,
  type ShippingOption,
} from './shipping-table'

export type ShippingQuoteResult = {
  cep: string
  options: ShippingOption[]
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  buildCacheKey(
    cep: string,
    items: Array<{ productVariantId: string; quantity: number }>,
  ): string {
    const sorted = [...items]
      .map((i) => ({
        productVariantId: i.productVariantId,
        quantity: i.quantity,
      }))
      .sort((a, b) => a.productVariantId.localeCompare(b.productVariantId))
    const payload = JSON.stringify({
      v: SHIPPING_TABLE_VERSION,
      cep,
      items: sorted,
    })
    return createHash('sha1').update(payload).digest('hex')
  }

  async calculate(dto: CalculateShippingDto): Promise<ShippingQuoteResult> {
    const cep = normalizeCep(dto.cep)
    if (!isValidCepFormat(cep)) {
      throw new BadRequestException('CEP inválido')
    }

    const items = dto.items.map((i) => ({
      productVariantId: i.productVariantId.trim(),
      quantity: i.quantity,
    }))

    if (items.some((i) => !i.productVariantId || i.quantity < 1)) {
      throw new BadRequestException('Itens do carrinho inválidos')
    }

    const variantIds = [...new Set(items.map((i) => i.productVariantId))]
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, active: true },
    })
    if (variants.length !== variantIds.length) {
      throw new BadRequestException('Variante não encontrada')
    }
    if (variants.some((v) => !v.active)) {
      throw new BadRequestException('Variante indisponível')
    }

    const cacheKey = this.buildCacheKey(cep, items)
    const cached = await this.prisma.shippingQuoteCache.findUnique({
      where: { cacheKey },
    })
    if (cached && cached.expiresAt > new Date()) {
      return cached.payload as unknown as ShippingQuoteResult
    }

    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)
    let options: ShippingOption[]
    try {
      options = buildShippingOptions(cep, totalUnits)
    } catch {
      throw new BadRequestException('CEP inválido ou fora das faixas atendidas')
    }

    const result: ShippingQuoteResult = { cep, options }

    try {
      await this.prisma.shippingQuoteCache.upsert({
        where: { cacheKey },
        create: {
          cacheKey,
          payload: result as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
        update: {
          payload: result as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        },
      })
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível gravar o cache de frete',
      )
    }

    return result
  }

  /**
   * Recalcula frete no servidor (checkout). Usa as mesmas regras da tabela.
   */
  quoteForCart(
    cepRaw: string,
    items: Array<{ productVariantId: string; quantity: number }>,
  ): ShippingQuoteResult {
    const cep = normalizeCep(cepRaw)
    if (!isValidCepFormat(cep)) {
      throw new BadRequestException('CEP inválido')
    }
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0)
    try {
      return { cep, options: buildShippingOptions(cep, totalUnits) }
    } catch {
      throw new BadRequestException('CEP inválido ou fora das faixas atendidas')
    }
  }
}
