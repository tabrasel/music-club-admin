import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';
import { RoundListItemsService } from '../round-list-items.service';

import { DateTime } from 'luxon';

interface IRoundForm {
  number: number;
  description: string;
  startDate: string;
  endDate: string;
  picksPerParticipant: number;
}

interface IRoundListItem {
  round: IRound;
  albums: IAlbum[];
  participants: IMember[];
  startDateStr: string;
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
  participantIdsControl: FormArray;
  clubMembers: IMember[];

  @Output() roundSelectEvent = new EventEmitter<string>();

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService,
    private roundListItemsService: RoundListItemsService
  ) {
    this.participantIdsControl = new FormArray([]);

    // Define the round form
    this.roundForm = this.formBuilder.group({
			number: [null, Validators.required],
      description: null,
			startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      participantIds: this.participantIdsControl,
      picksPerParticipant: [3, Validators.required]
		});
  }

  async ngOnInit(): Promise<void> {
    this.selectedRound = null;
    this.roundToUpdateId = null;

    this.roundListItemsService.loadRoundListItems();
    this.roundListItemsService.stream.subscribe(roundListItems => {
      this.roundListItems = roundListItems;

      // Select the first round
      this.selectRoundListItem(roundListItems[0]);
    });

    // Load all club members
    const allMembers: IMember[] = await this.modelService.getAllMembers().toPromise();
    this.clubMembers = allMembers.sort((m1, m2) => this.modelService.compareMembers(m1, m2));

    // Add each club member as a round participant option
    this.clubMembers.forEach(clubMember => this.participantIdsControl.push(new FormControl(false)));
  }

  get participantIdsFormArray() {
    return this.roundForm.controls.participantIds as FormArray;
  }

  /**
   * Uses form values to either create a new round or update an existing one.
   */
  async submitRoundForm(): Promise<void> {
    const formValues: IRoundForm = this.roundForm.value as IRoundForm;

    // TODO: Check if the new round has the same number as an existing round in the database

    // Set the round's participants
    const selectedParticipantIds = this.roundForm.value.participantIds
      .map((checked, i) => checked ? this.clubMembers[i].id : null)
      .filter(v => v !== null);

    // Formatted form values
    const roundInfo: any = {
      number: formValues.number,
      description: formValues.description,
      participantIds: selectedParticipantIds,
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      picksPerParticipant: formValues.picksPerParticipant
    };

    if (this.roundToUpdateId === null) {
      this.createRound(roundInfo);
    } else {
      this.updateRound(roundInfo);
    }

    // Close the round form modal
    document.getElementById('round-modal-close-button').click();
  }

  /**
   * Creates a new round.
   */
  async createRound(roundInfo: any): Promise<void> {
    // Create the round
    const createdRound: IRound = await this.modelService.createRound(roundInfo).toPromise();

    // Create a round list item for the new round
    const roundListItem: IRoundListItem = await this.createRoundListItem(createdRound);

    // Add the round list item to the list
    this.roundListItems.push(roundListItem);

    // Sort round list items by descending round number
    this.roundListItems = this.roundListItems.sort((a, b) => a.round.number > b.round.number ? -1 : 1);
  }

  /**
   * Updates an existing round.
   */
  async updateRound(roundInfo: any): Promise<void> {
    // Update the round
    const updatedRound: IRound = await this.modelService.updateRound(this.roundToUpdateId, roundInfo).toPromise();

    // Refresh the updated round's info
    this.selectedRound = updatedRound;
    this.roundSelectEvent.emit(updatedRound.id);

    // Replace the round's list item with a new one
    const index: number = this.roundListItemsService.getRoundListItemIndex(updatedRound);
    const updatedRoundListItem: IRoundListItem = await this.roundListItemsService.createRoundListItem(updatedRound);
    this.roundListItems[index] = updatedRoundListItem;

    this.roundToUpdateId = null;
  }

  populateRoundForm(roundToUpdateId: string): void {
    // Don't click any elements under the edit button
    event.stopPropagation();

    this.modelService.getRound(roundToUpdateId).subscribe((roundToUpdate: IRound) => {
      // Set round form values
      this.roundForm.controls.number.setValue(roundToUpdate.number);
      this.roundForm.controls.description.setValue(roundToUpdate.description);
      this.roundForm.controls.picksPerParticipant.setValue(roundToUpdate.picksPerParticipant);
      this.roundForm.controls.startDate.setValue(roundToUpdate.startDate);
      this.roundForm.controls.endDate.setValue(roundToUpdate.endDate);

      this.participantIdsControl.clear();
      this.clubMembers.forEach(member => {
        const isChecked: boolean = roundToUpdate.participantIds.indexOf(member.id) !== -1;
        this.participantIdsControl.push(new FormControl(isChecked));
      });

      this.roundToUpdateId = roundToUpdateId;
    });
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
   * Creates a round list item for a given round.
   * @param round the round to create a round list item for
   */
  async createRoundListItem(round: IRound): Promise<any> {
    const participantPromises: Promise<IMember>[] = round.participantIds.map(participantId => {
      return this.modelService.getMember(participantId).toPromise();
    });

    // Retreive all round participants at once
    const participants: IMember[] = await Promise.all(participantPromises);

    // Create a start date label
    const startDate = DateTime.fromISO(round.startDate);
    const startDateLabel: string = startDate.toLocaleString(DateTime.DATE_MED);

    // Create a list item for the round
    const roundListItem: IRoundListItem = {
      round: round,
      albums: [],
      participants: participants,
      startDateStr: startDateLabel
    };

    return Promise.resolve(roundListItem);
  }

  async selectRoundListItem(selectedRoundListItem: IRoundListItem): Promise<void> {
    if (selectedRoundListItem === undefined) return;

    const round: IRound = await this.modelService.getRound(selectedRoundListItem.round.id).toPromise();
    this.selectedRound = round;
    this.roundSelectEvent.emit(selectedRoundListItem.round.id);
  }

  clearRoundForm(): void {
    this.roundForm.reset();
    this.roundForm.patchValue({
      picksPerParticipant: 3
    })
  }

}
