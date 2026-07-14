export type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile_picture?: string | null; // local file/content URI, or null
  preferred_positions?: Record<string, string>; // sport slug -> skill label
};
