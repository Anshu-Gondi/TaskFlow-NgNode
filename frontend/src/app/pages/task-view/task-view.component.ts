// src/app/pages/task-view/task-view.component.ts
import { Component, OnInit } from '@angular/core';
import {
  ActivatedRoute,
  Params,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../task.service';
import { List } from '../../models/list.model';
import { Task } from '../../models/task.model';

/* for team members */
import { TeamService } from '../../team-service.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss'],
})
export class TaskViewComponent implements OnInit {
  /* ───────── STATE ───────── */
  lists: List[] = [];
  tasks: Task[] = [];
  listId: string | null = null;
  teamId: string | null = null;

  /* ui helpers */
  filterPriority = '';
  sortAsc = true;

  /* NEW: Team member modal logic */
  teamMembers: any[] = [];
  isAdmin = false;
  membersOpen = false;

  constructor(
    private taskSvc: TaskService,
    private teamSvc: TeamService,   // ✅
    public authSvc: AuthService,    // ✅
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((p: Params) => {
      this.teamId = p['teamId'] ?? null;
      this.listId = p['listId'] ?? null;

      this.loadLists();
      if (this.listId) {
        this.loadTasks(this.listId);
      } else {
        this.tasks = [];
      }

      // ✅ load members if team view
      if (this.teamId) {
        this.loadMembers();
      }
    });
  }

  private loadLists() {
    const src$ = this.teamId
      ? this.taskSvc.getTeamLists(this.teamId)
      : this.taskSvc.getSoloLists();

    src$.subscribe(
      (lists) => (this.lists = lists),
      (err) => this.error('Error fetching lists', err)
    );
  }

  private loadTasks(listId: string) {
    const src$ = this.teamId
      ? this.taskSvc.getTeamTasks(this.teamId!, listId)
      : this.taskSvc.getSoloTasks(listId);

    src$.subscribe(
      (tasks) => (this.tasks = tasks),
      (err) => this.error('Error fetching tasks', err)
    );
  }

  /* TEAM MEMBER METHODS */
  loadMembers() {
    this.teamSvc.getMembers(this.teamId!).subscribe((members) => {
      this.teamMembers = members;
      const me = members.find((m: any) => m.userId._id === this.authSvc.currentUserId);
      this.isAdmin = me?.role === 'admin';
    });
  }

  toggleMembers() {
    this.membersOpen = !this.membersOpen;
  }

  changeRole(memberId: string, newRole: string) {
    this.teamSvc.updateRole(this.teamId!, memberId, newRole).subscribe(() => {
      this.loadMembers();
    });
  }

  kick(memberId: string) {
    if (!confirm('Remove member from team?')) return;
    this.teamSvc.removeMember(this.teamId!, memberId).subscribe(() => {
      this.loadMembers();
    });
  }

  onTaskClick(t: Task) {
    this.taskSvc.complete(t).subscribe(() => (t.completed = !t.completed));
  }

  linkToEditList(listId: string) {
    return [...this.base(), 'lists', listId, 'edit'];
  }

  deleteList(listId: string) {
    if (!confirm('Delete this list and all its tasks?')) return;

    const src$ = this.teamId
      ? this.taskSvc.deleteTeamList(this.teamId!, listId)
      : this.taskSvc.deleteSoloList(listId);

    src$.subscribe({
      next: () => {
        this.lists = this.lists.filter((l) => l._id !== listId);
        if (this.listId === listId) {
          this.router.navigate(this.base());
        }
      },
      error: (err) => this.error('Error deleting list', err),
    });
  }

  onTaskEditClick(t: Task) {
    this.router.navigate(this.linkToTaskEdit(t._listId, t._id));
  }

  deleteTask(taskId: string) {
    if (!this.listId) {
      return;
    }
    const src$ = this.teamId
      ? this.taskSvc.deleteTeamTask(this.teamId!, this.listId, taskId)
      : this.taskSvc.deleteSoloTask(this.listId, taskId);

    if (confirm('Delete this task?')) {
      src$.subscribe(
        () => (this.tasks = this.tasks.filter((t) => t._id !== taskId)),
        (e) => this.error('Failed to delete task', e)
      );
    }
  }

  switchWorkspace() {
    localStorage.removeItem('lastWorkspace');
    this.router.navigate(['/choose-workspace']);
  }

  private base(): string[] {
    return this.teamId
      ? ['/workspace', 'team', this.teamId]
      : ['/workspace', 'solo'];
  }

  getListLink(listId: string) {
    return [...this.base(), 'lists', listId];
  }
  getNewListLink() {
    return [...this.base(), 'new-list'];
  }
  getAiSchedulerLink() {
    return [...this.base(), 'lists', this.listId!, 'ai-scheduler'];
  }
  getNewTaskLink() {
    return [...this.base(), 'lists', this.listId!, 'new-task'];
  }
  linkToTaskEdit(listId: string, taskId: string) {
    return [...this.base(), 'lists', listId, 'tasks', taskId, 'edit'];
  }

  private error(msg: string, err: any) {
    console.error(msg, err);
    alert(msg);
  }

  priorityLabel(p: number) {
    return ['🟢 Low', '⏳ Medium', '⚠️ High', '🔥 Urgent'][p] ?? '–';
  }
  priorityClass(p: number) {
    return (
      ['is-success', 'is-info', 'is-warning', 'is-danger'][p] ?? 'is-light'
    );
  }

  get filteredTasks(): Task[] {
    let filtered = [...this.tasks];

    if (this.filterPriority !== '') {
      filtered = filtered.filter(
        (task) => String(task.priority) === this.filterPriority
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.dueDate || '';
      const dateB = b.dueDate || '';
      return this.sortAsc
        ? dateA.localeCompare(dateB)
        : dateB.localeCompare(dateA);
    });

    return filtered;
  }

  sortByDueDate(): void {
    this.sortAsc = !this.sortAsc;
  }

  isOverdue(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    const now = new Date();
    const due = new Date(dateStr);
    return due < now && now.toDateString() !== due.toDateString();
  }
}
