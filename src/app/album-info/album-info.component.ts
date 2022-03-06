import { Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { FormArray, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

interface ITrack {
  title: string;
  diskNumber: number;
  trackNumber: number;
  pickerIds: string[];
}

interface ITrackListItem {
  track: ITrack,
  pickers: IMember[]
}

interface ITrackForm {
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

  trackForm: FormGroup;
  trackListItems: ITrackListItem[];
  poster: IMember;
  pickerIdsControl: FormArray;
  trackToUpdate: ITrack;
  remainingVotes: number;

  // Album metrics
  concensusScore: number;
  coverage: number;

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

    // Define the track form
    this.trackForm = this.formBuilder.group({
      isTopTrack: [null],
      pickerIds: this.pickerIdsControl
    });
  }

  get pickerIdsFormArray() {
    return this.trackForm.controls.pickerIds as FormArray;
  }

  ngOnInit(): void {
    this.calculateMetrics();

    this.trackToUpdate = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.loadTrackListItems();

    this.modelService.getMember(this.album.posterId).subscribe(poster => {
      this.poster = poster;
    });

    this.pickerIdsControl.clear();
    this.participants.forEach(participant => {
      this.pickerIdsControl.push(new FormControl(false));
    });

    //this.calculateMetrics();
  }

  calculateMetrics(): void {
    /*
    const trackCount = this.album.trackCount;
    const pickedTracksCount = this.album.pickedTracks.length;
    const participantsCount = this.participants.length;
    const picksPerParticipant = this.round.picksPerParticipant;

    // Determine how many votes have not been recorded
    this.remainingVotes = picksPerParticipant * participantsCount;
    for (let pickedTrack of this.album.pickedTracks) {
      this.remainingVotes -= pickedTrack.pickerIds.length;
    }

    // Don't calculate metrics if all votes aren't in
    if (this.remainingVotes !== 0) return;

    this.concensusScore = (1 - ((pickedTracksCount - picksPerParticipant) / (picksPerParticipant * participantsCount - picksPerParticipant))) * 100;
    this.coverage = pickedTracksCount / trackCount * 100;
    */
  }

  async createTrackListItem(track: any): Promise<ITrackListItem> {
    // Create promises for the pickers
    const pickerPromises: Promise<IMember>[] = [];
    for (let pickerId of track.pickerIds) {
      const pickerPromise: Promise<IMember> = this.modelService.getMember(pickerId).toPromise();
      pickerPromises.push(pickerPromise);
    }

    // Create track list item
    return Promise.all(pickerPromises)
      .then(pickers => {
        const trackListItem: ITrackListItem = {
          track: track,
          pickers: pickers
        };
        return trackListItem;
      })
      .catch(error => {
        return null;
      })
  }

  loadTrackListItems(): void {
    if (this.album === null) return;

    const trackListItemPromises: Promise<ITrackListItem>[] = this.album.tracks.map(async (track: any) => {
      return this.createTrackListItem(track);
    });

    // Sort track list items by track number
    Promise.all(trackListItemPromises).then(trackListItems => {
      this.trackListItems = trackListItems.sort((a, b) => a.track.trackNumber < b.track.trackNumber ? -1 : 1);
    });
  }

  populateTrackForm(track: ITrack): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    // Set track form values
    this.trackForm.controls.isTopTrack.setValue(track.trackNumber === this.album.topTrackNumber);

    this.pickerIdsControl.clear();
    this.participants.forEach((participant) => {
      const checked: boolean = track.pickerIds.indexOf(participant.id) !== -1;
      this.pickerIdsControl.push(new FormControl(checked));
    });

    this.trackToUpdate = track;
  }

  async submitTrackForm(): Promise<void> {
    const form: ITrackForm = this.trackForm.value as ITrackForm;

    // Set the track's pickers
    const selectedPickerIds = this.trackForm.value.pickerIds
      .map((checked, i) => checked ? this.participants[i].id : null)
      .filter(v => v !== null);

    // Define the updated track
    const track: ITrack = {
      ...this.trackToUpdate,
      pickerIds: selectedPickerIds
    };

    // Update the picked track's album in the database
    const updateData = {};

    // Update picked track in the selected album
    for (let i = 0; i < this.album.tracks.length; i++) {
      if (this.album.tracks[i].trackNumber === this.trackToUpdate.trackNumber) {
        this.album.tracks[i] = track;
        break;
      }
    }
    updateData['tracks'] = this.album.tracks;

    // Set track as top track in the album if it's marked so
    if (form.isTopTrack) {
      this.album.topTrackNumber = form.trackNumber;
      updateData['topDiskNumber'] = this.trackToUpdate.diskNumber;
      updateData['topTrackNumber'] = this.trackToUpdate.trackNumber;
    } else {
      if (this.album.topTrackNumber === this.trackToUpdate.trackNumber) {
        this.album.topDiskNumber = null;
        this.album.topTrackNumber = null;
        updateData['topDiskNumber'] = null;
        updateData['topTrackNumber'] = null;
      }
    }

    this.modelService.updateAlbum(this.album.id, updateData);

    // Replace track's existing list item with a new one
    for (let i = 0; i < this.trackListItems.length; i++) {
      if (this.trackListItems[i].track.trackNumber === this.trackToUpdate.trackNumber) {
        this.trackListItems[i] = await this.createTrackListItem(track);
        break;
      }
    }

    this.trackToUpdate = null;

    // Close the track form modal
    document.getElementById('track-modal-close-button').click();

    //this.calculateMetrics();
  }

  clearTrackForm(): void {
    this.trackForm.reset();
  }

}
