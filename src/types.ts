export type Entrant = {
  id: string;
  name: string;
  finish?: number;       // 1 = champion, N = last
  manualWeight?: number; // used if scheme === 'custom'
};

export type Scheme = "inverse" | "custom"; // inverse: w = finish
