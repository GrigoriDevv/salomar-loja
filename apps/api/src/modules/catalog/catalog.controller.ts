import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { ListProductsDto } from "./dto/list-products.dto";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get("products")
  list(@Query() query: ListProductsDto) {
    return this.catalogService.findAll({
      page: query.page,
      limit: query.limit,
      intent: query.intent,
      category: query.category,
      size: query.size,
      color: query.color,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
    });
  }

  @Get("products/:slug")
  async bySlug(@Param("slug") slug: string) {
    const product = await this.catalogService.findBySlug(slug);
    if (!product) {
      throw new NotFoundException(`Product ${slug} not found`);
    }
    return product;
  }
}
