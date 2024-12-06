import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Helper function to generate timestamps within the last week
const getRandomTimestamp = () => {
  const now = new Date()
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return new Date(pastWeek.getTime() + Math.random() * (now.getTime() - pastWeek.getTime()))
}

const stories = [
  // AI & Machine Learning
  {
    title: "New Language Model Achieves Human-Level Understanding",
    url: "https://example.com/ai/story1",
    author: "airesearcher",
    description: "A breakthrough in natural language processing demonstrates human-level comprehension across multiple languages and contexts.",
    timestamp: getRandomTimestamp(),
    category: "AI"
  },
  {
    title: "Breakthrough in Neural Network Efficiency Reduces Training Time by 80%",
    url: "https://example.com/ai/story2",
    author: "deeplearner",
    description: "New optimization technique significantly reduces the computational resources required for training large neural networks.",
    timestamp: getRandomTimestamp(),
    category: "AI"
  },
  {
    title: "AI System Masters Strategic Board Games Without Prior Knowledge",
    url: "https://example.com/ai/story3",
    author: "gameai",
    description: "Revolutionary AI learns complex game strategies from scratch, demonstrating advanced problem-solving capabilities.",
    timestamp: getRandomTimestamp(),
    category: "AI"
  },

  // Robotics
  {
    title: "Boston Dynamics Reveals New Humanoid Design",
    url: "https://example.com/robotics/story1",
    author: "roboticist",
    description: "Latest humanoid robot showcases unprecedented balance and dexterity in complex environments.",
    timestamp: getRandomTimestamp(),
    category: "Robotics"
  },
  {
    title: "Soft Robotics Revolution in Manufacturing",
    url: "https://example.com/robotics/story2",
    author: "factorybot",
    description: "New soft robotic systems transform manufacturing processes with adaptable, gentle manipulation capabilities.",
    timestamp: getRandomTimestamp(),
    category: "Robotics"
  },
  {
    title: "Micro-Robots Successfully Navigate Human Bloodstream",
    url: "https://example.com/robotics/story3",
    author: "medbot",
    description: "Microscopic robots demonstrate precise navigation through blood vessels, opening new possibilities for medical treatments.",
    timestamp: getRandomTimestamp(),
    category: "Robotics"
  },

  // Materials Science
  {
    title: "Self-Healing Concrete Shows Promise in Tests",
    url: "https://example.com/materials/story1",
    author: "materialscientist",
    description: "Revolutionary concrete material demonstrates ability to repair cracks automatically, extending infrastructure lifespan.",
    timestamp: getRandomTimestamp(),
    category: "Materials"
  },
  {
    title: "New Metamaterial Bends Light Backwards",
    url: "https://example.com/materials/story2",
    author: "physicist",
    description: "Engineered metamaterial exhibits negative refractive index, paving way for improved optical devices.",
    timestamp: getRandomTimestamp(),
    category: "Materials"
  },
  {
    title: "Graphene-Based Battery Charges in 5 Seconds",
    url: "https://example.com/materials/story3",
    author: "grapheneguru",
    description: "New battery technology utilizing graphene demonstrates ultra-fast charging capabilities while maintaining high capacity.",
    timestamp: getRandomTimestamp(),
    category: "Materials"
  },

  // Quantum Computing
  {
    title: "1000-Qubit Quantum Computer Milestone Reached",
    url: "https://example.com/quantum/story1",
    author: "quantumdev",
    description: "Major breakthrough in quantum computing as researchers achieve stable 1000-qubit system.",
    timestamp: getRandomTimestamp(),
    category: "Quantum"
  },
  {
    title: "Quantum Internet Prototype Goes Live",
    url: "https://example.com/quantum/story2",
    author: "qubits",
    description: "First demonstration of quantum internet infrastructure shows promising results for secure communication.",
    timestamp: getRandomTimestamp(),
    category: "Quantum"
  },
  {
    title: "Room Temperature Quantum Computing Breakthrough",
    url: "https://example.com/quantum/story3",
    author: "quantumphysicist",
    description: "Scientists achieve quantum coherence at room temperature, eliminating need for extreme cooling.",
    timestamp: getRandomTimestamp(),
    category: "Quantum"
  },

  // Space Technology
  {
    title: "SpaceX Successfully Tests New Raptor Engine",
    url: "https://example.com/space/story1",
    author: "rocketeer",
    description: "Next-generation rocket engine demonstrates record-breaking performance in latest tests.",
    timestamp: getRandomTimestamp(),
    category: "Space"
  },
  {
    title: "NASA's New Space Telescope Spots Earth-like Planet",
    url: "https://example.com/space/story2",
    author: "astronomer",
    description: "Advanced space telescope discovers potentially habitable planet with atmospheric signatures similar to Earth.",
    timestamp: getRandomTimestamp(),
    category: "Space"
  },
  {
    title: "Private Company Announces Lunar Mining Mission",
    url: "https://example.com/space/story3",
    author: "moonminer",
    description: "Commercial space company reveals plans for first private lunar resource extraction mission.",
    timestamp: getRandomTimestamp(),
    category: "Space"
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
