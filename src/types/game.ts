// mock api components
export type Participant = {
  user: string; // user id
  status: 'joined' | 'cancelled';
  joined_at: string;
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
};