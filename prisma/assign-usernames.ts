import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '../src/generated/prisma/client'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

function toUsername(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')   // replace invalid chars with _
    .replace(/_+/g, '_')            // collapse multiple underscores
    .replace(/^_|_$/g, '')          // trim leading/trailing underscores
    .slice(0, 20)                   // max 20 chars
    .replace(/^.{0,2}$/, (s) => s.padEnd(3, '0')) // ensure at least 3 chars
}

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, name: true, email: true },
  })

  console.log(`Found ${users.length} users without a username`)
  if (users.length === 0) return

  const taken = new Set(
    (await prisma.user.findMany({ where: { username: { not: null } }, select: { username: true } }))
      .map((u) => u.username!)
  )

  for (const user of users) {
    // Derive base from name, fallback to email local part
    const base = toUsername(user.name ?? user.email.split('@')[0])

    let candidate = base
    let attempt = 1
    while (taken.has(candidate) || candidate.length < 3) {
      candidate = `${base.slice(0, 17)}_${attempt++}`
    }
    taken.add(candidate)

    await prisma.user.update({ where: { id: user.id }, data: { username: candidate } })
    console.log(`  ${user.email} → @${candidate}`)
  }

  console.log('Done!')
}

main().catch(console.error).finally(() => pool.end())
