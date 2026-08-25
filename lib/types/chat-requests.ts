export type OpenRequest = {
  id: string;
  full_name: string;
  netid: string;
  grad_year: string | null;
  major: string | null;
  interests: string[];
  prompt: string;
  created_at: string;
  visit_count: number;
};

export type ClaimedRequest = OpenRequest & {
  claimed_at: string;
  claimed_by_name: string | null;
  is_mine: boolean;
};
