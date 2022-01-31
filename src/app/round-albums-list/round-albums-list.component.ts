import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';
import { RoundListItemsService } from '../round-list-items.service';

interface IAlbumForm {
  albumSearchQuery: string;
  title: string;
  artists: string[];
  artistGenres: string[];
  trackCount: number;
  releaseDate: string;
  imageUrl: string;
  posterId: string;
}

interface IAlbumListItem {
  album: IAlbum,
  poster: IMember
}

@Component({
  selector: 'app-round-albums-list',
  templateUrl: './round-albums-list.component.html',
  styleUrls: ['./round-albums-list.component.css']
})
export class RoundAlbumsListComponent implements OnInit {

  albumSearchForm: FormGroup;
  albumForm: FormGroup;
  albumListItems: IAlbumListItem[];
  selectedAlbum: IAlbum;
  allMembers: IMember[];
  albumToUpdateId: string;
  searchAlbumListItems: any[];

  selectedAlbumSearchResultSpotifyId: string;

  pitchNotations: string[] = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];

  @Input() round: IRound;
  @Input() participants: IMember[];
  @Output() albumSelectEvent = new EventEmitter<IAlbum>();

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService,
    private roundListItemsService: RoundListItemsService,
    private httpClient: HttpClient
  ) { }

  ngOnInit(): void {
    // Define the album form
    this.albumForm = this.formBuilder.group({
      albumSearchQuery: [null],
      spotifyId:        [null, Validators.required],
      title:            [null, Validators.required],
      artists:          [null, Validators.required],
      artistGenres:     [null],
      releaseDate:      [null, Validators.required],
      imageUrl:         [null, Validators.required],
      trackCount:       [null, Validators.required],
      tracks:           [null, Validators.required],
      posterId:         [null, Validators.required]
    });

    // List all members as poster options
    this.allMembers = [];
    this.modelService.getAllMembers().subscribe(allMembers => {
      // Sort members by name
      this.allMembers = allMembers.sort((m1, m2) => this.modelService.compareMembers(m1, m2));
    });

    this.albumToUpdateId = null;

    this.albumForm.get('albumSearchQuery').valueChanges.subscribe((query) => {
      this.searchForAlbum(query);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.selectedAlbum = null;
      this.loadAlbumListItems();
    }
  }

  async loadAlbumListItems(): Promise<void> {
    this.albumListItems = [];

    // Create promises for album list items
    const albumListItemPromises: Promise<IAlbumListItem>[] = this.round.albumIds.map(async albumId => {
      const album: IAlbum = await this.modelService.getAlbum(albumId).toPromise();
      return this.createAlbumListItem(album);
    });

    const albumListItems: IAlbumListItem[] = await Promise.all(albumListItemPromises);

    // Sort the temporary list of album list items by poster name
    this.albumListItems = albumListItems.sort((a1, a2) => this.modelService.compareMembers(a1.poster, a2.poster));
    this.selectAlbumListItem(albumListItems[0]);
  }

  async createAlbumListItem(album: IAlbum): Promise<IAlbumListItem> {
    // Get the album's poster
    const poster: IMember = await this.modelService.getMember(album.posterId).toPromise();

    // Create the album list item
    const albumListItem: IAlbumListItem = {
      album: album,
      poster: poster
    };

    return albumListItem;
  }

  selectAlbumListItem(albumListItem: IAlbumListItem): void {
    if (albumListItem === undefined) return;
    this.selectedAlbum = albumListItem.album;
    this.albumSelectEvent.emit(albumListItem.album);
  }

  async searchForAlbum(query: string): Promise<any> {
    const searchResults = await this.httpClient.get<any>(`http://localhost:80/api/album-search?q=${query}`).toPromise();
    this.searchAlbumListItems = (searchResults.items.length > 0) ? searchResults.items : [];
  }

  async selectAlbumSearchResult(spotifyAlbum: any) {
    this.selectedAlbumSearchResultSpotifyId = spotifyAlbum.id;

    // Get album artists and their associated genres
    let artists: string[] = [];
    let artistGenres: string[] = [];
    for (let artist of spotifyAlbum.artists) {
      const artistData = await this.httpClient.get<any>(`http://localhost:80/api/artist?id=${artist.id}`).toPromise();
      artists.push(artist.name);
      artistGenres.push(...artistData.genres);
    }

    try {
      // Get album tracks
      let tracksResult = await this.httpClient.get<any>(`http://localhost:80/api/spotify-album-tracks?spotifyAlbumId=${spotifyAlbum.id}`).toPromise();

      const trackPromises = tracksResult.items.map(async (track) => {
        const audioFeaturesResult = await this.httpClient.get<any>(`http://localhost:80/api/spotify-audio-features?spotifyTrackId=${track.id}`).toPromise();

        const timeSignature: string = audioFeaturesResult.time_signature + '/4';
        const mode: string = (audioFeaturesResult.mode === 1) ? 'major' : 'minor';
        const key: string = (audioFeaturesResult.key === -1) ? 'N/A' : this.pitchNotations[0];

        return Promise.resolve({
          title:              track.name,
          diskNumber:         track.disc_number,
          trackNumber:        track.track_number,
          duration:           track.duration_ms,
          audioFeatures: {
            tempo:            audioFeaturesResult.tempo,
            timeSignature:    timeSignature,
            key:              key,
            mode:             mode,
            acousticness:     audioFeaturesResult.acousticness,
            energy:           audioFeaturesResult.energy,
            danceability:     audioFeaturesResult.danceability,
            instrumentalness: audioFeaturesResult.instrumentalness,
            liveness:         audioFeaturesResult.liveness,
            speechiness:      audioFeaturesResult.speechiness,
            valence:          audioFeaturesResult.valence
          },
          pickerIds: []
        });
      });

      const tracks = await Promise.all(trackPromises);

      // Populate form with album data
      this.albumForm.controls.spotifyId.setValue(spotifyAlbum.id);
      this.albumForm.controls.title.setValue(spotifyAlbum.name);
      this.albumForm.controls.trackCount.setValue(spotifyAlbum.total_tracks);
      this.albumForm.controls.releaseDate.setValue(spotifyAlbum.release_date);
      this.albumForm.controls.imageUrl.setValue(spotifyAlbum.images[1].url);
      this.albumForm.controls.artists.setValue(artists);
      this.albumForm.controls.artistGenres.setValue(artistGenres);
      this.albumForm.controls.tracks.setValue(tracks);
    } catch(err: any) {
      alert(`${err.status} ${err.statusText}:\nCould not load data for '${spotifyAlbum.name}'`);
    }
  }

  async submitAlbumForm(): Promise<void> {
    const formValues: IAlbumForm = this.albumForm.value as IAlbumForm;

    if (this.albumToUpdateId === null) {
      this.createAlbum(formValues);
    } else {
      this.updateAlbum(formValues);
    }

    // Close the album form modal
    document.getElementById('album-modal-close-button').click();
  }

  async createAlbum(albumInfo: any): Promise<void> {
    // Create the album
    const album: IAlbum = await this.modelService.createAlbum(albumInfo, this.round);

    // Create the album list item
    const albumListItem: IAlbumListItem = await this.createAlbumListItem(album);

    // Add the album list item to the list
    this.albumListItems.push(albumListItem);
    this.sortAlbumListItems();

    // Add the album to its round list item
    this.roundListItemsService.addAlbum(album, this.round);
  }

  async updateAlbum(albumInfo: any): Promise<void> {
    // Update the album in the database
    const updatedAlbum: IAlbum = await this.modelService.updateAlbum(this.albumToUpdateId, albumInfo).toPromise();

    // Update the album in its round list item
    for (let albumListItem of this.albumListItems) {
      if (albumListItem.album.id === this.albumToUpdateId) {
        albumListItem.album = updatedAlbum;
        break;
      }
    }

    // Sort the album list items in case the update changed the poster name
    this.sortAlbumListItems();

    // Refresh the currently selected album
    this.selectedAlbum = updatedAlbum;
    this.albumSelectEvent.emit(updatedAlbum);

    // Update the album in its round list item
    this.roundListItemsService.updateAlbum(updatedAlbum, this.round);

    // Update round
    this.modelService.updateRound(this.round.id, {}).toPromise();

    this.albumToUpdateId = null;
  }

  populateAlbumForm(album: IAlbum): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    // Set album form values
    this.albumForm.controls.title.setValue(album.title);
    this.albumForm.controls.artists.setValue(album.artists);
    this.albumForm.controls.trackCount.setValue(album.trackCount);
    this.albumForm.controls.imageUrl.setValue(album.imageUrl);
    this.albumForm.controls.posterId.setValue(album.posterId);

    this.albumToUpdateId = album.id;
  }

  async deleteAlbum(albumToDelete: IAlbum): Promise<void> {
    // Don't click any elements under the delete button
    event.stopPropagation();

    if (!confirm('Really delete "' + albumToDelete.title + '"?')) return;

    // Delete the album from the database
    await this.modelService.deleteAlbum(albumToDelete, this.round);

    // Remove the album's list item
    this.albumListItems = this.albumListItems.filter(albumListItem => albumListItem.album.id != albumToDelete.id);

    // Delete the album from its round list item
    this.roundListItemsService.deleteAlbum(albumToDelete, this.round);

    // Update round
    this.modelService.updateRound(this.round.id, {}).toPromise();
  }

  clearAlbumForm(): void {
    this.albumForm.reset();
  }

  sortAlbumListItems(): void {
    this.albumListItems = this.albumListItems.sort((a, b) => {
      if (a.poster.lastName < b.poster.lastName)
        return -1;
      else if (a.poster.lastName > b.poster.lastName)
        return 1;
      return a.poster.firstName < b.poster.firstName ? -1 : 1;
    });
  }

}
