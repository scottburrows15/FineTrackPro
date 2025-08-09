// Common UK sports and their typical positions
export const UK_SPORTS = [
  "Football",
  "Rugby", 
  "Cricket",
  "Netball",
  "Hockey",
  "Basketball",
  "Volleyball",
  "Tennis",
  "Badminton",
  "Swimming",
  "Athletics",
  "Golf",
  "Squash"
] as const;

export type UKSport = typeof UK_SPORTS[number];

// Position mappings for each sport
export const SPORT_POSITIONS: Record<string, string[]> = {
  Football: [
    "Goalkeeper", "Right Back", "Left Back", "Centre Back", "Sweeper",
    "Right Wing Back", "Left Wing Back", "Defensive Midfielder", 
    "Central Midfielder", "Attacking Midfielder", "Right Midfielder", 
    "Left Midfielder", "Right Winger", "Left Winger", "Striker", 
    "Centre Forward", "Second Striker"
  ],
  Rugby: [
    "Loosehead Prop", "Hooker", "Tighthead Prop", "Lock", "Blindside Flanker",
    "Openside Flanker", "Number 8", "Scrum Half", "Fly Half", "Left Wing", 
    "Inside Centre", "Outside Centre", "Right Wing", "Full Back"
  ],
  Cricket: [
    "Wicket Keeper", "Batsman", "All Rounder", "Fast Bowler", "Spin Bowler",
    "Opening Batsman", "Middle Order", "Lower Order", "Captain"
  ],
  Netball: [
    "Goal Shooter", "Goal Attack", "Wing Attack", "Centre", 
    "Wing Defence", "Goal Defence", "Goal Keeper"
  ],
  Hockey: [
    "Goalkeeper", "Right Back", "Left Back", "Centre Back", "Right Half",
    "Left Half", "Centre Half", "Right Wing", "Left Wing", "Centre Forward",
    "Inside Right", "Inside Left"
  ],
  Basketball: [
    "Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Centre"
  ],
  Volleyball: [
    "Setter", "Outside Hitter", "Middle Blocker", "Opposite Hitter", 
    "Libero", "Defensive Specialist"
  ],
  Tennis: ["Singles Player", "Doubles Player"],
  Badminton: ["Singles Player", "Doubles Player"],
  Swimming: [
    "Freestyle", "Backstroke", "Breaststroke", "Butterfly", 
    "Individual Medley", "Distance", "Sprint"
  ],
  Athletics: [
    "Sprinter", "Middle Distance", "Long Distance", "Hurdler", 
    "High Jump", "Long Jump", "Triple Jump", "Pole Vault",
    "Shot Put", "Discus", "Hammer", "Javelin", "Decathlon", "Heptathlon"
  ],
  Golf: ["Golfer"],
  Squash: ["Player"]
};

export function getPositionsForSport(sport: string): string[] {
  return SPORT_POSITIONS[sport] || [];
}