export interface IRound {
  id: string;
  number: number;
  albumIds: string[];
  startDate: string;
  endDate: string;
  picksPerParticipant: number;
}
