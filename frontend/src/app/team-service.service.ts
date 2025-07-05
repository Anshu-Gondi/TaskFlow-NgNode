import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from './web-request.service';

export interface TeamMember {
  userId: { _id: string; email?: string; name?: string };
  role: 'viewer' | 'editor' | 'admin';
}

export interface Team {
  _id: string;
  name: string;
  code: string;
  memberships: TeamMember[];
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private req: WebRequestService) {}

  /* ---------- create / join ---------- */
  createTeam(name: string) {
    return this.req.post<Team>('teams', { name });
  }
  joinWithCode(code: string) {
    return this.req.post<Team>('teams/join', { code });
  }

  /* ---------- list user’s teams ---------- */
  getMyTeams() {
    return this.req.get<Team[]>('teams');
  }

  /* ---------- members ---------- */
  getMembers(teamId: string) {
    return this.req.get<TeamMember[]>(`teams/${teamId}/members`);
  }
  updateRole(teamId: string, u: string, role: string) {
    return this.req.patch(`teams/${teamId}/members/${u}`, { role });
  }
  removeMember(teamId: string, u: string) {
    return this.req.delete(`teams/${teamId}/members/${u}`);
  }
  getMemberStats(teamId: string, memberId: string) {
    return this.req.get<{ done: number; total: number; overdue: number }>(
      `/teams/${teamId}/members/${memberId}/stats`
    );
  }
}
