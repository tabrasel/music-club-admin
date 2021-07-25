import { Component, Input, OnInit } from '@angular/core';

import { IRound } from '../interfaces/IRound';

@Component({
  selector: 'app-round-info',
  templateUrl: './round-info.component.html',
  styleUrls: ['./round-info.component.css']
})
export class RoundInfoComponent implements OnInit {

  @Input() round: IRound;

  constructor() { }

  ngOnInit(): void {
  }

}
