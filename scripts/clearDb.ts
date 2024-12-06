const { PrismaClient} = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    console.log('Starting to clear stories database.')

    // Delete all stories 
    const delCount = await prisma.story.deleteMany({})
    console.log('Successfully deleted ${delCount} stories.')

  } catch (error) {
    console.error('Error clearing database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute if run directly 
if (require.main === module) {
  clearDatabase()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = clearDatabase
