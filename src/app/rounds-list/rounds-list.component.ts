import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { RoundViewService } from '../round-view.service';
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
    private roundViewService: RoundViewService,
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

    this.roundViewService.roundListItemsChange.subscribe(roundListItems => {
      this.roundListItems = roundListItems;
    });
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
  }

}
