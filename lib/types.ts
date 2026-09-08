export type Profile = {
  id: string;
  full_name: string;
  role: 'OWNER';
  created_at: string;
  updated_at: string;
};
export type Variable = { id: string; owner_id: string; code: number; name: string };
export type Score = { variable_id: string; value: number };
export type Entry = {
  id: string;
  created_at: string;
  updated_at: string;
  questionnaire_scores: Score[];
};
export type Analysis = {
  id: string;
  variable_id: string;
  total: number;
  count: number;
  mean: number;
  position: number;
};
export type Selected = {
  id: string;
  variable_id: string;
  mean: number;
  weight: number;
  position: number;
  created_at: string;
};
export type PhotoBox = {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type Assessment = {
  id: string;
  photobox_id: string;
  selected_variable_id: string;
  value: number;
};
export type Ranking = { id: string; photobox_id: string; score: number; position: number };
export type Workspace = {
  profile: Profile;
  email: string;
  variables: Variable[];
  entries: Entry[];
  analysis: Analysis[];
  selected: Selected[];
  photoboxes: PhotoBox[];
  assessments: Assessment[];
  rankings: Ranking[];
  has_top_tie: boolean;
};
export type ActionResult = { error?: string; success?: string; id?: string };
