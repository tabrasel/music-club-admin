import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// Import model interfaces
import { IMember } from '../interfaces/IMember';

// Import services
import { ModelService } from '../model.service';

interface IMemberForm {
  firstName: string;
  lastName: string;
}

interface IMemberListItem {
  member: IMember
}

@Component({
  selector: 'app-members-view',
  templateUrl: './members-view.component.html',
  styleUrls: ['./members-view.component.css']
})
export class MembersViewComponent implements OnInit {

  memberForm: FormGroup;
  memberListItems: IMemberListItem[];

  constructor(
    private formBuilder: FormBuilder,
    private modelService: ModelService
  ) { }

  ngOnInit(): void {
    // Define the member form
    this.memberForm = this.formBuilder.group({
      firstName: [null, Validators.required],
      lastName: [null, Validators.required]
    });

    // List all members
    this.memberListItems = [];
    this.modelService.getAllMembers().subscribe(allMembers => {
      for (let member of allMembers) {
        const memberListItem: IMemberListItem = {
          member: member
        };
        this.memberListItems.push(memberListItem);
      }
    });
  }

  async submitMemberForm(): Promise<void> {
    const form: IMemberForm = this.memberForm.value as IMemberForm;

    // Create the member
    const member: IMember = await this.modelService.createMember(form.firstName, form.lastName).toPromise();

    // Create the member list item
    const memberListItem: IMemberListItem = {
      member: member
    };

    // Add the member list item to the list
    this.memberListItems.push(memberListItem);

    // Sort member list items

    // Close the member form modal
    document.getElementById('member-modal-close-button').click();
  }

  clearMemberForm(): void {
    this.memberForm.reset();
  }

}
