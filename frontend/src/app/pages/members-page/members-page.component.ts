import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamService } from '../../team-service.service';
import { AuthService } from '../../auth.service';

interface Toast {
  id: number;
  message: string;
  type: 'is-success' | 'is-danger' | 'is-warning';
}

@Component({
  selector: 'app-members-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members-page.component.html',
  styleUrl: './members-page.component.scss',
})
export class MembersPageComponent implements OnInit {
  teamId: string | null = null;
  members: any[] = [];

  currentUserId = '';
  isAdmin = false;
  confirmKickId: string | null = null;

  toasts: Toast[] = [];
  private toastSeq = 0;

  constructor(
    private route: ActivatedRoute,
    private teamSvc: TeamService,
    private authSvc: AuthService
  ) {}

  ngOnInit(): void {
    // wait for both route AND userId
    this.route.params.subscribe((p) => {
      this.teamId = p['teamId'];

      this.authSvc.currentUserId$.subscribe((id) => {
        this.currentUserId = id ?? '';
        if (this.teamId) this.loadMembers();
      });
    });
  }

  loadMembers(): void {
    if (!this.teamId) return;

    this.teamSvc.getMembers(this.teamId).subscribe(async (members) => {
      const enriched = await Promise.all(
        members.map(async (m: any) => {
          try {
            const stats = await this.teamSvc
              .getMemberStats(this.teamId!, m.userId._id)
              .toPromise();
            return { ...m, stats };
          } catch {
            return { ...m, stats: null };
          }
        })
      );

      this.members = enriched;
      const me = enriched.find((m) => m.userId._id === this.currentUserId);
      this.isAdmin = me?.role === 'admin';
    });
  }

  changeRole(memberId: string, newRole: string): void {
    if (!this.teamId) return;
    this.teamSvc.updateRole(this.teamId, memberId, newRole).subscribe(() => {
      this.toast(`Role set to ${newRole}`, 'is-success');
      this.loadMembers();
    });
  }

  openKickModal(id: string) {
    this.confirmKickId = id;
  }
  closeKickModal() {
    this.confirmKickId = null;
  }
  confirmKick() {
    if (!this.teamId || !this.confirmKickId) return;
    const targetId = this.confirmKickId;
    this.closeKickModal();
    this.teamSvc.removeMember(this.teamId, targetId).subscribe(() => {
      this.toast('Member removed', 'is-danger');
      this.loadMembers();
    });
  }

  private toast(message: string, type: Toast['type'] = 'is-success') {
    const id = ++this.toastSeq;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    }, 3000);
  }

  get memberCount() {
    return this.members.length;
  }
  bulkPromote(): void {
    const selected = this.members.filter(
      (m) => m.selected && m.role !== 'admin'
    );
    selected.forEach((m) => {
      const next = this.getHigherRole(m.role);
      if (next) {
        this.teamSvc
          .updateRole(this.teamId!, m.userId._id, next)
          .subscribe(() => {
            this.toast(
              `Promoted ${m.userId.name || m.userId.email}`,
              'is-success'
            );
            this.loadMembers();
          });
      }
    });
  }

  bulkDemote(): void {
    const selected = this.members.filter(
      (m) => m.selected && m.role !== 'viewer'
    );
    selected.forEach((m) => {
      const next = this.getLowerRole(m.role);
      if (next) {
        this.teamSvc
          .updateRole(this.teamId!, m.userId._id, next)
          .subscribe(() => {
            this.toast(
              `Demoted ${m.userId.name || m.userId.email}`,
              'is-warning'
            );
            this.loadMembers();
          });
      }
    });
  }

  bulkKick(): void {
    const selected = this.members.filter((m) => m.selected);
    selected.forEach((m) => {
      this.teamSvc.removeMember(this.teamId!, m.userId._id).subscribe(() => {
        this.toast(`Removed ${m.userId.name || m.userId.email}`, 'is-danger');
        this.loadMembers();
      });
    });
  }

  toggleAllSelections(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.members.forEach((m) => {
      if (m.userId._id !== this.currentUserId) {
        m.selected = checked;
      }
    });
  }

  // Add these methods for template promote/demote buttons
  getHigherRole(role: string): string {
    const roles = ['viewer', 'editor', 'admin'];
    const idx = roles.indexOf(role);
    return idx < roles.length - 1 ? roles[idx + 1] : role;
  }
  getLowerRole(role: string): string {
    const roles = ['viewer', 'editor', 'admin'];
    const idx = roles.indexOf(role);
    return idx > 0 ? roles[idx - 1] : role;
  }

  /** How many non‑self members can be selected */
  get selectableCount(): number {
    return this.members.filter((m) => m.userId._id !== this.currentUserId)
      .length;
  }

  /** Members currently checked */
  get selectedCount(): number {
    return this.members.filter((m) => m.selected).length;
  }

  /** Convenience: are we admin & have at least one selected */
  get hasSelection(): boolean {
    return this.isAdmin && this.selectedCount > 0;
  }
}
