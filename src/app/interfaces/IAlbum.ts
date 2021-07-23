export interface IAlbum {
  id: string;
  title: string;
  artist: string;
  trackCount: number;
  imageUrl: string;
  posterId: string;
  pickedTracks: {
    title: string;
    trackNumber: number;
    pickerIds: string[];
  }[];
  topTrackNumber: number;
}
