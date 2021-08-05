import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { AlbumService } from '../album.service';
import { RoundService } from '../round.service';
import { RoundViewService } from '../round-view.service'

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
    private albumService: AlbumService,
    private roundService: RoundService,
    private roundViewService: RoundViewService
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
      this.roundListItems =  roundListItems;
    });
  }

  selectRoundListItem(selectedRoundListItem: IRoundListItem): void {
    this.selectedRound = selectedRoundListItem.round;
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
    document.getElementById('round-modal-close-button').click();
  }

  clearRoundForm(): void {
    this.roundForm.reset();
  }

}
