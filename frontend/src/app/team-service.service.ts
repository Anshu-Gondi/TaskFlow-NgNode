/* src/app/team-service.service.ts */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from './web-request.service';

export interface Team {
  _id: string;
  name: string;
  code: string;
  memberships: { userId: string; role: 'viewer' | 'editor' | 'admin' }[];
}

@Injectable({ providedIn: 'root' })
export class TeamService {
  constructor(private req: WebRequestService) {}

  /* ---- create / join / list ---- */
  createTeam(name: string): Observable<Team> {
    return this.req.post<Team>('teams', { name });
  }

  joinWithCode(code: string): Observable<Team> {
    return this.req.post<Team>('teams/join', { code });
  }

  getMyTeams(): Observable<Team[]> {
    return this.req.get<Team[]>('teams');
  }

  /* ---- member management ---- */
  /** list everyone with their role */
  getMembers(teamId: string) {
    return this.req.get<any[]>(`teams/${teamId}/members`);
  }

  /** admin: change a member’s role */
  updateRole(teamId: string, userId: string, role: string) {
    return this.req.patch(`teams/${teamId}/members/${userId}`, { role });
  }

  /** admin: kick a member */
  removeMember(teamId: string, userId: string) {
    return this.req.delete(`teams/${teamId}/members/${userId}`);
  }
}
