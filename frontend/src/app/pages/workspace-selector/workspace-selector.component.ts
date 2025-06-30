import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workspace-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-selector.component.html',
  styleUrls: ['./workspace-selector.component.scss'],
})
export class WorkspaceSelectorComponent {
  constructor(private router: Router) {}

  goToSolo() {
    localStorage.setItem('lastWorkspace', 'solo');
    this.router.navigate(['/workspace/solo']);
  }

  goToTeams() {
    localStorage.setItem('lastWorkspace', 'team');
    this.router.navigate(['/teams']);
  }

  clearDefault() {
    localStorage.removeItem('lastWorkspace');
  }
}
