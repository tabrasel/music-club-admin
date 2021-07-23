import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IAlbum } from '../interfaces/IAlbum';
import { IMember } from '../interfaces/IMember';
import { IRound } from '../interfaces/IRound';

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
  selector: 'app-rounds-view',
  templateUrl: './rounds-view.component.html',
  styleUrls: ['./rounds-view.component.css']
})
export class RoundsViewComponent implements OnInit {

  roundForm: FormGroup;

  roundListItems: IRoundListItem[];
  albumListItems: IAlbum[];

  selectedRound: IRound;
  selectedAlbum: IAlbum;

  selectedRoundAlbums: IAlbum[];

  constructor(
    private formBuilder: FormBuilder
  ) { }

  ngOnInit(): void {
    // Define the round form
    this.roundForm = this.formBuilder.group({
			number: [null, Validators.required],
			startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      picksPerParticipant: [null, Validators.required]
		});

    this.roundListItems = [
      {
        round: {
          id: '1234',
          number: 1,
          albumIds: ['1', '2', '3', '4'],
          startDate: '2019-02-11',
          endDate: '2019-02-23',
          picksPerParticipant: 3
        },
        albums: [
          {
            id: '1',
            title: 'Demon Days',
            artist: 'Gorillaz',
            trackCount: 14,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Gorillaz_Demon_Days.PNG',
            posterId: '1',
            pickedTracks: [],
            topTrackNumber: 2
          },
          {
            id: '2',
            title: 'Gorillaz',
            artist: 'Gorillaz',
            trackCount: 15,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/GorillazAlbum.jpg',
            posterId: '2',
            pickedTracks: [],
            topTrackNumber: 5
          },
          {
            id: '3',
            title: 'The Now Now',
            artist: 'Gorillaz',
            trackCount: 9,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gorillaz_-_The_Now_Now.jpg',
            posterId: '3',
            pickedTracks: [],
            topTrackNumber: 1
          }
        ],
        members: [
          {
            id: '1',
            firstName: 'Tate',
            lastName: 'Brasel',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['1']
          },
          {
            id: '2',
            firstName: 'Max',
            lastName: 'Hellen',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['2']
          },
          {
            id: '3',
            firstName: 'Peter',
            lastName: 'Windus',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['3']
          }
        ]
      },
      {
        round: {
          id: '2',
          number: 2,
          albumIds: ['1', '2', '3', '4'],
          startDate: '2019-02-11',
          endDate: '2019-02-23',
          picksPerParticipant: 3
        },
        albums: [
          {
            id: '1',
            title: 'Demon Days',
            artist: 'Gorillaz',
            trackCount: 14,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Gorillaz_Demon_Days.PNG',
            posterId: '1',
            pickedTracks: [],
            topTrackNumber: 2
          },
          {
            id: '2',
            title: 'Gorillaz',
            artist: 'Gorillaz',
            trackCount: 15,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/GorillazAlbum.jpg',
            posterId: '2',
            pickedTracks: [],
            topTrackNumber: 5
          },
          {
            id: '3',
            title: 'The Now Now',
            artist: 'Gorillaz',
            trackCount: 9,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gorillaz_-_The_Now_Now.jpg',
            posterId: '3',
            pickedTracks: [],
            topTrackNumber: 1
          }
        ],
        members: [
          {
            id: '1',
            firstName: 'Tate',
            lastName: 'Brasel',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['1']
          },
          {
            id: '2',
            firstName: 'Max',
            lastName: 'Hellen',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['2']
          },
          {
            id: '3',
            firstName: 'Peter',
            lastName: 'Windus',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['3']
          }
        ]
      },
      {
        round: {
          id: '1234',
          number: 3,
          albumIds: ['1', '2', '3', '4'],
          startDate: '2019-02-11',
          endDate: '2019-02-23',
          picksPerParticipant: 3
        },
        albums: [
          {
            id: '1',
            title: 'Demon Days',
            artist: 'Gorillaz',
            trackCount: 14,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Gorillaz_Demon_Days.PNG',
            posterId: '1',
            pickedTracks: [],
            topTrackNumber: 2
          },
          {
            id: '2',
            title: 'Gorillaz',
            artist: 'Gorillaz',
            trackCount: 15,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/GorillazAlbum.jpg',
            posterId: '2',
            pickedTracks: [],
            topTrackNumber: 5
          },
          {
            id: '3',
            title: 'The Now Now',
            artist: 'Gorillaz',
            trackCount: 9,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gorillaz_-_The_Now_Now.jpg',
            posterId: '3',
            pickedTracks: [],
            topTrackNumber: 1
          }
        ],
        members: [
          {
            id: '1',
            firstName: 'Tate',
            lastName: 'Brasel',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['1']
          },
          {
            id: '2',
            firstName: 'Max',
            lastName: 'Hellen',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['2']
          },
          {
            id: '3',
            firstName: 'Peter',
            lastName: 'Windus',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['3']
          }
        ]
      },
      {
        round: {
          id: '1234',
          number: 1,
          albumIds: ['1', '2', '3', '4'],
          startDate: '2019-02-11',
          endDate: '2019-02-23',
          picksPerParticipant: 3
        },
        albums: [
          {
            id: '1',
            title: 'Demon Days',
            artist: 'Gorillaz',
            trackCount: 14,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Gorillaz_Demon_Days.PNG',
            posterId: '1',
            pickedTracks: [],
            topTrackNumber: 2
          },
          {
            id: '2',
            title: 'Gorillaz',
            artist: 'Gorillaz',
            trackCount: 15,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/GorillazAlbum.jpg',
            posterId: '2',
            pickedTracks: [],
            topTrackNumber: 5
          },
          {
            id: '3',
            title: 'The Now Now',
            artist: 'Gorillaz',
            trackCount: 9,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gorillaz_-_The_Now_Now.jpg',
            posterId: '3',
            pickedTracks: [],
            topTrackNumber: 1
          }
        ],
        members: [
          {
            id: '1',
            firstName: 'Tate',
            lastName: 'Brasel',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['1']
          },
          {
            id: '2',
            firstName: 'Max',
            lastName: 'Hellen',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['2']
          },
          {
            id: '3',
            firstName: 'Peter',
            lastName: 'Windus',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['3']
          }
        ]
      },
      {
        round: {
          id: '1234',
          number: 1,
          albumIds: ['1', '2', '3', '4'],
          startDate: '2019-02-11',
          endDate: '2019-02-23',
          picksPerParticipant: 3
        },
        albums: [
          {
            id: '1',
            title: 'Demon Days',
            artist: 'Gorillaz',
            trackCount: 14,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Gorillaz_Demon_Days.PNG',
            posterId: '1',
            pickedTracks: [],
            topTrackNumber: 2
          },
          {
            id: '2',
            title: 'Gorillaz',
            artist: 'Gorillaz',
            trackCount: 15,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/GorillazAlbum.jpg',
            posterId: '2',
            pickedTracks: [],
            topTrackNumber: 5
          },
          {
            id: '3',
            title: 'The Now Now',
            artist: 'Gorillaz',
            trackCount: 9,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gorillaz_-_The_Now_Now.jpg',
            posterId: '3',
            pickedTracks: [],
            topTrackNumber: 1
          }
        ],
        members: [
          {
            id: '1',
            firstName: 'Tate',
            lastName: 'Brasel',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['1']
          },
          {
            id: '2',
            firstName: 'Max',
            lastName: 'Hellen',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['2']
          },
          {
            id: '3',
            firstName: 'Peter',
            lastName: 'Windus',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['3']
          }
        ]
      },
      {
        round: {
          id: '1234',
          number: 1,
          albumIds: ['1', '2', '3', '4'],
          startDate: '2019-02-11',
          endDate: '2019-02-23',
          picksPerParticipant: 3
        },
        albums: [
          {
            id: '1',
            title: 'Demon Days',
            artist: 'Gorillaz',
            trackCount: 14,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Gorillaz_Demon_Days.PNG',
            posterId: '1',
            pickedTracks: [],
            topTrackNumber: 2
          },
          {
            id: '2',
            title: 'Gorillaz',
            artist: 'Gorillaz',
            trackCount: 15,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/4/41/GorillazAlbum.jpg',
            posterId: '2',
            pickedTracks: [],
            topTrackNumber: 5
          },
          {
            id: '3',
            title: 'The Now Now',
            artist: 'Gorillaz',
            trackCount: 9,
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Gorillaz_-_The_Now_Now.jpg',
            posterId: '3',
            pickedTracks: [],
            topTrackNumber: 1
          }
        ],
        members: [
          {
            id: '1',
            firstName: 'Tate',
            lastName: 'Brasel',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['1']
          },
          {
            id: '2',
            firstName: 'Max',
            lastName: 'Hellen',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['2']
          },
          {
            id: '3',
            firstName: 'Peter',
            lastName: 'Windus',
            participatedRoundIds: ['1'],
            postedAlbumIds: ['3']
          }
        ]
      }
    ];

    this.albumListItems = [];
    this.selectedRound = null;
    this.selectedAlbum = null;
  }

  selectRoundListItem(roundListItem: IRoundListItem): void {
    this.selectedRound = roundListItem.round;
    //alert(this.selectedRound.id);
    this.albumListItems = roundListItem.albums;
  }

  selectAlbumListItem(albumListItem: IAlbum): void {
    this.selectedAlbum = albumListItem;
    //alert(this.selectedAlbum.title);
    //this.pickedTrackListItems =
  }

}
