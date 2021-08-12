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
      picksPerParticipant: [null, Validators.required]
		});

    this.selectedRound = null;

    this.roundViewService.roundListItemsChange.subscribe(roundListItems => {
      this.roundListItems = roundListItems;
    });
  }

  submitRoundForm(): void {
    const form: IRoundForm = this.roundForm.value as IRoundForm;

    // TODO: Check if the new round has the same number as an existing round in the database

    // Create the round in the database
    this.modelService.createRound(form).subscribe(newRound => {
      this.addRoundListItem(newRound);
    });

    // Close the round form modal
    document.getElementById('round-modal-close-button').click();
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
