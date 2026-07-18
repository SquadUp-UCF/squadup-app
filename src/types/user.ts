export type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile_picture?: string | null; // local file/content URI, or null
  preferred_positions?: Record<string, string>; // sport slug -> skill label
};

// Public view of any player (GET /users/:id), with stats for the profile screen.
export type PlayerProfile = {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  profile_picture: string | null;
  reputation: number;
  games_created: number; // count
  games_joined: number; // count (games played)
  preferred_positions: Record<string, string>; // sport slug -> skill label
};
