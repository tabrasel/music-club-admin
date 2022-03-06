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
  spotifyId: string;
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

  albumForm: FormGroup;
  albumListItems: IAlbumListItem[];
  selectedAlbum: IAlbum;
  allMembers: IMember[];
  albumToUpdateId: string;

  albumSearchQuery: string;
  albumSearchListItems: any[];

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
      posterId:         [null, Validators.required]
    });

    // List all members as poster options
    this.allMembers = [];
    this.modelService.getAllMembers().subscribe(allMembers => {
      // Sort members by name
      this.allMembers = allMembers.sort((m1, m2) => this.modelService.compareMembers(m1, m2));
    });

    this.albumToUpdateId = null;

    // Update album search results upon every query change
    this.albumForm.get('albumSearchQuery').valueChanges.subscribe((query: string) => {
      if (query !== null && query.length > 0)
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

  /**
   * Upon selecting an album list item.
   * @param albumListItem the selected album list item
   */
  selectAlbumListItem(albumListItem: IAlbumListItem): void {
    if (albumListItem === undefined)
      return;

    this.selectedAlbum = albumListItem.album;
    this.albumSelectEvent.emit(albumListItem.album);
  }

  /**
   * Upon searching for an album.
   * @param query album search query
   */
  searchForAlbum(query: string): void {
    this.httpClient.get<any>(`http://localhost:80/api/album-search?q=${query}`).subscribe((searchResults: any) => {
      this.albumSearchListItems = (searchResults.items.length > 0) ? searchResults.items : [];
    });
  }

  /**
   * Upon selecting an album search result.
   * @param spotifyAlbum item from a Spotify album search result
   */
  selectAlbumSearchResult(spotifyAlbum: any): void {
    this.albumForm.controls.spotifyId.setValue(spotifyAlbum.id);
  }

  /**
   * Upon submitting the album form.
   */
  submitAlbumForm(): void {
    const albumFormValues: IAlbumForm = this.albumForm.value as IAlbumForm;

    if (this.albumToUpdateId === null) {
      this.createAlbum(albumFormValues.spotifyId, albumFormValues.posterId);
    } else {
      this.updateAlbum(this.albumToUpdateId, albumFormValues.spotifyId, albumFormValues.posterId);
    }

    this.clearAlbumForm();

    // Close the album form modal
    document.getElementById('album-modal-close-button').click();
  }

  /**
   * Create an album.
   * @param spotifyId Spotify ID of the album
   * @param posterId  member ID of the album poster
   */
  async createAlbum(spotifyId: string, posterId: string): Promise<void> {
    // Create the album
    const createdAlbum: IAlbum = await this.modelService.createAlbum(spotifyId, posterId, this.round);

    // Create a list item for the album
    const albumListItem: IAlbumListItem = await this.createAlbumListItem(createdAlbum);

    // Add the album list item to the list
    this.albumListItems.push(albumListItem);
    this.sortAlbumListItems();

    // Add the album to its round list item
    this.roundListItemsService.addAlbum(createdAlbum, this.round);
  }

  /**
   * Update an album.
   * @param id        ID of the album to update
   * @param spotifyId Spotify ID of the new album
   * @param posterId  member ID of the album poster
   */
  async updateAlbum(id: string, spotifyId: string, posterId: string): Promise<void> {
    // Update the album in the database
    const updateData: any = { spotifyId, posterId };
    const updatedAlbum: IAlbum = await this.modelService.updateAlbum(id, updateData);

    // Update the album's list item
    for (let albumListItem of this.albumListItems) {
      if (albumListItem.album.id === this.albumToUpdateId) {
        albumListItem.album = updatedAlbum;
        break;
      }
    }

    // Sort the album list items in case the update changed the poster name
    this.sortAlbumListItems();

    // Update the album in its round list item
    this.roundListItemsService.updateAlbum(updatedAlbum, this.round);

    // Update round
    this.modelService.updateRound(this.round.id, {}).toPromise();

    // Refresh the currently selected album
    this.selectedAlbum = updatedAlbum;
    this.albumSelectEvent.emit(updatedAlbum);
    this.albumToUpdateId = null;
  }

  /**
   * Delete an album.
   * @param albumToDelete album to delete
   */
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

  /**
   * Populate the album form fields.
   * @param album album to populate with
   */
  populateAlbumForm(album: IAlbum): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    // Set album form values
    this.albumForm.controls.albumSearchQuery.setValue(album.title);
    this.albumForm.controls.spotifyId.setValue(album.spotifyId);
    this.albumForm.controls.posterId.setValue(album.posterId);

    this.albumToUpdateId = album.id;
  }

  /**
   * Clear the album form.
   */
  clearAlbumForm(): void {
    this.albumForm.reset();
    this.albumSearchListItems = [];
  }

  /**
   * Sort the album list items by poster name.
   */
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
