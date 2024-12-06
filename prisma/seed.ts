import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const stories = [
  {
    title: "New Language Model Achieves Human-Level Understanding",
    url: "https://example.com/story1",
    points: 342,
    author: "airesearcher",
    comments: 145,
    timestamp: new Date("2024-03-27T10:00:00Z"),
    category: "AI"
  },
  {
    title: "Breakthrough in Neural Network Efficiency",
    url: "https://example.com/story2",
    points: 256,
    author: "deeplearner",
    comments: 89,
    timestamp: new Date("2024-03-27T08:00:00Z"),
    category: "AI"
  },
  {
    title: "Boston Dynamics Reveals New Humanoid Design",
    url: "https://example.com/story3",
    points: 421,
    author: "roboticist",
    comments: 234,
    timestamp: new Date("2024-03-27T11:00:00Z"),
    category: "Robots"
  },
  {
    title: "Soft Robotics Revolution in Manufacturing",
    url: "https://example.com/story4",
    points: 198,
    author: "factorybot",
    comments: 67,
    timestamp: new Date("2024-03-27T09:00:00Z"),
    category: "Robots"
  },
  {
    title: "Self-Healing Concrete Shows Promise in Tests",
    url: "https://example.com/story5",
    points: 287,
    author: "materialscientist",
    comments: 156,
    timestamp: new Date("2024-03-27T07:00:00Z"),
    category: "Materials"
  },
  {
    title: "New Metamaterial Bends Light Backwards",
    url: "https://example.com/story6",
    points: 312,
    author: "physicist",
    comments: 178,
    timestamp: new Date("2024-03-27T10:00:00Z"),
    category: "Materials"
  },
  {
    title: "1000-Qubit Quantum Computer Milestone Reached",
    url: "https://example.com/story7",
    points: 567,
    author: "quantumdev",
    comments: 289,
    timestamp: new Date("2024-03-27T11:00:00Z"),
    category: "Quantum"
  },
  {
    title: "Quantum Internet Prototype Goes Live",
    url: "https://example.com/story8",
    points: 423,
    author: "qubits",
    comments: 201,
    timestamp: new Date("2024-03-27T08:00:00Z"),
    category: "Quantum"
  }
]

async function main() {
  console.log('Start seeding...')
  
  // Clear existing data
  await prisma.story.deleteMany()
  
  // Insert stories
  for (const story of stories) {
    const createdStory = await prisma.story.create({
      data: story,
    })
    console.log(`Created story with id: ${createdStory.id}`)
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
