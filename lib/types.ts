export type Team = { id: string; name: string; color: string; max_players: number; assigned_players: number };
export type EventSnapshot = { id: string; name: string; code: string; status: "open" | "closed"; randomization_mode: "balanced" | "pure"; teams: Team[] };
export type Result = { team_id: string; team_name: string; team_color: string };
export type PlayerSession = { id: string; name: string; result: Result | null };
