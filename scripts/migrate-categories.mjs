// Migrates links from old categories to new ones, and cleans up removed categories.
// Run with: node scripts/migrate-categories.mjs

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Rename Technology → Dev
  const techResult = await prisma.link.updateMany({
    where: { category: 'Technology' },
    data: { category: 'Dev' },
  })
  console.log(`Technology → Dev: ${techResult.count} links`)

  // Rename Conflict → World
  const conflictResult = await prisma.link.updateMany({
    where: { category: 'Conflict' },
    data: { category: 'World' },
  })
  console.log(`Conflict → World: ${conflictResult.count} links`)

  // Gaming has no equivalent — uncategorize those links
  const gamingResult = await prisma.link.updateMany({
    where: { category: 'Gaming' },
    data: { category: null, isPublic: false },
  })
  console.log(`Gaming → uncategorized (private): ${gamingResult.count} links`)

  // Delete removed categories from Category table
  const removed = ['Technology', 'Conflict', 'Gaming']
  for (const name of removed) {
    await prisma.category.deleteMany({ where: { name } })
    console.log(`Deleted category: ${name}`)
  }

  console.log('Migration complete.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
