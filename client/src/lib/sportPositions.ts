// Sport-specific position lists
export const SPORT_POSITIONS = {
  Football: [
    "Goalkeeper",
    "Centre-Back",
    "Left-Back", 
    "Right-Back",
    "Sweeper",
    "Central Midfielder",
    "Defensive Midfielder",
    "Attacking Midfielder",
    "Left Midfielder",
    "Right Midfielder",
    "Left Winger",
    "Right Winger",
    "Centre-Forward",
    "Striker",
    "Second Striker",
  ],
  Rugby: [
    "Loosehead Prop",
    "Hooker", 
    "Tighthead Prop",
    "Lock",
    "Second Row",
    "Blindside Flanker",
    "Openside Flanker",
    "Number 8",
    "Scrum-half",
    "Fly-half",
    "Left Wing",
    "Inside Centre",
    "Outside Centre", 
    "Right Wing",
    "Fullback",
  ],
  Netball: [
    "Goal Shooter (GS)",
    "Goal Attack (GA)",
    "Wing Attack (WA)",
    "Centre (C)",
    "Wing Defence (WD)",
    "Goal Defence (GD)",
    "Goal Keeper (GK)",
  ],
  Hockey: [
    "Goalkeeper",
    "Left Back",
    "Centre Back",
    "Right Back",
    "Sweeper",
    "Left Half",
    "Centre Half",
    "Right Half",
    "Left Inner",
    "Centre Forward",
    "Right Inner",
    "Left Wing",
    "Right Wing",
  ],
  Cricket: [
    "Wicket-keeper",
    "Opening Batsman",
    "Top Order Batsman",
    "Middle Order Batsman",
    "Lower Order Batsman",
    "All-rounder",
    "Fast Bowler",
    "Spin Bowler",
    "Medium Pace Bowler",
    "Captain",
  ],
  Basketball: [
    "Point Guard",
    "Shooting Guard", 
    "Small Forward",
    "Power Forward",
    "Centre",
  ],
  Tennis: [
    "Singles Player",
    "Doubles Player",
  ],
  // Sports without specific positions
  Darts: [],
  Golf: [],
  Pool: [],
} as const;

export type Sport = keyof typeof SPORT_POSITIONS;

export function getSportPositions(sport: Sport): readonly string[] {
  return SPORT_POSITIONS[sport] || [];
}

export function getSportRequiresPositions(sport: Sport): boolean {
  return getSportPositions(sport).length > 0;
}

export function getAvailableSports(): Sport[] {
  return Object.keys(SPORT_POSITIONS) as Sport[];
}