import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(intent?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        active: true,
        ...(intent ? { intents: { has: intent } } : {}),
      },
      orderBy: { name: 'asc' },
    })

    return products.map((product) => this.toClient(product))
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, active: true },
    })
    return product ? this.toClient(product) : null
  }

  private toClient(product: {
    id: string
    slug: string
    name: string
    subtitle: string
    category: string
    material: string
    fit: string
    tone: string
    image: string
    alt: string
    focus: string
    intents: string[]
    priceCents: number
    sizes: string[]
  }) {
    return {
      id: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      price: product.priceCents / 100,
      category: product.category,
      material: product.material,
      fit: product.fit,
      sizes: product.sizes,
      image: product.image,
      alt: product.alt,
      intents: product.intents,
      tone: product.tone,
      focus: product.focus,
    }
  }
}
