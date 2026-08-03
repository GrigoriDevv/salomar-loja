import { PrismaClient } from '../src/generated/prisma'
import { purgeExpiredSensitiveData } from '../src/modules/retention/purge-sensitive-data'

async function main() {
  const prisma = new PrismaClient()
  try {
    const result = await purgeExpiredSensitiveData(prisma)
    console.log(JSON.stringify({ ok: true, ...result }, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
