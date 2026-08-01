import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common'
import { CatalogService } from './catalog.service'

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  list(@Query('intent') intent?: string) {
    return this.catalogService.findAll(intent)
  }

  @Get('products/:slug')
  async bySlug(@Param('slug') slug: string) {
    const product = await this.catalogService.findBySlug(slug)
    if (!product) {
      throw new NotFoundException(`Product ${slug} not found`)
    }
    return product
  }
}
