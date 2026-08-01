import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const categories = [
  { name: 'Camisetas', slug: 'camisetas' },
  { name: 'Kits', slug: 'kits' },
  { name: 'Acessórios', slug: 'acessorios' },
  { name: 'Praia', slug: 'praia' },
]

const products = [
  {
    slug: 'camiseta-branca',
    name: 'Camiseta Branca',
    subtitle: 'Essencial à beira-mar',
    priceCents: 14900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-branca.jpg',
    alt: 'Modelo Salomar de costas com camiseta branca na praia',
    intents: ['beira-mar', 'ilha', 'essenciais'],
    tone: 'Branco',
    focus: '50% 22%',
  },
  {
    slug: 'camiseta-preta',
    name: 'Camiseta Preta',
    subtitle: 'Base limpa e urbana',
    priceCents: 14900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-preta.jpg',
    alt: 'Modelo Salomar vestindo camiseta preta ao ar livre',
    intents: ['essenciais', 'ilha'],
    tone: 'Preto',
    focus: '48% 18%',
  },
  {
    slug: 'camiseta-menta',
    name: 'Camiseta Menta',
    subtitle: 'Frescor do litoral',
    priceCents: 14900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-menta.jpg',
    alt: 'Modelo Salomar com camiseta menta em jardim tropical',
    intents: ['beira-mar', 'ilha', 'essenciais'],
    tone: 'Menta',
    focus: '50% 16%',
  },
  {
    slug: 'camiseta-rosa',
    name: 'Camiseta Rosa Areia',
    subtitle: 'Tom suave de verão',
    priceCents: 14900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-rosa.jpg',
    alt: 'Modelo Salomar com camiseta rosa areia e bermuda jeans',
    intents: ['por-do-sol', 'ilha'],
    tone: 'Rosa areia',
    focus: '50% 14%',
  },
  {
    slug: 'camiseta-terracota',
    name: 'Camiseta Terracota',
    subtitle: 'Bordado sol e onda',
    priceCents: 16900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-terracota.jpg',
    alt: 'Camiseta terracota Salomar com logo bordado e flor hibisco',
    intents: ['por-do-sol', 'beira-mar'],
    tone: 'Terracota',
    focus: '52% 28%',
  },
  {
    slug: 'camiseta-verde',
    name: 'Camiseta Verde Salomar',
    subtitle: 'Logo ao peito',
    priceCents: 16900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-verde.jpg',
    alt: 'Camiseta verde Salomar com logo sol e onda',
    intents: ['beira-mar', 'por-do-sol'],
    tone: 'Verde',
    focus: '55% 32%',
  },
  {
    slug: 'camiseta-perola',
    name: 'Camiseta Pérola',
    subtitle: 'Clássica com marca',
    priceCents: 16900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-perola.jpg',
    alt: 'Camiseta pérola Salomar com logo azul bordado',
    intents: ['essenciais', 'beira-mar', 'ilha'],
    tone: 'Pérola',
    focus: '48% 22%',
  },
  {
    slug: 'camiseta-mare',
    name: 'Camiseta Maré',
    subtitle: 'Verde-água com bordado',
    priceCents: 16900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-mare.jpg',
    alt: 'Detalhe do logo Salomar em camiseta verde-água',
    intents: ['beira-mar', 'por-do-sol'],
    tone: 'Maré',
    focus: '42% 55%',
  },
  {
    slug: 'camiseta-lima',
    name: 'Camiseta Lima',
    subtitle: 'Vibração de sol alto',
    priceCents: 14900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-lima.jpg',
    alt: 'Detalhe de ombro da camiseta lima Salomar',
    intents: ['ilha', 'por-do-sol'],
    tone: 'Lima',
    focus: '50% 40%',
  },
  {
    slug: 'camiseta-oliva',
    name: 'Camiseta Oliva',
    subtitle: 'Verde profundo do dia',
    priceCents: 14900,
    categorySlug: 'camisetas',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/camiseta-oliva.jpg',
    alt: 'Detalhe de costura da camiseta oliva Salomar',
    intents: ['essenciais', 'ilha'],
    tone: 'Oliva',
    focus: '50% 38%',
  },
  {
    slug: 'kit-cores',
    name: 'Kit Cores Salomar',
    subtitle: 'Quatro tons do verão',
    priceCents: 49900,
    categorySlug: 'kits',
    material: 'Algodão macio',
    fit: 'Regular',
    sizes: ['P', 'M', 'G', 'GG'],
    image: '/catalog/kit-cores.jpg',
    alt: 'Quatro camisetas Salomar dobradas em bandeja de vime',
    intents: ['essenciais', 'beira-mar', 'ilha', 'por-do-sol'],
    tone: 'Multicolor',
    focus: '50% 42%',
  },
  {
    slug: 'escapulario',
    name: 'Escapulário Salomar',
    subtitle: 'Prata e ouro discreto',
    priceCents: 18900,
    categorySlug: 'acessorios',
    material: 'Aço e banho dual',
    fit: 'Ajustável',
    sizes: ['Único'],
    image: '/catalog/escapulario.jpg',
    alt: 'Escapulário Salomar sobre a nuca com pingente retangular',
    intents: ['essenciais', 'por-do-sol'],
    tone: 'Prata',
    focus: '50% 35%',
  },
  {
    slug: 'maio-oceano',
    name: 'Top Oceano',
    subtitle: 'Para o fim da tarde na água',
    priceCents: 21900,
    categorySlug: 'praia',
    material: 'Malha com proteção solar',
    fit: 'Ajustado',
    sizes: ['P', 'M', 'G'],
    image: '/catalog/maio-oceano.jpg',
    alt: 'Top Salomar em tom oceano na pedra ao pôr do sol',
    intents: ['por-do-sol', 'beira-mar'],
    tone: 'Oceano',
    focus: '52% 42%',
  },
]

async function main() {
  const categoryIds = new Map<string, string>()

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: { name: category.name, active: true },
    })
    categoryIds.set(category.slug, saved.id)
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug)
    if (!categoryId) {
      throw new Error(`Categoria não encontrada: ${product.categorySlug}`)
    }

    const { categorySlug: _categorySlug, ...rest } = product
    void _categorySlug

    await prisma.product.upsert({
      where: { slug: product.slug },
      create: { ...rest, categoryId },
      update: { ...rest, categoryId },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
