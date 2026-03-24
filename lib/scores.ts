export type Score = {
  id: number;
  title: string;
  composer: string;
  publisher: string;
  tag: "free" | "premium";
  price?: string;
  likes: number;
  views: number;
  category: string;
  description: string;
  difficulty: string;
  pages: number;
  instruments: string[];
  comments: Comment[];
  author: string;
};

export type Comment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
};

export const ALL_SCORES: Score[] = [
  {
    id: 1, title: "Nuvole Bianche", composer: "Ludovico Einaudi", publisher: "Hal Leonard",
    tag: "free", likes: 214, views: 4420, category: "piano", author: "elena_m",
    description: "One of Einaudi's most beloved pieces — a delicate, meditative solo piano work that evokes clouds drifting across a pale sky.",
    difficulty: "Intermediate", pages: 4, instruments: ["Piano"],
    comments: [
      { id: 1, author: "Elena M.", avatar: "E", text: "This arrangement is beautiful. I've been playing it for months!", time: "2 days ago", likes: 12 },
      { id: 2, author: "James O.", avatar: "J", text: "Perfect difficulty level for intermediate players. Thank you!", time: "5 days ago", likes: 7 },
    ],
  },
  {
    id: 2, title: "Kiss the Rain", composer: "Yiruma", publisher: "Hal Leonard",
    tag: "free", likes: 891, views: 42130, category: "piano", author: "sofia_r",
    description: "A romantic and evocative piano piece by the Korean composer Yiruma, widely loved for its emotional simplicity.",
    difficulty: "Beginner", pages: 3, instruments: ["Piano"],
    comments: [
      { id: 1, author: "Sofia R.", avatar: "S", text: "My all-time favourite piece. This transcription is spot on.", time: "1 day ago", likes: 23 },
    ],
  },
  {
    id: 3, title: "Clair de Lune", composer: "Claude Debussy", publisher: "Hal Leonard",
    tag: "free", likes: 1203, views: 61000, category: "piano", author: "diego_f",
    description: "The third movement of Suite bergamasque — Debussy's most famous piano piece, evoking the light of the moon.",
    difficulty: "Advanced", pages: 6, instruments: ["Piano"],
    comments: [
      { id: 1, author: "Anna L.", avatar: "A", text: "A masterpiece. This PDF is very clean and easy to read.", time: "3 days ago", likes: 31 },
      { id: 2, author: "Diego F.", avatar: "D", text: "I've tried many versions — this one has the best fingering suggestions.", time: "1 week ago", likes: 18 },
    ],
  },
  {
    id: 4, title: "River Flows in You", composer: "Yiruma", publisher: "Hal Leonard",
    tag: "free", likes: 654, views: 28900, category: "piano", author: "james_o",
    description: "Perhaps the most famous piece by Yiruma — a gentle, flowing melody that has become a modern classic.",
    difficulty: "Beginner", pages: 3, instruments: ["Piano"],
    comments: [],
  },
  {
    id: 5, title: "Comptine d'un autre été", composer: "Yann Tiersen", publisher: "Hal Leonard",
    tag: "free", likes: 432, views: 19300, category: "piano", author: "chloe_d",
    description: "From the Amélie soundtrack — a minimalist, repetitive piece with an instantly recognisable melodic hook.",
    difficulty: "Beginner", pages: 2, instruments: ["Piano"],
    comments: [
      { id: 1, author: "Chloe D.", avatar: "C", text: "Learned this in a week! Great for beginners.", time: "4 days ago", likes: 9 },
    ],
  },
  {
    id: 6, title: "Gymnopédie No.1", composer: "Erik Satie", publisher: "Hal Leonard",
    tag: "free", likes: 778, views: 35100, category: "piano", author: "anna_l",
    description: "The first and most famous of Satie's three Gymnopédies — slow, melancholic, and hauntingly beautiful.",
    difficulty: "Intermediate", pages: 3, instruments: ["Piano"],
    comments: [],
  },
  {
    id: 7, title: "A Nightingale Sang in Berkeley Square", composer: "Traditional", publisher: "Hal Leonard",
    tag: "free", likes: 124, views: 3200, category: "brass", author: "brass_collective",
    description: "A classic British ballad arranged for brass band — romantic and lush, perfect for outdoor performances.",
    difficulty: "Intermediate", pages: 8, instruments: ["Trumpet", "Trombone", "Tuba", "French Horn"],
    comments: [],
  },
  {
    id: 8, title: "Happy Xmas (War Is Over)", composer: "John Lennon", publisher: "Hal Leonard",
    tag: "free", likes: 631, views: 21000, category: "brass", author: "mark_t",
    description: "John Lennon's iconic anti-war Christmas anthem, arranged for full brass band with optional choir.",
    difficulty: "Beginner", pages: 6, instruments: ["Trumpet", "Trombone", "Tuba"],
    comments: [],
  },
  {
    id: 9, title: "The Riverdance Suite", composer: "Bill Whelan", publisher: "Hal Leonard",
    tag: "free", likes: 445, views: 18700, category: "brass", author: "ryan_w",
    description: "The iconic theme from Riverdance — an energetic Irish-inspired piece that showcases the full power of a brass ensemble.",
    difficulty: "Advanced", pages: 12, instruments: ["Trumpet", "Trombone", "French Horn", "Euphonium", "Tuba"],
    comments: [],
  },
  {
    id: 10, title: "Sweet Caroline", composer: "Neil Diamond", publisher: "Hal Leonard",
    tag: "free", likes: 98, views: 1800, category: "brass", author: "brass_collective",
    description: "Neil Diamond's crowd-pleaser in a fun, accessible brass band arrangement — great for community ensembles.",
    difficulty: "Beginner", pages: 5, instruments: ["Trumpet", "Trombone", "Tuba"],
    comments: [],
  },
  {
    id: 11, title: "Fanfare for the Common Man", composer: "Aaron Copland", publisher: "Hal Leonard",
    tag: "free", likes: 312, views: 9400, category: "brass", author: "dirk",
    description: "Copland's iconic fanfare — one of the most recognisable brass openings in the orchestral repertoire.",
    difficulty: "Intermediate", pages: 4, instruments: ["Trumpet", "Trombone", "Tuba", "Timpani"],
    comments: [],
  },
  {
    id: 12, title: "Also Sprach Zarathustra (Opening)", composer: "Richard Strauss", publisher: "Hal Leonard",
    tag: "free", likes: 567, views: 24600, category: "brass", author: "dirk",
    description: "The famous opening sunrise fanfare from Strauss's tone poem — instantly recognisable, endlessly impressive.",
    difficulty: "Advanced", pages: 6, instruments: ["Trumpet", "Trombone", "Tuba", "French Horn"],
    comments: [],
  },

  // Premium piano scores
  {
    id: 13, title: "Moonlight Sonata — Full Score", composer: "Ludwig van Beethoven", publisher: "Breitkopf & Härtel",
    tag: "premium", price: "€4.99", likes: 2341, views: 98700, category: "piano", author: "scoresynth_official",
    description: "The complete three-movement sonata in a premium edition with fingering annotations, dynamic markings, and performance notes prepared by our editorial team.",
    difficulty: "Advanced", pages: 18, instruments: ["Piano"],
    comments: [
      { id: 1, author: "Marina V.", avatar: "M", text: "Worth every cent. The fingering notes alone saved me hours.", time: "1 day ago", likes: 34 },
      { id: 2, author: "Tom B.", avatar: "T", text: "Beautifully typeset. Much cleaner than the IMSLP version.", time: "3 days ago", likes: 21 },
    ],
  },
  {
    id: 14, title: "Chopin Nocturnes — Complete", composer: "Frédéric Chopin", publisher: "Peters Edition",
    tag: "premium", price: "€7.99", likes: 1870, views: 74300, category: "piano", author: "scoresynth_official",
    description: "All 21 nocturnes in a single premium edition — beautifully engraved with pedal markings, ornament realisations, and a scholarly foreword.",
    difficulty: "Advanced", pages: 64, instruments: ["Piano"],
    comments: [
      { id: 1, author: "Julia R.", avatar: "J", text: "An essential collection. The layout is superb.", time: "2 days ago", likes: 28 },
    ],
  },
  {
    id: 15, title: "La Campanella", composer: "Franz Liszt", publisher: "Schirmer",
    tag: "premium", price: "€3.99", likes: 982, views: 41500, category: "piano", author: "scoresynth_official",
    description: "Liszt's dazzling showpiece from the Grandes études de Paganini — premium edition with practice guides and hand distribution tips.",
    difficulty: "Advanced", pages: 10, instruments: ["Piano"],
    comments: [],
  },

  // Premium brass scores
  {
    id: 16, title: "Bugler's Holiday — Full Brass Parts", composer: "Leroy Anderson", publisher: "Belwin Mills",
    tag: "premium", price: "€5.99", likes: 412, views: 17200, category: "brass", author: "scoresynth_official",
    description: "Complete set of parts for Anderson's beloved showpiece — includes conductor score, all solo cornet parts, and full ensemble arrangement.",
    difficulty: "Advanced", pages: 22, instruments: ["Trumpet", "Cornet", "Flugelhorn", "Trombone"],
    comments: [],
  },
  {
    id: 17, title: "Carnival of Venice — Cornet Solo", composer: "Jean-Baptiste Arban", publisher: "Carl Fischer",
    tag: "premium", price: "€4.49", likes: 644, views: 26800, category: "brass", author: "scoresynth_official",
    description: "Arban's famous theme and variations — the definitive test piece for cornet and trumpet soloists, with piano accompaniment included.",
    difficulty: "Advanced", pages: 14, instruments: ["Trumpet", "Piano"],
    comments: [
      { id: 1, author: "Kai S.", avatar: "K", text: "Perfect scan, all variations clearly laid out. Great purchase.", time: "5 days ago", likes: 15 },
    ],
  },
];

export const SCORE_TAGS = ["All", "Piano", "Strings", "Brass", "Symphonic", "Guitar", "Choir"];
