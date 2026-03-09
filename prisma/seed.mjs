import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


const categories = [
  { name: "AI", icon: "🤖" },
  { name: "ASMR", icon: "🎧" },
  { name: "Business", icon: "💼" },
  { name: "Culture", icon: "🎭" },
  { name: "Design", icon: "🎨" },
  { name: "Dev", icon: "💻" },
  { name: "Education", icon: "📚" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Finance", icon: "📈" },
  { name: "Food", icon: "🍽️" },
  { name: "Guitar", icon: "🎸" },
  { name: "Health", icon: "🏥" },
  { name: "History", icon: "📜" },
  { name: "Music", icon: "🎵" },
  { name: "Philosophy", icon: "🧠" },
  { name: "Politics", icon: "🏛️" },
  { name: "Science", icon: "🔬" },
  { name: "Space", icon: "🚀" },
  { name: "Spicy", icon: "🌶️" },
  { name: "Sport", icon: "⚽" },
  { name: "World", icon: "🌍" },
]

async function main() {
  console.log('Start seeding...')

  // Upsert categories (safe to run multiple times)
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon },
      create: { name: category.name, icon: category.icon, isPublic: true },
    })
    console.log(`Upserted category: ${category.icon} ${category.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
