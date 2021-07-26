import { Component, Input, OnInit } from '@angular/core';

import { IAlbum } from '../interfaces/IAlbum';

@Component({
  selector: 'app-album-info',
  templateUrl: './album-info.component.html',
  styleUrls: ['./album-info.component.css']
})
export class AlbumInfoComponent implements OnInit {

  @Input() album: IAlbum;

  constructor() { }

  ngOnInit(): void {
  }

}
