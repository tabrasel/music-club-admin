import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

import { ModelService } from '../model.service';

import { DateTime } from "luxon";

@Component({
  selector: 'app-round-info',
  templateUrl: './round-info.component.html',
  styleUrls: ['./round-info.component.css']
})
export class RoundInfoComponent implements OnInit {

  selectedAlbum: IAlbum;
  participants: IMember[];
  startDateStr: any;
  endDateStr: any;
  durationStr: any;

  @Input() round: IRound;

  constructor(
    private modelService: ModelService
  ) { }

  ngOnInit(): void {
    this.selectedAlbum = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('round' in changes) {
      this.selectedAlbum = null;

      if (this.round === null) return;

      this.loadParticipants();

      const startDate = DateTime.fromISO(this.round.startDate);
      const endDate = DateTime.fromISO(this.round.endDate);
      const duration = endDate.diff(startDate, 'days');

      this.startDateStr = startDate.toLocaleString(DateTime.DATE_MED);
      this.endDateStr = endDate.toLocaleString(DateTime.DATE_MED);
      this.durationStr = (duration === 1) ? '1 day' : (duration.days + ' days');
    }
  }

  selectAlbum(newSelectedAlbum: any): void {
    this.selectedAlbum = newSelectedAlbum;
  }

  async loadParticipants(): Promise<void> {
    if (this.round === null) return;

    this.participants = [];

    const participantPromises: Promise<IMember>[] = this.round.participantIds.map(participantId => {
      return this.modelService.getMember(participantId).toPromise();
    });

    // Sort participants once all participants have been loaded
    Promise.all(participantPromises).then(participants => {
      // Sort participants by name
      this.participants = participants.sort((p1, p2) => this.modelService.compareMembers(p1, p2));
    });
  }

}
