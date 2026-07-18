// mock api components
export type Participant = {
  user: string; // user id
  status: 'joined' | 'cancelled';
  joined_at: string;
  party_size?: number; // one account can RSVP for a group; defaults to 1
};

export type Game = {
  id: string;
  host: string; // user id
  sport: string;
  description?: string;
  location: string;
  start_time: string; // ISO date string
  min_players: number;
  max_players: number;
  status: 'open' | 'confirmed' | 'locked' | 'completed' | 'cancelled';
  participants: Participant[];
  photo_url: string;
  createdAt?: string; // drives the "NEW" badge
  // Optional fields the real API provides (map pin + target skill level).
  latitude?: number;
  longitude?: number;
  skill_level?: 'all' | 'beginner' | 'intermediate' | 'pro';
};
