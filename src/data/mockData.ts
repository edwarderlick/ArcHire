import { Agent, Job, Transaction } from '../types';

export const mockAgents: Agent[] = [
  {
    id: 'vectormind',
    name: 'VectorMind',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChXfH6e5TBQmFy253-ie8Wgg77OKkfIONP1VpFeVnHj_PhykXq4mHrzBGxBctyXz8Z3WVu8HWDYie9o_KRbDYK1b55QKgDeXeinDxFo2nA54qT0YbLY_9gJKRxzUuNqYOYAXA1aNY_OLF_--7azkXor4zSG7Ioufk8pKlAtdPEMDGwhBWdWyoHFYWWMl6r05P5R8KEpfGTS_1gq-PqdnTxwIqK2dVKpd6A392usTJPGIjjrHnztQEUAYa2g6jESR6fV7JavLjvfv0',
    category: 'data',
    title: 'Advanced Data Processing & Creative Content Synthesis Specialist',
    description: 'Specialized in rapid info synthesis, structured data transformation, and perfect JSON pipelines.',
    longDescription: 'VectorMind is a high-performance neural architecture specialized in rapid information synthesis and structured data transformation. Designed for precision, this agent can parse complex documents, generate high-fidelity technical content, and automate repetitive data workflows with a 99.8% accuracy rate.\n\nWhether you need a full audit of your financial spreadsheets or a creative deep-dive into market trends, VectorMind leverages real-time indexing to deliver results that are ready for immediate deployment.',
    pricePerTask: 0.50,
    rating: 4.9,
    reviewCount: 120,
    escrowProtected: true,
    tags: ['Natural Language', 'Data Analysis', 'JSON Automation'],
    jobsCount: 1240,
    avgDeliveryTime: '15m',
    reviews: [
      {
        id: 'r1',
        agentId: 'vectormind',
        reviewerName: 'Alex Rivera',
        rating: 5,
        comment: 'Incredible speed. Handled a 500-page dataset processing in under 10 minutes. The escrow process gave me peace of mind.',
        timeAgo: '2 days ago'
      },
      {
        id: 'r2',
        agentId: 'vectormind',
        reviewerName: 'Sarah Chen',
        rating: 4,
        comment: 'Highly capable at formatting JSON and Markdown perfectly. Will hire again for my next project.',
        timeAgo: '1 week ago'
      },
      {
        id: 'r3',
        agentId: 'vectormind',
        reviewerName: 'Marcus Aurelius',
        rating: 5,
        comment: 'Exceptional precision in automated parsing. Absolute unit of an agent.',
        timeAgo: '2 weeks ago'
      }
    ]
  },
  {
    id: 'copybot',
    name: 'CopyBot',
    avatarUrl: '✍️',
    category: 'writing',
    title: 'Viral SEO and Ad Copy generator',
    description: 'High-conversion sales copy, SEO articles, and catchy Twitter threads in seconds.',
    longDescription: 'CopyBot translates product parameters into copy that converts. Trained on over 100,000 highly successful sales pitches, landing page headlines, and viral social media campaigns. Outfitted with real-time SEO scoring.',
    pricePerTask: 0.50,
    rating: 4.9,
    reviewCount: 1240,
    escrowProtected: true,
    tags: ['SEO', 'Copywriting', 'Ad Copy'],
    jobsCount: 1240,
    avgDeliveryTime: '5m',
    reviews: [
      {
        id: 'r4',
        agentId: 'copybot',
        reviewerName: 'Sophia Lin',
        rating: 5,
        comment: 'My clickthrough rate increased by 40% after using the ad variants CopyBot produced. Fast and effective.',
        timeAgo: '3 days ago'
      },
      {
        id: 'r5',
        agentId: 'copybot',
        reviewerName: 'Devon K.',
        rating: 4.8,
        comment: 'Extremely good. Sometimes needs minor edits for brand guidelines, but saves 90% of composition time.',
        timeAgo: '1 month ago'
      }
    ]
  },
  {
    id: 'designpro',
    name: 'DesignPro',
    avatarUrl: '🎨',
    category: 'image',
    title: 'UI Icons & Illustration generator',
    description: 'Bespoke custom vector elements, UI icons, and tactile 3D emoji representations.',
    longDescription: 'DesignPro leverages advanced diffusion fine-tuned on professional digital marketplace assets. Generates flat icons, detailed app visual concepts, and friendly 3D representations that elevate clean software landing pages.',
    pricePerTask: 1.20,
    rating: 4.8,
    reviewCount: 860,
    escrowProtected: true,
    tags: ['Icons', 'Vectors', '3D UI'],
    jobsCount: 860,
    avgDeliveryTime: '12m',
    reviews: [
      {
        id: 'r6',
        agentId: 'designpro',
        reviewerName: 'Elena Rostova',
        rating: 5,
        comment: 'Brilliant vector styled rendering. Blends into our existing visual designs seamlessly.',
        timeAgo: '5 days ago'
      }
    ]
  },
  {
    id: 'codefix',
    name: 'CodeFix',
    avatarUrl: '💻',
    category: 'code',
    title: 'Advanced Python & Smart Contracts auditor',
    description: 'Find bugs, generate unit tests, write robust solidity scripts, and ensure secure state changes.',
    longDescription: 'CodeFix acts as an fully automated secondary reviewer. Specializes in auditing smart contract files, identifying reentrancy vulnerabilities, gas optimization, and converting complex pseudocode to working Python libraries.',
    pricePerTask: 2.50,
    rating: 5.0,
    reviewCount: 430,
    escrowProtected: true,
    tags: ['Solidity', 'Python', 'Auditing'],
    jobsCount: 430,
    avgDeliveryTime: '8m',
    reviews: [
      {
        id: 'r7',
        agentId: 'codefix',
        reviewerName: 'Nate Sterling',
        rating: 5,
        comment: 'Spotted a critical security vulnerability that manual reviewer had missed. Worth its weight in Ethereum.',
        timeAgo: '1 day ago'
      }
    ]
  },
  {
    id: 'deepsearch',
    name: 'DeepSearch',
    avatarUrl: '🔍',
    category: 'research',
    title: 'Market & Academic Research crawler',
    description: 'Deep web analysis, scientific summaries, competitive benchmarking and data tables compile.',
    longDescription: 'DeepSearch is geared for comprehensive multi-source indexing. Gathers citations, computes market averages, performs financial ratios comparison, and builds references matrices directly formatted in Markdown or HTML.',
    pricePerTask: 0.75,
    rating: 4.7,
    reviewCount: 2100,
    escrowProtected: true,
    tags: ['Market Intel', 'Synthesizing', 'Citations'],
    jobsCount: 2100,
    avgDeliveryTime: '20m',
    reviews: [
      {
        id: 'r8',
        agentId: 'deepsearch',
        reviewerName: 'Prof. David Lee',
        rating: 4,
        comment: 'Exceeded expectation in finding obscure references. Formatting layout of citations is highly professional.',
        timeAgo: '1 week ago'
      }
    ]
  },
  {
    id: 'datagenie',
    name: 'DataGenie',
    avatarUrl: '📊',
    category: 'data',
    title: 'CSV Cleanup & Viz and dashboard Generator',
    description: 'Purge duplicate rows, normalizes times, handles missing coordinates, and builds beautiful charts.',
    longDescription: 'DataGenie accepts spreadsheets, raw analytics dump, and returns normalized, cleanly organized database-ready arrays. Can automatically plot chart structures matching modern design aesthetics.',
    pricePerTask: 1.50,
    rating: 4.9,
    reviewCount: 515,
    escrowProtected: true,
    tags: ['CSV Normalizer', 'Visualization', 'Charts'],
    jobsCount: 515,
    avgDeliveryTime: '15m',
    reviews: [
      {
        id: 'r9',
        agentId: 'datagenie',
        reviewerName: 'Clarissa M.',
        rating: 5,
        comment: 'Cleaned a massive 10,000 line database sheet filled with typo errors in less than a minute. Lifesaver!',
        timeAgo: '4 days ago'
      }
    ]
  },
  {
    id: 'voicecraft',
    name: 'VoiceCraft',
    avatarUrl: '🎙️',
    category: 'writing', // Fallback
    title: 'Natural AI Voiceovers & Audio files generator',
    description: 'Convert voice recordings, scripts, or documentation into fully lifelike synthetic voices.',
    longDescription: 'VoiceCraft renders natural pauses, dynamic inflections, and studio-grade voiceover tracks. Choose between warm corporate narrators or enthusiastic startup launch personalities.',
    pricePerTask: 3.00,
    rating: 4.9,
    reviewCount: 1040,
    escrowProtected: true,
    tags: ['Audio Synthesis', 'Podcast', 'Narrations'],
    jobsCount: 1040,
    avgDeliveryTime: '10m',
    reviews: [
      {
        id: 'r10',
        agentId: 'voicecraft',
        reviewerName: 'Ethan Hunter',
        rating: 4.9,
        comment: 'Extremely fluid voice. Impeccable pacing and pronunciation of technical names.',
        timeAgo: '2 weeks ago'
      }
    ]
  }
];

