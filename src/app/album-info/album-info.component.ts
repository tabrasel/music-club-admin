import { Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AlbumService } from '../album.service';
import { MemberService } from '../member.service';

import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';

interface IPickedTrack {
  title: string;
  trackNumber: number;
  pickerIds: string[];
}

interface IPickedTrackListItem {
  pickedTrack: any,
  pickers: IMember[]
}

interface IPickedTrackForm {
  title: string;
  trackNumber: number;
  isTopTrack: boolean;
  pickerIds: string[];
}

@Component({
  selector: 'app-album-info',
  templateUrl: './album-info.component.html',
  styleUrls: ['./album-info.component.css']
})
export class AlbumInfoComponent implements OnInit {

  pickedTrackForm: FormGroup;
  pickedTrackListItems: any[];
  poster: IMember;

  @Input() album: IAlbum;

  constructor(
    private formBuilder: FormBuilder,
    private albumService: AlbumService,
    private memberService: MemberService
  ) { }

  ngOnInit(): void {
    // Define the picked track form
    this.pickedTrackForm = this.formBuilder.group({
      title: [null, Validators.required],
      trackNumber: [null, Validators.required],
      isTopTrack: [null],
      pickerIds: [null]
    });

    this.loadPickedTrackListItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadPickedTrackListItems();

    this.memberService.getMemberById(this.album.posterId).subscribe(poster => {
      this.poster = poster;
    });
  }

  loadPickedTrackListItems(): void {
    if (this.album === null)
      return

    this.pickedTrackListItems = [];

    for (let pickedTrack of this.album.pickedTracks) {
      // TODO: Load pickers from picker ids

      const pickedTrackListItem: IPickedTrackListItem = {
        pickedTrack: pickedTrack,
        pickers: []
      };
      this.pickedTrackListItems.push(pickedTrackListItem);
    }

    // Sort picked track list items by track number
    this.pickedTrackListItems.sort((a, b) => a.pickedTrack.trackNumber < b.pickedTrack.trackNumber ? -1 : 1);
  }

  async submitPickedTrackForm(): Promise<void> {
    const form: IPickedTrackForm = this.pickedTrackForm.value as IPickedTrackForm;

    // TODO: search album in database to see if there was already a picked track with the same track number. This will
    // ensure that the track number can be used as a unique ID (helpful for deletion). Maybe also warn if there is a
    // picked track with the same name.

    // Create the picked track in the database
    const newPickedTrack: IPickedTrack = {
      title: form.title,
      trackNumber: form.trackNumber,
      pickerIds: form.pickerIds
    };

    // Update the picked track's album

    const newAlbumData = {};

    // Add picked track to the selected album
    this.album.pickedTracks.push(newPickedTrack);
    newAlbumData['pickedTracks'] = this.album.pickedTracks;

    // Set picked track as top track in its album if it's selected
    if (form.isTopTrack && form.trackNumber !== this.album.topTrackNumber) {
      newAlbumData['topTrackNumber'] = form.trackNumber;
    }

    await this.albumService.updateAlbum(this.album.id, newAlbumData).toPromise();

    // Create a list item for the picked track
    const newPickedTrackListItem: IPickedTrackListItem = {
      pickedTrack: newPickedTrack,
      pickers: []
    };

    // Add the picked track list item to the list
    this.pickedTrackListItems.push(newPickedTrackListItem);

    // Sort picked track list items by track number
    this.pickedTrackListItems.sort((a, b) => a.pickedTrack.trackNumber < b.pickedTrack.trackNumber ? -1 : 1);

    // Close the picked track form modal
    document.getElementById('picked-track-modal-close-button').click();
  }

  clearPickedTrackForm(): void {
    this.pickedTrackForm.reset();
  }

  async deletePickedTrack(deletedPickedTrack: IPickedTrack) {
    // Don't click any elements under the delete button
    event.stopPropagation();
    
    if (!confirm('Really delete "' + deletedPickedTrack.title + '"?')) return;

    // TODO: Delete the picked track from its album in the database
    await this.albumService.deletePickedTrack(deletedPickedTrack, this.album);

    // Remove the picked track's list item
    // TODO: Either needs a better unique identifier, or
    this.pickedTrackListItems = this.pickedTrackListItems.filter(pickedTrackListItem => pickedTrackListItem.pickedTrack.trackNumber != deletedPickedTrack.trackNumber);
  }

}
