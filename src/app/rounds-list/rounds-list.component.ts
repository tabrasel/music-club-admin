import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

interface IRoundForm {
  number: number;
  startDate: string;
  endDate: string;
  picksPerParticipant: number;
}

interface IRoundListItem {
  round: IRound;
  albums: IAlbum[];
  members: IMember[];
}

@Component({
  selector: 'app-rounds-list',
  templateUrl: './rounds-list.component.html',
  styleUrls: ['./rounds-list.component.css']
})
export class RoundsListComponent implements OnInit {

  roundForm: FormGroup;
  roundListItems: IRoundListItem[];
  selectedRound: IRound;
  roundToUpdateId: string;

  @Output() roundSelectEvent = new EventEmitter<IRound>();

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService
  ) { }

  ngOnInit(): void {
    // Define the round form
    this.roundForm = this.formBuilder.group({
			number: [null, Validators.required],
			startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      picksPerParticipant: [3, Validators.required]
		});

    this.selectedRound = null;
    this.roundToUpdateId = null;

    /*
    this.roundViewService.roundListItemsChange.subscribe(roundListItems => {
      this.roundListItems = roundListItems;
    });
    */

    this.roundListItems = [];
    this.loadRoundListItems();
  }

  async createRoundListItem(round: IRound): Promise<IRoundListItem> {
    // Load the albums in the round
    const albums: IAlbum[] = [];
    for (let albumId of round.albumIds) {
      const album: IAlbum = await this.modelService.getAlbum(albumId).toPromise();
      albums.push(album);
    }

    // Load the participants in the round
    const participants: IMember[] = [];
    const participantPromises: Promise<IMember>[] = [];
    for (let album of albums) {
      const participantPromise: Promise<IMember> = this.modelService.getMember(album.posterId).toPromise();
      participantPromises.push(participantPromise);
    }

    return Promise.all(participantPromises)
      .then(participants => {
        // Sort participants by name
        participants.sort((a, b) => {
          if (a.lastName < b.lastName)
            return -1;
          else if (a.lastName > b.lastName)
            return 1;
          return a.firstName < b.firstName ? -1 : 1;
        });

        // Sort albums by poster name
        albums.sort((a, b) => {
          const aPoster: IMember = participants.filter(participant => participant.id === a.posterId)[0];
          const bPoster: IMember = participants.filter(participant => participant.id === b.posterId)[0];

          if (aPoster.lastName < bPoster.lastName)
            return -1;
          else if (aPoster.lastName > bPoster.lastName)
            return 1;
          return aPoster.firstName < bPoster.firstName ? -1 : 1;
        });

        const roundListItem: IRoundListItem = {
          round: round,
          albums: albums,
          members: participants
        };

        return roundListItem;
      })
      .catch(error => {
        return null;
      });
  }

  async loadRoundListItems(): Promise<void> {
    const allRounds = await this.modelService.getAllRounds().toPromise();

    const roundListItemPromises: Promise<IRoundListItem>[] = [];
    for (let round of allRounds) {
      const roundListItemPromise: Promise<IRoundListItem> = this.createRoundListItem(round);
      roundListItemPromises.push(roundListItemPromise)
    }

    Promise.all(roundListItemPromises)
      .then(roundListItems => {
        // Sort round list items by descending round number
        this.roundListItems = roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1);
      })

  }

  submitRoundForm(): void {
    const formValues: IRoundForm = this.roundForm.value as IRoundForm;

    // TODO: Check if the new round has the same number as an existing round in the database

    if (this.roundToUpdateId == null) {
      // Create the round in the database
      this.modelService.createRound(formValues).subscribe(createdRound => {
        this.addRoundListItem(createdRound);
      });
    } else {
      // Update the round in the database
      this.modelService.updateRound(this.roundToUpdateId, formValues).subscribe(updatedRound => {
        // Update the list item for the round
        //this.roundListItems = this.roundListItems.filter(roundListItem => roundListItem.round.id !== roundToDelete.id);
      });
      this.roundToUpdateId = null;
    }

    // Close the round form modal
    document.getElementById('round-modal-close-button').click();
  }

  populateRoundForm(roundToUpdate: IRound): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    // Set round form values
    this.roundForm.controls.number.setValue(roundToUpdate.number);
    this.roundForm.controls.picksPerParticipant.setValue(roundToUpdate.picksPerParticipant);
    this.roundForm.controls.startDate.setValue(roundToUpdate.startDate);
    this.roundForm.controls.endDate.setValue(roundToUpdate.endDate);

    this.roundToUpdateId = roundToUpdate.id;
  }

  deleteRound(roundToDelete: IRound): void {
    // Don't click any elements under the delete button
    event.stopPropagation();

    // Confirm that the round should be deleted
    if (!confirm('Really delete round ' + roundToDelete.number + '? This will delete all its albums as well.')) return;

    // Delete the round
    this.modelService.deleteRound(roundToDelete).then(r => r.subscribe());

    // Remove the list item for the round
    this.roundListItems = this.roundListItems.filter(roundListItem => roundListItem.round.id !== roundToDelete.id);
  }

  /**
   * Add a new round list item to the round list.
   * @param round the round to create a list item for
   */
  addRoundListItem(round: IRound): void {
    // Create a list item for the round
    const roundListItem: IRoundListItem = {
      round: round,
      albums: [],
      members: []
    };

    // Add the round list item to the list
    this.roundListItems.push(roundListItem);

    // Sort round list items by descending round number
    this.roundListItems = this.roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1);
  }

  selectRoundListItem(selectedRoundListItem: IRoundListItem): void {
    this.selectedRound = selectedRoundListItem.round;
    this.roundSelectEvent.emit(selectedRoundListItem.round);
  }

  clearRoundForm(): void {
    this.roundForm.reset();
    this.roundForm.patchValue({
      picksPerParticipant: 3
    })
  }

}
