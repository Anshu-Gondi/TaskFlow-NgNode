import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Team, TeamService } from '../../team-service.service';
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
  teamMembers: any[] = [];
  selectedTeamId: string = '';
  isAdmin: boolean = false;

  public currentUserId = localStorage.getItem('_id') ?? '';

  constructor(private teamSvc: TeamService, private router: Router, public authService: AuthService) {}

  ngOnInit() {
    this.refreshTeams();
  }

  createTeam() {
    if (!this.newTeamName.trim()) return;
    this.teamSvc.createTeam(this.newTeamName).subscribe(() => {
      this.newTeamName = '';
      this.refreshTeams();
    });
  }

  joinTeam() {
    if (!this.joinCode.trim()) return;
    this.teamSvc.joinWithCode(this.joinCode).subscribe(() => {
      this.joinCode = '';
      this.refreshTeams();
    });
  }

  refreshTeams() {
    this.teamSvc.getMyTeams().subscribe((ts) => (this.teams = ts));
  }

  loadTeamMembers(teamId: string) {
    this.selectedTeamId = teamId;
    this.teamSvc.getMembers(teamId).subscribe((members) => {
      this.teamMembers = members;
      const me = members.find(
        (m) => m.userId._id === this.authService.currentUserId
      );
      this.isAdmin = me?.role === 'admin';
    });
  }

  updateMemberRole(memberId: string, newRole: string) {
    this.teamSvc
      .updateRole(this.selectedTeamId, memberId, newRole)
      .subscribe(() => {
        alert('Role updated!');
        this.loadTeamMembers(this.selectedTeamId);
      });
  }

  removeMember(userId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    this.teamSvc.removeMember(this.selectedTeamId, userId).subscribe(() => {
      alert('Member removed successfully.');
      this.loadTeamMembers(this.selectedTeamId); // Refresh the list
    });
  }
}
