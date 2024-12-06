const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Helper function to generate random timestamps within the last month
const getRandomTimestamp = () => {
  const now = new Date()
  const pastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return new Date(pastMonth.getTime() + Math.random() * (now.getTime() - pastMonth.getTime()))
}

// Generate multiple stories for AI category
const generateAIStories = () => [
  {
    title: "GPT-4 Demonstrates Advanced Reasoning Capabilities",
    url: "https://example.com/ai/gpt4-reasoning",
    description: "Latest tests show unprecedented problem-solving abilities in language models",
    author: "ai_researcher",
    timestamp: getRandomTimestamp(),
    category: "AI"
  },
  {
    title: "Neural Networks Learn in Record Time with New Algorithm",
    url: "https://example.com/ai/fast-learning",
    description: "Breakthrough reduces training time by 90% while maintaining accuracy",
    author: "deep_learner",
    timestamp: getRandomTimestamp(),
    category: "AI"
  }
];

// Generate multiple stories for each category
const generateMoreStories = () => {
  const stories = [];
  
  // Generate 25 AI stories
  for (let i = 0; i < 25; i++) {
    stories.push({
      title: `AI Breakthrough ${i + 1}: ${['Neural Networks', 'Machine Learning', 'Deep Learning', 'Natural Language'][i % 4]}`,
      url: `https://example.com/ai/story${i}`,
      description: `Amazing advancement in artificial intelligence field ${i + 1}`,
      author: `ai_researcher_${i}`,
      timestamp: getRandomTimestamp(),
      category: "AI"
    });
  }
  
  // Generate 25 Robotics stories
  for (let i = 0; i < 25; i++) {
    stories.push({
      title: `Robotics Innovation ${i + 1}: ${['Humanoid', 'Industrial', 'Medical', 'Nano'][i % 4]}`,
      url: `https://example.com/robotics/story${i}`,
      description: `Groundbreaking development in robotics technology ${i + 1}`,
      author: `robotics_eng_${i}`,
      timestamp: getRandomTimestamp(),
      category: "Robotics"
    });
  }
  
  // Generate 25 Space stories
  for (let i = 0; i < 25; i++) {
    stories.push({
      title: `Space Discovery ${i + 1}: ${['Mars', 'Jupiter', 'Exoplanets', 'Black Holes'][i % 4]}`,
      url: `https://example.com/space/story${i}`,
      description: `Fascinating space exploration finding ${i + 1}`,
      author: `astronomer_${i}`,
      timestamp: getRandomTimestamp(),
      category: "Space"
    });
  }
  
  // Generate 25 Quantum stories
  for (let i = 0; i < 25; i++) {
    stories.push({
      title: `Quantum Computing Update ${i + 1}: ${['Qubits', 'Entanglement', 'Superposition', 'Error Correction'][i % 4]}`,
      url: `https://example.com/quantum/story${i}`,
      description: `Latest advancement in quantum computing research ${i + 1}`,
      author: `quantum_scientist_${i}`,
      timestamp: getRandomTimestamp(),
      category: "Quantum"
    });
  }
  
  return stories;
};

// Combine all stories
const allStories = [
  ...generateAIStories(),
  ...generateMoreStories()
];

async function main() {
  console.log('Start seeding...')
  
  // Clear existing data
  await prisma.story.deleteMany()
  
  // Insert stories
  for (const story of allStories) {
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
