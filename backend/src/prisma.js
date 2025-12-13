import { PrismaClient } from '@prisma/client'

let prismaGlobal = globalThis.prisma || null

if (!prismaGlobal) {
  prismaGlobal = new PrismaClient({
    log: ['error', 'warn'], // opcional
  })
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prismaGlobal
}

export const prisma = prismaGlobal
