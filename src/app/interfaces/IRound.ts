export interface IRound {
  id: string;
  number: number;
  participantIds: string[],
  albumIds: string[];
  startDate: string;
  endDate: string;
  picksPerParticipant: number;
}
