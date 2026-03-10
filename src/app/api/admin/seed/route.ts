import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, unauthorizedResponse } from "@/lib/auth";
import bcrypt from "bcrypt";

// ── Realistic data pools ──────────────────────────────────────────────────────

const FIRST_NAMES = [
  "bob", "jo", "sam", "ed", "mike", "kim", "sue", "pat", "ray", "ann",
  "emily", "marcus", "sarah", "james", "olivia", "jessica", "alex",
  "nathan", "priya", "lucas", "sophia", "raj", "zara", "felix", "nadia",
  "christopher", "bartholomew", "alexandra", "nathaniel", "penelope",
];

const LAST_NAMES = [
  "smith", "li", "wu", "chen", "brown", "davis", "kim", "jones", "taylor",
  "wilson", "patel", "cohen", "garcia", "lee", "morgan", "nguyen", "miller",
  "roberts", "walsh", "yamamoto", "pemberton", "montgomery", "hayes",
];

const EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "proton.me",
  "hotmail.com", "icloud.com", "me.com", "hey.com",
];

// Realistic link templates — mix of minimal, partial, and fully populated
const LINK_TEMPLATES = [
  // Minimal — no category, no description, no author
  { title: "My favourite bash one-liners", url: "https://github.com/nickel/bash-tricks" },
  { title: "Quick note to self", url: "https://notes.example.com/q9xmz" },
  { title: "Interesting thread", url: "https://news.ycombinator.com/item?id=39812345" },
  { title: "Bookmark for later", url: "https://www.bbc.com/news/technology-67890123" },
  { title: "Read this again", url: "https://paulgraham.com/vb.html" },
  // Uncategorized with short description
  { title: "Why I quit social media", url: "https://medium.com/@dev/why-i-quit-social-media", description: "A personal essay." },
  { title: "Dark patterns in UI design", url: "https://www.darkpatterns.org/", description: "Short overview of manipulative UI patterns." },
  { title: "The Pomodoro Technique", url: "https://todoist.com/productivity-methods/pomodoro-technique", description: "25 min focused sprints, 5 min breaks." },
  // Partial
  { title: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762", category: "AI" },
  { title: "Mistral 7B: A New Open-Source Language Model", url: "https://mistral.ai/news/announcing-mistral-7b/", category: "AI" },
  { title: "Copilot in VS Code: the good and the bad", url: "https://dev.to/copilot-review-2024", category: "Dev" },
  { title: "How Black Holes Distort Space-Time", url: "https://www.nasa.gov/black-holes-space-time/", category: "Space" },
  { title: "Federer: The greatest of all time?", url: "https://www.bbc.com/sport/tennis/federer-goat", category: "Sport" },
  { title: "Pitchfork's 50 Best Albums of 2024", url: "https://pitchfork.com/features/lists-and-guides/best-albums-2024/", category: "Music" },
  { title: "Sourdough starter guide for beginners", url: "https://www.seriouseats.com/sourdough-starter-guide", category: "Food" },
  { title: "The Ethics of Autonomous Vehicles", url: "https://aeon.co/essays/ethics-self-driving-cars", category: "Philosophy" },
  // Fully populated
  {
    title: "GPT-4 Technical Report — What We Know So Far",
    url: "https://openai.com/research/gpt-4",
    category: "AI",
    description: "A detailed breakdown of OpenAI's GPT-4 technical report, covering model architecture decisions, training data, safety evaluations, and the performance benchmarks that set new records across a wide range of academic and professional exams.",
    author: "OpenAI Research",
    publicationYear: 2024, publicationMonth: 3, publicationDay: 15,
    isPublic: true,
  },
  {
    title: "CRISPR Gene Editing Cures Rare Blood Disorders in Trial",
    url: "https://www.nature.com/articles/crispr-blood-trial-2024",
    category: "Science",
    description: "Clinical trial results show that CRISPR-based gene therapy achieved functional cures in patients with sickle cell disease and beta thalassaemia, marking a watershed moment for genomic medicine.",
    author: "Jennifer Doudna Lab",
    publicationYear: 2024, publicationMonth: 6, publicationDay: 2,
    isPublic: true,
  },
  {
    title: "Premier League: City's Title Charge Stalls Again",
    url: "https://www.bbc.com/sport/football/premier-league-city-2024",
    category: "Sport",
    description: "Manchester City dropped crucial points at Anfield as Liverpool's resilient performance raised serious doubts about the champion's ability to clinch a fifth consecutive title.",
    author: "Phil McNulty",
    publicationYear: 2024, publicationMonth: 11, publicationDay: 24,
    isPublic: true,
  },
  {
    title: "The Rise and Fall of Silicon Valley Bank",
    url: "https://www.ft.com/content/svb-collapse-analysis",
    category: "Finance",
    description: "An in-depth look at how SVB's concentration in tech startups, combined with aggressive interest rate rises and a classic bank run amplified by social media, caused the largest bank failure since 2008.",
    author: "Lex Column",
    publicationYear: 2023, publicationMonth: 3, publicationDay: 18,
    isPublic: false,
  },
  {
    title: "Taylor Swift's Eras Tour: By the Numbers",
    url: "https://www.rollingstone.com/music/eras-tour-numbers",
    category: "Music",
    description: "Rolling Stone analyses how the Eras Tour became the highest-grossing concert tour in history, breaking every record from attendance to merchandise revenue across 52 countries.",
    author: "Rob Sheffield",
    publicationYear: 2024, publicationMonth: 8, publicationDay: 9,
    isPublic: true,
  },
  {
    title: "Rust in the Linux Kernel: One Year On",
    url: "https://lwn.net/Articles/rust-kernel-one-year/",
    category: "Dev",
    description: "A retrospective on the controversial but ultimately successful introduction of Rust into the Linux kernel, covering memory safety wins, toolchain challenges, and what the kernel community learned.",
    author: "Jonathan Corbet",
    publicationYear: 2024, publicationMonth: 1, publicationDay: 30,
    isPublic: true,
  },
  {
    title: "SpaceX Starship Completes Full Stack Catch — What It Means",
    url: "https://www.nasaspaceflight.com/starship-catch-analysis",
    category: "Space",
    description: "The successful catch of Starship's Super Heavy booster by the launch tower arms marks a pivotal engineering achievement. We examine the implications for launch cadence, refurbishment costs, and SpaceX's Mars timeline.",
    author: "Michael Baylor",
    publicationYear: 2024, publicationMonth: 10, publicationDay: 13,
    isPublic: true,
  },
  {
    title: "Nietzsche and the Will to Power: A Modern Reading",
    url: "https://aeon.co/essays/nietzsche-will-to-power-modern",
    category: "Philosophy",
    description: "Contemporary philosophers reassess Nietzsche's most misunderstood concept, arguing that the will to power is not a call to domination but a nuanced account of self-overcoming and creative vitality.",
    author: "Brian Leiter",
    publicationYear: 2023, publicationMonth: 9, publicationDay: 5,
    isPublic: true,
  },
  {
    title: "Building a Design System From Scratch in 2024",
    url: "https://www.smashingmagazine.com/design-system-2024/",
    category: "Design",
    description: "A comprehensive walkthrough of building a scalable design system: token architecture, component API decisions, documentation strategies, and the organisational challenges that kill most design system initiatives.",
    author: "Vitaly Friedman",
    publicationYear: 2024, publicationMonth: 4, publicationDay: 22,
    isPublic: false,
  },
  {
    title: "NHS Facing Worst Winter Crisis in a Decade",
    url: "https://www.theguardian.com/society/nhs-winter-crisis-2024",
    category: "Health",
    description: "Emergency departments across England are reporting record 12-hour waits as the NHS enters winter with fewer beds, a depleted workforce, and a respiratory illness surge exceeding all previous years.",
    author: "Denis Campbell",
    publicationYear: 2024, publicationMonth: 12, publicationDay: 3,
    isPublic: true,
  },
  // A few more varied ones
  {
    title: "Ukraine War: Analysis of the Winter Offensive",
    url: "https://www.reuters.com/world/europe/ukraine-winter-offensive-2024",
    category: "World",
    description: "Military analysts break down the strategic situation as Ukraine and Russia enter another winter of conflict, examining supply lines, troop morale, and the impact of continued Western military aid.",
    author: "Reuters Bureau",
    publicationYear: 2024, publicationMonth: 12, publicationDay: 1,
    isPublic: true,
  },
  { title: "Beginner fingerpicking patterns for acoustic guitar", url: "https://www.justinguitar.com/lessons/fingerpicking-basics", category: "Guitar" },
  { title: "Michelin Star Ramen in Tokyo — A Guide", url: "https://www.eater.com/tokyo-ramen-guide", category: "Food" },
  { title: "The Renaissance of American Third Parties", url: "https://www.politico.com/third-parties-2024", category: "Politics" },
  { title: "How Ancient Rome Fell: Revisiting the Debate", url: "https://www.smithsonianmag.com/history/fall-of-rome-revisited", category: "History" },
  { title: "Minecraft Sells 300 Million Copies: What Makes It Timeless?", url: "https://www.ign.com/articles/minecraft-300-million", category: "Entertainment" },
  // Uncategorized with medium description
  {
    title: "The case against productivity culture",
    url: "https://www.theatlantic.com/culture/archive/2023/productivity-culture",
    description: "A thoughtful pushback against the obsession with optimising every hour of the day, arguing that rest and aimlessness are not just acceptable but essential.",
    author: "Cal Newport",
    publicationYear: 2023, publicationMonth: 7, publicationDay: 14,
    isPublic: true,
  },
  // Uncategorized with very long description
  {
    title: "A complete history of the internet: from ARPANET to the AI era",
    url: "https://www.wired.com/story/history-of-the-internet/",
    description: "This sweeping 10,000-word retrospective traces the internet's origins in Cold War military research, through the creation of TCP/IP, the birth of the World Wide Web at CERN, the browser wars of the 1990s, the dot-com boom and bust, the rise of social media platforms, the smartphone revolution that put the web in every pocket, and now the emergence of large language models and AI-generated content that are once again reshaping what the internet is and who it serves. Essential reading for anyone who wants to understand how we got here and where the next decade might take us.",
    author: "Steven Levy",
    publicationYear: 2024, publicationMonth: 5, publicationDay: 20,
    isPublic: true,
  },
  // Partial, uncategorized, no description
  { title: "Vim cheatsheet I keep coming back to", url: "https://devhints.io/vim", author: "Rico Sta. Cruz" },
  { title: "Carbon footprint of AI training runs", url: "https://mlco2.github.io/impact/", isPublic: true },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseLinksRange(val: string | number): { min: number; max: number } {
  const s = String(val).trim();
  const range = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (range) {
    const a = Math.max(1, parseInt(range[1], 10));
    const b = Math.max(1, parseInt(range[2], 10));
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const n = Math.max(1, parseInt(s, 10) || 3);
  return { min: n, max: n };
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function uniqueUsername(base: string, taken: Set<string>): string {
  let name = base.slice(0, 28);
  if (!taken.has(name)) { taken.add(name); return name; }
  for (let i = 2; i < 999; i++) {
    const candidate = `${name.slice(0, 25)}_${i}`;
    if (!taken.has(candidate)) { taken.add(candidate); return candidate; }
  }
  return `${name.slice(0, 20)}_${Date.now()}`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET — list all test users with link counts
export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const users = await prisma.user.findMany({
    where: { isTestUser: true },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      _count: { select: { links: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST — generate test users and links
export async function POST(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const { userCount = 5, linksPerUser = "3", password = "testpass123" } = await request.json().catch(() => ({}));
  const linksRange = parseLinksRange(linksPerUser);

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Fetch taken usernames to avoid collisions
  const existing = await prisma.user.findMany({ select: { username: true } });
  const taken = new Set(existing.map((u) => u.username));

  const createdUsers: { id: string; username: string; linkCount: number }[] = [];

  for (let i = 0; i < userCount; i++) {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const domain = pick(EMAIL_DOMAINS);

    const baseUsername = Math.random() < 0.3 ? first : `${first}_${last.slice(0, 8)}`;
    const username = uniqueUsername(baseUsername, taken);
    const emailVariant = Math.random();
    const email = emailVariant < 0.33
      ? `${first}.${last}@${domain}`
      : emailVariant < 0.66
        ? `${username}@${domain}`
        : `${first}${Math.floor(Math.random() * 999)}@${domain}`;

    const user = await prisma.user.create({
      data: { username, email, passwordHash, isTestUser: true },
    });

    // Generate links for this user
    const shuffled = [...LINK_TEMPLATES].sort(() => Math.random() - 0.5);
    const linkCount = randomInt(linksRange.min, linksRange.max);
    // Each user gets a random public ratio: some share nothing, some share everything, most mixed
    const publicRatio = Math.random();

    for (let j = 0; j < linkCount; j++) {
      const tpl = shuffled[j % shuffled.length];
      // Vary timestamp so links don't all appear at the same time
      const daysAgo = Math.floor(Math.random() * 180);
      const ts = new Date(Date.now() - daysAgo * 86400000);

      await prisma.link.create({
        data: {
          title: tpl.title,
          url: tpl.url,
          category: tpl.category ?? null,
          description: tpl.description ?? null,
          author: tpl.author ?? null,
          publicationYear: tpl.publicationYear ?? null,
          publicationMonth: tpl.publicationMonth ?? null,
          publicationDay: tpl.publicationDay ?? null,
          isPublic: Math.random() < publicRatio,
          createdById: user.id,
          timestamp: ts,
        },
      });
    }

    createdUsers.push({ id: user.id, username, linkCount });
  }

  // Voting pass — after all users and links exist
  const allPublicLinks = await prisma.link.findMany({
    where: { createdById: { in: createdUsers.map((u) => u.id) }, isPublic: true, deletedAt: null },
    select: { id: true },
  });

  if (allPublicLinks.length > 0) {
    for (const voter of createdUsers) {
      const activity = Math.random(); // uniform 0–1; ~15% never vote
      if (activity < 0.15) continue;

      const maxVotes = Math.max(1, Math.round(activity * allPublicLinks.length));
      const pool = [...allPublicLinks].sort(() => Math.random() - 0.5);
      const toVote = pool.slice(0, randomInt(1, maxVotes));

      for (const link of toVote) {
        await prisma.vote.create({
          data: { linkId: link.id, userId: voter.id, count: randomInt(1, 3) },
        });
      }
    }
  }

  return NextResponse.json({ created: createdUsers });
}

// DELETE — remove ALL test users (and their links via cascade)
export async function DELETE(request: Request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  const testUsers = await prisma.user.findMany({
    where: { isTestUser: true },
    select: { id: true },
  });
  const ids = testUsers.map((u) => u.id);

  // Hard-delete votes, links, then users (cascade doesn't auto-run on deleteMany)
  await prisma.vote.deleteMany({ where: { userId: { in: ids } } });
  await prisma.link.deleteMany({ where: { createdById: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ deleted: ids.length });
}
