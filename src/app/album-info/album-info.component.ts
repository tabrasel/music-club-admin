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
  pickedTrack: IPickedTrack,
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
  pickerIdsControl: FormArray;
  pickedTrackToUpdate: IPickedTrack;

  // Album metrics
  concensusScore: number;
  coverage: number;
  unpickedRatio: number;

  @Input() album: IAlbum;
  @Input() participants: IMember[];
  @Input() round: IRound;

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService
  ) {
    // TODO: Form initialization should really be done in ngOnInit(), but then the form manipulation in ngOnChanges()
    // might run before the form is initialized...

    this.pickerIdsControl = new FormArray([]);

    // Define the picked track form
    this.pickedTrackForm = this.formBuilder.group({
      title: [null, Validators.required],
      trackNumber: [null, Validators.required],
      isTopTrack: [null],
      pickerIds: this.pickerIdsControl
    });
  }

  get pickerIdsFormArray() {
    return this.pickedTrackForm.controls.pickerIds as FormArray;
  }

  ngOnInit(): void {
    this.calculateMetrics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadPickedTrackListItems();

    this.modelService.getMember(this.album.posterId).subscribe(poster => {
      this.poster = poster;
    });

    this.pickerIdsControl.clear();
    this.participants.forEach(participant => {
      this.pickerIdsControl.push(new FormControl(false));
    });

    this.calculateMetrics();
  }

  calculateMetrics(): void {
    const trackCount = this.album.trackCount;
    const pickedTracksCount = this.album.pickedTracks.length;
    const participantsCount = this.participants.length;
    const picksPerParticipant = this.round.picksPerParticipant;

    this.unpickedRatio = (trackCount - pickedTracksCount) / pickedTracksCount;
    this.coverage = pickedTracksCount / trackCount * 100;

    if (pickedTracksCount < picksPerParticipant) {
      this.concensusScore = 100;
    } else if (pickedTracksCount > picksPerParticipant * participantsCount) {
      this.concensusScore = 0;
    } else {
      this.concensusScore = (1 - ((pickedTracksCount - picksPerParticipant) / (picksPerParticipant * participantsCount - picksPerParticipant))) * 100;
    }
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

  populatePickedTrackForm(pickedTrack: IPickedTrack): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    // Set picked track form values
    this.pickedTrackForm.controls.title.setValue(pickedTrack.title);
    this.pickedTrackForm.controls.trackNumber.setValue(pickedTrack.trackNumber);
    this.pickedTrackForm.controls.isTopTrack.setValue(pickedTrack.trackNumber === this.album.topTrackNumber);

    this.pickerIdsControl.clear();
    this.participants.forEach(participant => {
      const checked: boolean = pickedTrack.pickerIds.indexOf(participant.id) !== -1;
      this.pickerIdsControl.push(new FormControl(checked));
    });

    this.pickedTrackToUpdate = pickedTrack;
  }

  async submitPickedTrackForm(): Promise<void> {
    const form: IPickedTrackForm = this.pickedTrackForm.value as IPickedTrackForm;

    // Set the picked track's pickers
    const selectedPickerIds = this.pickedTrackForm.value.pickerIds
      .map((checked, i) => checked ? this.participants[i].id : null)
      .filter(v => v !== null);

    // Define the picked track
    const pickedTrack: IPickedTrack = {
      title: form.title.trim(),
      trackNumber: form.trackNumber,
      pickerIds: selectedPickerIds
    };

    if (this.pickedTrackToUpdate === null) {
      // Abort if the album already has a track with the same track number
      for (let pickedTrack of this.album.pickedTracks) {
        if (form.trackNumber === pickedTrack.trackNumber) {
          alert('The album "' + this.album.title + '" already has a track #' + form.trackNumber);
          return;
        }
      }

      // Update the picked track's album in the database
      const newAlbumData = {};

      // Add picked track to the selected album
      this.album.pickedTracks.push(pickedTrack);
      newAlbumData['pickedTracks'] = this.album.pickedTracks;

      // Set picked track as top track in its album if it's selected
      if (form.isTopTrack) {
        this.album.topTrackNumber = form.trackNumber;
        newAlbumData['topTrackNumber'] = form.trackNumber;
      }

      this.modelService.updateAlbum(this.album.id, newAlbumData).subscribe();

      // Create a list item for the picked track
      this.createPickedTrackListItem(pickedTrack)
        .then(pickedTrackListItem => {
          // Add the picked track list item to the list
          this.pickedTrackListItems.push(pickedTrackListItem);

          // Sort picked track list items by track number
          this.pickedTrackListItems.sort((a, b) => a.pickedTrack.trackNumber < b.pickedTrack.trackNumber ? -1 : 1);
        });
    } else {
      // Update the picked track's album in the database
      const newAlbumData = {};

      // Update picked track in the selected album
      for (let i = 0; i < this.album.pickedTracks.length; i++) {
        if (this.album.pickedTracks[i].trackNumber === this.pickedTrackToUpdate.trackNumber) {
          this.album.pickedTracks[i] = pickedTrack;
          break;
        }
      }
      newAlbumData['pickedTracks'] = this.album.pickedTracks;

      // Set picked track as top track in its album if it's selected
      if (form.isTopTrack) {
        this.album.topTrackNumber = form.trackNumber;
        newAlbumData['topTrackNumber'] = form.trackNumber;
      } else {
        if (this.album.topTrackNumber === this.pickedTrackToUpdate.trackNumber) {
          this.album.topTrackNumber = null;
          newAlbumData['topTrackNumber'] = null;
        }
      }

      this.modelService.updateAlbum(this.album.id, newAlbumData).subscribe();

      // Replace picked track's existing list item with a new one
      for (let i = 0; i < this.pickedTrackListItems.length; i++) {
        if (this.pickedTrackListItems[i].pickedTrack.trackNumber === this.pickedTrackToUpdate.trackNumber) {
          this.pickedTrackListItems[i] = await this.createPickedTrackListItem(pickedTrack);
          break;
        }
      }
    }

    // Close the picked track form modal
    document.getElementById('picked-track-modal-close-button').click();

    this.calculateMetrics();
  }

  clearPickedTrackForm(): void {
    this.pickedTrackForm.reset();
  }

  async deletePickedTrack(deletedPickedTrack: IPickedTrack) {
    // Don't click any elements under the delete button
    event.stopPropagation();

    if (!confirm('Really delete "' + deletedPickedTrack.title + '"?')) return;

    // Delete the picked track from its album in the database
    await this.modelService.deletePickedTrack(deletedPickedTrack, this.album);

    // Remove the picked track's list item
    this.pickedTrackListItems = this.pickedTrackListItems.filter(pickedTrackListItem => pickedTrackListItem.pickedTrack.trackNumber !== deletedPickedTrack.trackNumber);

    this.calculateMetrics();
  }

}
