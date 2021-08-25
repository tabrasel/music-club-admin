import { Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { FormArray, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

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
  spreadScore: number;

  @Input() album: IAlbum;
  @Input() participants: IMember[];
  @Input() round: IRound;

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService
  ) { }

  get pickerIdsFormArray() {
    return this.pickedTrackForm.controls.pickerIds as FormArray;
  }

  ngOnInit(): void {
    // Define the picked track form
    this.pickedTrackForm = this.formBuilder.group({
      title: [null, Validators.required],
      trackNumber: [null, Validators.required],
      isTopTrack: [null],
      pickerIds: new FormArray([])
    });

    //this.loadPickedTrackListItems();

    this.modelService.getAllMembers().subscribe(allMembers => {
      this.participants = allMembers;
      allMembers.forEach(member => {
        this.pickerIdsFormArray.push(new FormControl(false));
      });
    });
  ngOnInit(): void {
    this.calculateScore();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadPickedTrackListItems();

    this.modelService.getMember(this.album.posterId).subscribe(poster => {
      this.poster = poster;
    });
    this.calculateScore();
  }

  calculateScore(): void {
    const avgVotesPerPickedTrack: number = (this.round.picksPerParticipant * this.participants.length) / this.album.pickedTracks.length;
    this.spreadScore = this.album.trackCount / ( avgVotesPerPickedTrack);
  }
  async createPickedTrackListItem(pickedTrack: IPickedTrack): Promise<IPickedTrackListItem> {
    // Create promises for the pickers
    const pickerPromises: Promise<IMember>[] = [];
    for (let pickerId of pickedTrack.pickerIds) {
      const pickerPromise: Promise<IMember> = this.modelService.getMember(pickerId).toPromise();
      pickerPromises.push(pickerPromise);
    }

    // Create list item once all pickers are loaded
    return Promise.all(pickerPromises)
      .then(pickers => {
        const pickedTrackListItem: IPickedTrackListItem = {
          pickedTrack: pickedTrack,
          pickers: pickers
        };
        return pickedTrackListItem;
      })
      .catch(error => {
        return null;
      })
  }

  loadPickedTrackListItems(): void {
    if (this.album === null) return;

    const pickedTrackListItemPromises: Promise<IPickedTrackListItem>[] = this.album.pickedTracks.map(async pickedTrack => {
      return this.createPickedTrackListItem(pickedTrack);
    });

    // Once all picked track list items are created
    Promise.all(pickedTrackListItemPromises).then(pickedTrackListItems => {      
      // Sort picked track list items by track number
      this.pickedTrackListItems = pickedTrackListItems.sort((a, b) => a.pickedTrack.trackNumber < b.pickedTrack.trackNumber ? -1 : 1);
    });
  }

  async submitPickedTrackForm(): Promise<void> {
    const form: IPickedTrackForm = this.pickedTrackForm.value as IPickedTrackForm;

    // TODO: search album in database to see if there was already a picked track with the same track number. This will
    // ensure that the track number can be used as a unique ID (helpful for deletion). Maybe also warn if there is a
    // picked track with the same name.

    // Set the picked track's pickers
    const selectedPickerIds = this.pickedTrackForm.value.pickerIds
      .map((checked, i) => checked ? this.participants[i].id : null)
      .filter(v => v !== null);

    // Create the picked track in the database
    const newPickedTrack: IPickedTrack = {
      title: form.title,
      trackNumber: form.trackNumber,
      pickerIds: selectedPickerIds
    };

    // Abort if the album already has a track with the same track number
    for (let pickedTrack of this.album.pickedTracks) {
      if (newPickedTrack.trackNumber === pickedTrack.trackNumber) {
        alert('The album "' + this.album.title + '" already has a track #' + newPickedTrack.trackNumber);
        return;
      }
    }

    // Update the picked track's album

    const newAlbumData = {};

    // Add picked track to the selected album
    this.album.pickedTracks.push(newPickedTrack);
    newAlbumData['pickedTracks'] = this.album.pickedTracks;

    // Set picked track as top track in its album if it's selected
    if (form.isTopTrack && form.trackNumber !== this.album.topTrackNumber) {
      newAlbumData['topTrackNumber'] = form.trackNumber;
    }

    await this.modelService.updateAlbum(this.album.id, newAlbumData).toPromise();

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
    await this.modelService.deletePickedTrack(deletedPickedTrack, this.album);

    // Remove the picked track's list item
    // TODO: Either needs a better unique identifier, or
    this.pickedTrackListItems = this.pickedTrackListItems.filter(pickedTrackListItem => pickedTrackListItem.pickedTrack.trackNumber != deletedPickedTrack.trackNumber);
  }

}
