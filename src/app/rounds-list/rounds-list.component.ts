import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { RoundService } from '../round.service';

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
  roundListItems: any[];
  selectedRound: IRound;

  @Output() roundSelectEvent = new EventEmitter<IRound>();

  constructor(
    private formBuilder: FormBuilder,
    private roundService: RoundService
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

    this.loadAllRounds();
  }

  loadAllRounds(): void {
    // Clear list of round list items
    this.roundListItems = [];

    this.roundService.getAllRounds().subscribe(rounds => {
      for (let round of rounds) {
        // TODO: sync load the albums and members of the round

        const roundListItem: IRoundListItem = {
          round: round,
          albums: [],
          members: []
        };

        this.roundListItems.push(roundListItem);
      }

      // Sort round list items by descending round number
      this.roundListItems = this.roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1);
    });
  }

  selectRoundListItem(selectedRoundListItem: IRoundListItem): void {
    //alert(selectedRoundListItem.round.id);
    this.roundSelectEvent.emit(selectedRoundListItem.round);
  }

  async submitRoundForm(): Promise<void> {
    const form: IRoundForm = this.roundForm.value as IRoundForm;

    // Create the round in the database
    const newRound: IRound = await this.roundService.createRound(form).toPromise();

    // Create a list item for the round
    const newRoundListItem: IRoundListItem = {
      round: newRound,
      albums: [],
      members: []
    };

    // Add the round list item to the list
    this.roundListItems.push(newRoundListItem);

    // Sort round list items by descending round number
    this.roundListItems = this.roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1);

    // Close the round form modal
    document.getElementById('modal-close-button').click();
  }

  clearRoundForm(): void {
    this.roundForm.reset();
  }

}
