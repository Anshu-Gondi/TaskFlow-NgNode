import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Team, TeamMember, TeamService } from '../../team-service.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-team-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './team-hub.component.html',
  styleUrls: ['./team-hub.component.scss'],
})
export class TeamHubComponent implements OnInit {
  newTeamName = '';
  joinCode = '';

  teams: Team[] = [];
  teamMembers: TeamMember[] = [];
  selectedTeamId = '';
  isAdmin = false;

  /** always read from AuthService so it stays up‑to‑date */
  get currentUserId(): string {
    return this.authSvc.currentUserId ?? '';
  }

  constructor(
    private teamSvc: TeamService,
    private router: Router,
    public authSvc: AuthService
  ) {}

  /* ------------ life‑cycle ------------ */
  ngOnInit() {
    this.refreshTeams();
  }

  /* ------------ create / join ------------ */
  createTeam() {
    if (!this.newTeamName.trim()) return;
    this.teamSvc.createTeam(this.newTeamName.trim()).subscribe(() => {
      this.newTeamName = '';
      this.refreshTeams();
    });
  }

  joinTeam() {
    if (!this.joinCode.trim()) return;

    this.teamSvc.joinWithCode(this.joinCode.trim()).subscribe({
      next: () => {
        this.joinCode = '';
        this.refreshTeams();
      },
      error: (err) => {
        if (err.status === 400 && err.error?.error === 'Already a member') {
          alert('⚠️ You are already a member of this team.');
        } else {
          alert('❌ Failed to join team. Please check the code and try again.');
          console.error('Join team error:', err);
        }
      },
    });
  }

  /* ------------ lists ------------ */
  refreshTeams() {
    this.teamSvc.getMyTeams().subscribe((ts) => (this.teams = ts));
  }

  loadTeamMembers(id: string) {
    this.selectedTeamId = id;
    this.teamSvc.getMembers(id).subscribe((ms) => {
      this.teamMembers = ms;
      this.isAdmin = ms.some(
        (m) => m.userId._id === this.currentUserId && m.role === 'admin'
      );
    });
  }

  /* ------------ admin actions ------------ */
  updateMemberRole(uid: string, role: string) {
    this.teamSvc.updateRole(this.selectedTeamId, uid, role).subscribe(() => {
      this.loadTeamMembers(this.selectedTeamId);
    });
  }

  removeMember(uid: string) {
    if (!confirm('Remove this member?')) return;
    this.teamSvc.removeMember(this.selectedTeamId, uid).subscribe(() => {
      this.loadTeamMembers(this.selectedTeamId);
    });
  }
}
