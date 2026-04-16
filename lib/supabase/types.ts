export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  location: string;
  website: string;
  twitter: string;
  instagram: string;
  avatar_url: string | null;
  banner_gradient: string;
  created_at: string;
};

export type Score = {
  id: string;
  title: string;
  composer: string;
  publisher: string;
  description: string;
  difficulty: string;
  category: string;
  instruments: string[];
  tag: "free" | "premium";
  price_display: string | null;
  likes_count: number;
  views_count: number;
  pages: number;
  pdf_url: string | null;
  midi_url: string | null;
  cover_url: string | null;
  resource_collection_id: string | null;
  parts: { name: string; pdf_url: string }[];
  author_id: string;
  created_at: string;
  updated_at: string;
  // Joined via select("*, profiles(...)")
  profiles?: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export type Comment = {
  id: string;
  score_id: string;
  author_id: string;
  text: string;
  likes_count: number;
  created_at: string;
  profiles?: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export type Like = {
  user_id: string;
  score_id: string;
};

export type Follow = {
  follower_id: string;
  followee_id: string;
};
