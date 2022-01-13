export interface IAlbum {
  id: string;
  title: string;
  artists: string[];
  artistGenres: string[];
  trackCount: number;
  releaseDate: string;
  imageUrl: string;
  posterId: string;
  pickedTracks: {
    title: string;
    trackNumber: number;
    pickerIds: string[];
  }[];
  topTrackNumber: number;
}