export const mockJobs: Job[] = [
  {
    id: 'job-market-analysis',
    agentId: 'vectormind',
    agentName: 'MarketAnalyst_v2',
    agentAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3ehP95iHpuemnu4Bk9Muxyx7HNHqZoXiLyM5PmE-N7dXg6SfnxjXcTYRJF_G5qai_UTjI_LFdnTWrtlxi2uNI04ZnF4hAvNJD3shlgpUbjIfVf0yt2KQRid06Bh9e51LisJZiUxwA_X2CI55tzvxubqxqAUwsOArSWvqfqs7JaoZDnr31uhbVjPcsfKDb99Xex2F1YXxiF8fWw4cl-7Rt1HxzjSJ7pCkDfHfLvALQvQc2w6uaeRkE6aoc_zQHFVYSuC9VXwkIDl8',
    title: 'Market Analysis Agent',
    status: 'review',
    amountUSDC: 5.00,
    createdAt: 'Oct 24, 2023',
    deliveredAt: 'Received 2 hours ago',
    description: 'Research the top 5 AI automation trends for Q4 2023 and provide a 2-page summary including competitive analysis and pricing models.',
    deliveryContent: {
      fileName: 'AI_Trends_Report_Q4.pdf',
      fileSize: '2.4 MB • Complete Summary',
      summary: 'Delivered Work Received 2 hours ago',
      text: 'Hello, I have completed the market analysis as requested. Here are the key findings:\n\n• Agentic Workflows are seeing a 300% increase in VC funding.\n• Llama 3 optimization is the primary focus for mid-market SaaS.\n• Escrow-based hiring models are becoming the industry standard for AI labor.\n\nPlease review the attached PDF for the full competitive breakdown and pricing matrix.'
    },
    escrowStep: 'delivered',
    tags: ['MarketResearch', 'AI_Trends']
  },
  {
    id: 'job-technical-doc',
    agentId: 'vectormind',
    agentName: 'Technical Doc Generator',
    agentAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9dmmqNjiO-lSEXx3w90ldn3iBYroNoBjP2wmc-zgc30W7BbEMcG0mi9RLlEB1UW-cNUgYOyNRsUJLu6bnmTrlwFAPY1JcESwyjy-L73ihyM__Zs8lS_naCDcP2dOVHuRX3jVOolDOZF6J3-RzYBVXFR27-i7EnNIFuClCerIJ0SRGOwPzVGuWC3LOElNYoUmRBPM0rkIhv1FghW_uiuHzxHICz-UaisO-rjvVj8rgr2A44e8x1dYRm8iCjLnQ3bQ2e6PgE7b439A',
    title: 'Technical Doc Generator',
    status: 'active',
    amountUSDC: 0.50,
    createdAt: 'Oct 24, 2023',
    description: 'Organize project timeline milestones and create an easy-to-read README summary for the open-source release.',
    escrowStep: 'progress',
    tags: ['Documentation', 'YAML_Milestones']
  },
  {
    id: 'job-logo-vector',
    agentId: 'designpro',
    agentName: 'Logo Vectorization Agent',
    agentAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmTscO92birpg-aujGx04z9xtgQsAD-24WMWVEuvLg6bePKqkngReLw-O4xdVtvG0UloMQKGiAnB1htZJ1II335onnIws9bmMnN_PUEbS0F7xGtYoKAO36GsgfREm72z4bA0Tn6EpKbhYKPzx-4QwCd2cFnnWUL5--c28AMVJ_ASXgiH1CHw34qMZWbH-hJ6Ph9w4HmZ_RvCOV5IMPuvyZnPu2Nu8Poy7ldTiIH371OxtG9mPmLXZD-UZyAfYVDGrhWUBqZ2PTivg',
    title: 'Logo Vectorization Agent',
    status: 'review',
    amountUSDC: 1.20,
    createdAt: 'Oct 23, 2023',
    deliveredAt: 'Received Yesterday',
    description: 'Auditing and vectorizing raw logo assets into precise SVG constructs with 3 separate color versions.',
    deliveryContent: {
      fileName: 'Logo_Construct_Pack.zip',
      fileSize: '4.8 MB • SVG Vector files',
      summary: 'Finished Vector formats',
      text: 'Hello, vectors are fully generated and mathematically checked for overlaps. Find inside: SVG, EPS, and high-res PNG formats with transparent backgrounds.'
    },
    escrowStep: 'delivered',
    tags: ['Vectors', 'BrandDesign']
  },
  {
    id: 'job-sentiment-pipeline',
    agentId: 'vectormind',
    agentName: 'Sentiment Analysis Pipeline',
    agentAvatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_NFXtmxF32_kMwqAYBk8EhalyyIhFmqK1647JW7QjD57xmW70a7fbUe4fojJBC66DteECSr0NJGiBfK7JiCB554qINnsmtkXVC8coyEztCFmpBscPdkriYWaAl7tQ_Vf5ZiPxX9DZVj3yhz3sHY7NnJdDOFXLB1F9cFmyQ21_C-LfsjrO3BYTgWAQgm9Q11pMoAca4dRQEtZp22ZaAkuJlF-S4PLHwZTds_bA12y-t3Mtm748oj9ogCLs2sXHPqVdLnY_uNWQ5dE',
    title: 'Sentiment Analysis Pipeline',
    status: 'completed',
    amountUSDC: 0.85,
    createdAt: 'Jan 12, 2024',
    completedAt: 'Jan 12, 2024',
    description: 'Process customer feedback reviews and extract primary friction points and product feature desires tagged in JSON arrays.',
    deliveryContent: {
      fileName: 'Feedback_Insights.json',
      fileSize: '45 KB • Structured JSON',
      summary: 'Completed data extraction',
      text: 'Successfully processed feedback from 500 reviews. Found 3 key points: (1) Pricing clear explanation request, (2) Wallet connection speeds, (3) Dark mode requested.'
    },
    escrowStep: 'released',
    tags: ['FeedbackLoop', 'DataCleanup']
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    description: 'Payment to CodeArchitect AI',
    amount: 45.00,
    isNegative: true,
    date: 'Oct 24, 2023 • 2:15 PM',
    status: 'COMPLETED',
    type: 'PAYMENT',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDP3s1_FrV1Zoq09gIUkioW_7oRnbMFXLWmNksZ_jvwYw9m-3thErCDh3d_T8RhjLnAGNTCHPsgQkJ_0pnMslj0HEvQPxyphDGJvN6qJt5niP6ghN8rNOi0H2KrRqux6sS39n_YYq7Hs5Q1u4LPZmRuj6ryggCkCP2c2B-QmpYRYpxmNe_ka1NWxQO8c8GcH-wCN7NqULVL_mafIaWgN3qMJIMkRuMp0rOxnhVsTgDR_YT23eCzfZsaVZSibxajsSfsH10toV4PriM'
  },
  {
    id: 'tx2',
    description: 'Refund for Logo Batch 02',
    amount: 12.50,
    isNegative: false,
    date: 'Oct 22, 2023 • 10:05 AM',
    status: 'REFUNDED',
    type: 'REFUND',
    iconName: 'undo'
  },
  {
    id: 'tx3',
    description: 'Payment to ContentGen Pro',
    amount: 93.00,
    isNegative: true,
    date: 'Oct 20, 2023 • 4:42 PM',
    status: 'COMPLETED',
    type: 'PAYMENT',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBt4PUk0VjepT6rN4V7ktREuYh-OjfXuXJycdbg6OPqE8jP41spQ7dnH3dfq3uISVVvproObD7YD72pNTlS1wh7vcNlIvNVhP9k-djVGGyKSHy_SdB8FLvnfkp7xLrcw6Umkuu9b6uFd1NGrboo34mAI6kD9NdV25X6AtL-kqeGKz57sPoTP3ax63DrsXmSqzaR_2h6S1wr9OqlkzvnkWc3zelmzKcgnvUgNh_WqhdWBbKijryJxtaUjpdIW4OXMYpDdhJsfQkFA5g'
  },
  {
    id: 'tx4',
    description: 'Funds Added via Stripe',
    amount: 250.00,
    isNegative: false,
    date: 'Oct 18, 2023 • 09:00 AM',
    status: 'COMPLETED',
    type: 'TOPUP',
    iconName: 'add_card'
  }
];
