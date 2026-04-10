#!/usr/bin/env node

/**
 * TechPulse Demo Seeder
 * Seeds the database with sample articles for demo purposes.
 * Run with: npm run seed (from backend dir)
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(join(__dirname, '..'));

import { getDb, closeDb } from '../backend/db/database.js';

const demoArticles = [
  {
    title: 'OpenAI Unveils GPT-5 with Advanced Reasoning Capabilities',
    source_name: 'TechCrunch',
    source_url: 'https://techcrunch.com/feed/',
    original_link: 'https://techcrunch.com/2026/04/08/openai-gpt5-launch',
    original_content: 'OpenAI has officially launched GPT-5, its most advanced language model to date. The new model features significant improvements in mathematical reasoning, code generation, and multimodal understanding. Early benchmarks show a 40% improvement over GPT-4o in complex reasoning tasks.',
    summary: 'OpenAI Launches GPT-5 with Major Reasoning Upgrades\n\n• OpenAI has released GPT-5, featuring dramatically improved reasoning and code generation capabilities with 40% better performance on complex tasks.\n• The model introduces a new "chain-of-thought" architecture that allows it to break down problems more effectively before generating responses.\n• Multimodal capabilities have been expanded, with native video understanding and real-time image analysis now built into the core model.\n• Enterprise pricing starts at $60/month, while a free tier remains available with limited daily usage.\n• Competitors Google and Anthropic are expected to respond with their own next-generation models within the coming months.',
    published_at: new Date().toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'Critical Zero-Day Vulnerability Discovered in Major Cloud Platform',
    source_name: 'Ars Technica',
    source_url: 'https://feeds.arstechnica.com/arstechnica/index',
    original_link: 'https://arstechnica.com/2026/04/cloud-zero-day',
    original_content: 'Security researchers have identified a critical zero-day vulnerability affecting a major cloud computing platform. The flaw could allow unauthorized access to customer data across multiple regions. Emergency patches are being deployed.',
    summary: 'Critical Cloud Security Vulnerability Sends Industry into Emergency Response\n\n• A severe zero-day vulnerability has been discovered in a leading cloud platform, potentially exposing millions of customer accounts to unauthorized access.\n• The vulnerability exploits a flaw in the authentication token refresh mechanism, allowing attackers to escalate privileges across tenant boundaries.\n• Emergency patches have been deployed by the vendor, with a full fix expected within 48 hours. Users are urged to rotate all API keys immediately.\n• CISA has issued an emergency directive requiring all federal agencies to assess their exposure and implement mitigations.\n• This marks the third major cloud security incident in 2026, raising questions about shared-responsibility security models.',
    published_at: new Date(Date.now() - 3600000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'SpaceX Successfully Tests Starship Full Orbital Refueling',
    source_name: 'The Verge',
    source_url: 'https://www.theverge.com/rss/index.xml',
    original_link: 'https://theverge.com/2026/04/starship-refueling',
    original_content: 'SpaceX achieved a major milestone today with the first successful orbital refueling test of the Starship vehicle. The test demonstrated the ability to transfer cryogenic propellant between two Starship vehicles in orbit.',
    summary: 'SpaceX Achieves Historic Orbital Refueling Milestone\n\n• SpaceX has completed the first-ever successful orbital refueling between two Starship vehicles, a critical milestone for deep-space missions and NASA\'s Artemis program.\n• The test transferred approximately 10 metric tons of liquid oxygen and methane between a tanker Starship and the receiving vehicle in low Earth orbit.\n• This technology is essential for SpaceX\'s plans to send humans to Mars, as Starship requires multiple refueling operations to reach the red planet.\n• NASA Administrator praised the achievement as "a game-changer for human space exploration" and confirmed it validates the architecture for the Artemis lunar lander.\n• SpaceX plans to conduct full-capacity refueling tests later this year, targeting a complete fill to demonstrate deep-space readiness.',
    published_at: new Date(Date.now() - 7200000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'Rust Overtakes C++ in Systems Programming Popularity Index',
    source_name: 'Hacker News',
    source_url: 'https://hnrss.org/frontpage',
    original_link: 'https://hnrss.org/2026/04/rust-overtakes-cpp',
    original_content: 'According to the latest TIOBE Index and Stack Overflow Developer Survey, Rust has officially overtaken C++ as the most popular systems programming language. The shift reflects growing adoption in operating systems, embedded devices, and security-critical applications.',
    summary: 'Rust Surpasses C++ as Top Systems Language for First Time\n\n• Rust has overtaken C++ in the TIOBE Index for the first time, marking a historic shift in the systems programming landscape driven by memory safety demands.\n• Major tech companies including Microsoft, Google, and Amazon have accelerated their migration of critical infrastructure code from C++ to Rust over the past two years.\n• The Linux kernel now contains over 100,000 lines of Rust code, with key subsystems like network drivers being rewritten for safety.\n• The 2026 Stack Overflow Developer Survey shows 87% of Rust developers report "loving" the language, the highest satisfaction rating of any language.\n• Industry experts note that regulatory pressure for memory-safe languages, particularly from CISA and the White House, has been a major driver of enterprise Rust adoption.',
    published_at: new Date(Date.now() - 10800000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'Apple Introduces Neural Engine Chip Designed Specifically for On-Device AI',
    source_name: 'MIT Tech Review',
    source_url: 'https://www.technologyreview.com/feed/',
    original_link: 'https://technologyreview.com/2026/04/apple-neural-chip',
    original_content: 'Apple has unveiled a new chip architecture dedicated entirely to on-device AI processing. The Neural Engine M4 Ultra can run 70B parameter models locally without cloud connectivity, marking a major shift in edge AI computing.',
    summary: 'Apple\'s New Neural Engine M4 Ultra Runs 70B AI Models On-Device\n\n• Apple has announced the M4 Ultra Neural Engine, a dedicated AI chip capable of running 70-billion parameter language models entirely on-device without internet connectivity.\n• The chip features 32 neural engine cores with a unified 192GB memory architecture, enabling it to load and run large models that previously required cloud infrastructure.\n• Privacy advocates celebrate the move, as sensitive data never leaves the device — a stark contrast to cloud-dependent AI services from competitors.\n• Apple Intelligence features powered by the new chip include real-time language translation, advanced photo/video editing, and a dramatically improved Siri with contextual reasoning.\n• The chip will debut in the Mac Pro and Mac Studio this fall, with mobile variants expected in the iPhone 18 Pro lineup.',
    published_at: new Date(Date.now() - 14400000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'EU Passes Comprehensive AI Liability Framework',
    source_name: 'TechCrunch',
    source_url: 'https://techcrunch.com/feed/',
    original_link: 'https://techcrunch.com/2026/04/eu-ai-liability',
    original_content: 'The European Union has passed a comprehensive AI liability framework that holds developers accountable for damages caused by AI systems. The legislation introduces strict liability for high-risk AI applications and creates a new regulatory body for enforcement.',
    summary: 'EU Enacts Landmark AI Liability Law Holding Developers Accountable\n\n• The European Parliament has passed the AI Liability Directive, creating the world\'s first comprehensive framework for holding AI developers legally responsible for damages caused by their systems.\n• High-risk AI applications in healthcare, financial services, and autonomous systems will face strict liability — meaning victims don\'t need to prove fault, only that harm occurred.\n• A new EU AI Safety Board has been established with enforcement powers including fines up to 7% of global revenue for non-compliance.\n• Tech industry groups have criticized the framework as overly broad, warning it could discourage AI innovation in Europe and push startups to other jurisdictions.\n• The law takes effect in 18 months, giving companies time to implement compliance measures and obtain certifications for high-risk AI systems.',
    published_at: new Date(Date.now() - 18000000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'Quantum Computing Startup Demonstrates 1000-Qubit Error-Corrected Processor',
    source_name: 'Ars Technica',
    source_url: 'https://feeds.arstechnica.com/arstechnica/index',
    original_link: 'https://arstechnica.com/2026/04/quantum-1000-qubit',
    original_content: 'A quantum computing startup has demonstrated a 1000-qubit processor with full error correction, a milestone many thought was years away. The system maintains quantum coherence for over 10 seconds, enabling practical quantum algorithms.',
    summary: 'Quantum Breakthrough: 1000-Qubit Error-Corrected Processor Achieved\n\n• A quantum computing startup has demonstrated a fully error-corrected 1000-logical-qubit processor, crossing a threshold many experts believed was still 3-5 years away.\n• The system uses a novel topological qubit architecture that maintains quantum coherence for over 10 seconds, dramatically exceeding the milliseconds typical of current systems.\n• Early benchmarks show the processor can solve certain optimization and cryptography problems millions of times faster than the most powerful classical supercomputers.\n• The implications for cybersecurity are significant, as the processor can theoretically break RSA-2048 encryption, accelerating the urgency for post-quantum cryptographic standards.\n• Major financial institutions and pharmaceutical companies have already signed early access agreements to explore drug discovery and portfolio optimization applications.',
    published_at: new Date(Date.now() - 21600000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
  {
    title: 'GitHub Copilot Workspace Now Autonomously Handles Full Feature Development',
    source_name: 'Hacker News',
    source_url: 'https://hnrss.org/frontpage',
    original_link: 'https://hnrss.org/2026/04/copilot-workspace-auto',
    original_content: 'GitHub has launched the general availability of Copilot Workspace, an AI-powered development environment that can autonomously plan, code, test, and deploy entire features from natural language descriptions. Early adopters report 5x productivity gains.',
    summary: 'GitHub Copilot Workspace Goes GA — Plans, Codes, and Deploys Autonomously\n\n• GitHub Copilot Workspace is now generally available, offering an AI development environment that can autonomously handle the entire software development lifecycle from planning to deployment.\n• Developers describe features in natural language, and the system creates implementation plans, writes code across multiple files, generates tests, and opens pull requests.\n• Early enterprise adopters report 3-5x productivity improvements, with some teams shipping features that previously took weeks in just days.\n• The system includes built-in safeguards including mandatory human review before merge, automated security scanning, and rollback capabilities.\n• GitHub CEO Thomas Dohmke emphasizes this is "AI pair programming evolved," not developer replacement, noting that senior engineering judgment remains essential for architecture and review.',
    published_at: new Date(Date.now() - 25200000).toISOString(),
    summarized_at: new Date().toISOString(),
  },
];

function seed() {
  console.log('🌱 Seeding demo articles...\n');
  const db = getDb();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO articles (title, source_name, source_url, original_link, original_content, summary, published_at, summarized_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((articles) => {
    for (const a of articles) {
      insert.run(
        a.title, a.source_name, a.source_url, a.original_link,
        a.original_content, a.summary, a.published_at, a.summarized_at
      );
    }
  });

  insertMany(demoArticles);

  const count = db.prepare('SELECT COUNT(*) as count FROM articles').get();
  console.log(`✅ Seeded! Total articles in DB: ${count.count}`);
  closeDb();
}

seed();
