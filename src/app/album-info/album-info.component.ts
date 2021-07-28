import { Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AlbumService } from '../album.service';

import { IAlbum } from '../interfaces/IAlbum';

interface IPickedTrack {
  title: string;
  trackNumber: number;
  pickerIds: string[];
}

interface IPickedTrackListItem {
  pickedTrack: any,
  pickerNicknames: string[]
}

interface IPickedTrackForm {
  title: string;
  trackNumber: number;
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

  @Input() album: IAlbum;

  constructor(
    private formBuilder: FormBuilder,
    private albumService: AlbumService
  ) { }

  ngOnInit(): void {
    // Define the picked track form
    this.pickedTrackForm = this.formBuilder.group({
      title: [null, Validators.required],
      trackNumber: [null, Validators.required],
      pickerIds: [null]
    });

    this.loadPickedTrackListItems();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadPickedTrackListItems();
  }

  loadPickedTrackListItems(): void {
    if (this.album === null)
      return

    this.pickedTrackListItems = [];

    for (let pickedTrack of this.album.pickedTracks) {
      // TODO: Load picker nicknames from picker ids

      const pickedTrackListItem: IPickedTrackListItem = {
        pickedTrack: pickedTrack,
        pickerNicknames: []
      };
      this.pickedTrackListItems.push(pickedTrackListItem);
    }

    // Sort picked track list items by track number
    this.pickedTrackListItems.sort((a, b) => a.pickedTrack.trackNumber < b.pickedTrack.trackNumber ? -1 : 1);
  }

  async submitPickedTrackForm(): Promise<void> {
    const form: IPickedTrackForm = this.pickedTrackForm.value as IPickedTrackForm;

    // Create the picked track in the database
    const newPickedTrack: IPickedTrack = {
      title: form.title,
      trackNumber: form.trackNumber,
      pickerIds: form.pickerIds
    };

    // Add picked track to the selected album
    this.album.pickedTracks.push(newPickedTrack);
    await this.albumService.updateAlbum(this.album.id, { pickedTracks: this.album.pickedTracks }).toPromise();

    // Create a list item for the picked track
    const newPickedTrackListItem: IPickedTrackListItem = {
      pickedTrack: newPickedTrack,
      pickerNicknames: []
    };

    // Add the picked track list item to the list
    this.pickedTrackListItems.push(newPickedTrackListItem);

    // Sort picked track list items by track number
    this.pickedTrackListItems.sort((a, b) => a.pickedTrack.trackNumber < b.pickedTrack.trackNumber ? -1 : 1);

    // Close the picked track form modal
    document.getElementById('modal-close-button').click();
  }

  clearPickedTrackForm(): void {
    this.pickedTrackForm.reset();
  }

}
