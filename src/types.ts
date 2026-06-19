export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  chapters: string; // Brief details of what is inside
  purpose: string; // What the eBook is for
  targetAudience: string; // Who the eBook is strictly for
  antiAudience: string; // Who this eBook is NOT for (important for 100% honesty)
  vibeColor: string; // Tailwinds colors like border-purple-500, bg-purple-500/10 etc.
  vibeBadge: string; // A tag, e.g. "Carreira", "Produtividade", "Finanças"
  coverEmoji: string; // An emoji like 💻, 🧘, 💰
}

export interface ChatMessage {
  id: string;
  sender: "user" | "yuki";
  text: string;
  timestamp: string;
  compatibilityScore?: number;
  reasons?: string;
  isIdeal?: "sim" | "nao" | "talvez";
  readyToAssess?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  currentScore: number;
  lastReasons: string;
  lastIsIdeal: "sim" | "nao" | "talvez";
  readyToAssess: boolean;
}
