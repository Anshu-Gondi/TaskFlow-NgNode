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
  /* ───────── DATA ───────── */
  lists: List[] = [];
  tasks: Task[] = [];

  listId: string | null = null;
  teamId: string | null = null;

  /* ───────── UI STATE ───────── */
  public sidebarOpen = false; // burger / drawer
  selectedList: List | null = null;

  public filterPriority = ''; // '', '0', '1', '2', '3'
  public sortOption: 'due' | 'priority' | 'created' = 'due';

  constructor(
    private taskSvc: TaskService,
    private teamSvc: TeamService,
    public authSvc: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  /* ───────── LIFECYCLE ───────── */
  ngOnInit(): void {
    this.route.params.subscribe((p: Params) => {
      this.teamId = p['teamId'] ?? null;
      this.listId = p['listId'] ?? null;

      this.loadLists();
      this.listId ? this.loadTasks(this.listId) : (this.tasks = []);
    });
  }

  /* ───────── LISTS ───────── */
  private loadLists(): void {
    const src$ = this.teamId
      ? this.taskSvc.getTeamLists(this.teamId)
      : this.taskSvc.getSoloLists();

    src$.subscribe({
      next: (lists) => {
        this.lists = lists;
        this.selectedList = lists.find((l) => l._id === this.listId) || null;
      },
      error: (err) => this.error('Error fetching lists', err),
    });
  }

  onListClick(list: List): void {
    this.sidebarOpen = false; // close drawer on mobile
    this.selectedList = list;
    this.router.navigate(this.getListLink(list._id));
  }

  public onCreateListClick(): void {
    this.router.navigate(this.getNewListLink());
    this.sidebarOpen = false;
  }

  public onEditListClick(list: List): void {
    this.router.navigate(this.linkToEditList(list._id));
  }

  public onDeleteListClick(list: List): void {
    this.deleteList(list._id);
  }

  private deleteList(listId: string): void {
    if (!confirm('Delete this list and all its tasks?')) {
      return;
    }

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

  /* ───────── TASKS ───────── */
  private loadTasks(listId: string): void {
    const src$ = this.teamId
      ? this.taskSvc.getTeamTasks(this.teamId!, listId)
      : this.taskSvc.getSoloTasks(listId);

    src$.subscribe({
      next: (tasks) => (this.tasks = tasks),
      error: (err) => this.error('Error fetching tasks', err),
    });
  }

  public onCreateTaskClick(): void {
    if (!this.listId) {
      return;
    }
    this.router.navigate(this.getNewTaskLink());
  }

  onTaskClick(t: Task): void {
    this.taskSvc.complete(t).subscribe(() => (t.completed = !t.completed));
  }

  public onEditTaskClick(t: Task): void {
    this.router.navigate(this.linkToTaskEdit(t._listId, t._id));
  }

  public onDeleteTaskClick(t: Task): void {
    this.deleteTask(t._id);
  }

  private deleteTask(taskId: string): void {
    if (!this.listId) {
      return;
    }
    if (!confirm('Delete this task?')) {
      return;
    }

    const src$ = this.teamId
      ? this.taskSvc.deleteTeamTask(this.teamId!, this.listId, taskId)
      : this.taskSvc.deleteSoloTask(this.listId, taskId);

    src$.subscribe({
      next: () => (this.tasks = this.tasks.filter((t) => t._id !== taskId)),
      error: (e) => this.error('Failed to delete task', e),
    });
  }

  /* ───────── AI Scheduler ───────── */
  goToAIScheduler(): void {
    if (this.listId) {
      this.router.navigate(this.getAiSchedulerLink());
      this.sidebarOpen = false;
    }
  }

  /* ───────── SORT / FILTER ───────── */
  public onSortChange(): void {
    // Triggered by <select>; no extra work needed because filteredTasks is a getter
  }

  sortAsc = true; // (kept for possible arrow toggle use)

  get filteredTasks(): Task[] {
    let out = [...this.tasks];

    /* Filter by priority */
    if (this.filterPriority !== '') {
      out = out.filter((t) => String(t.priority) === this.filterPriority);
    }

    /* Sort by sortOrder if present */
    if (out.length && out.some(t => typeof (t as any).sortOrder === 'number')) {
      out.sort((a, b) => ((a as any).sortOrder ?? 0) - ((b as any).sortOrder ?? 0));
      return out;
    }

    /* Sort */
    switch (this.sortOption) {
      case 'priority':
        out.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
        break;
      case 'created':
        out.sort((a, b) => {
          const aDate = (a as any).createdAt
            ? new Date((a as any).createdAt).getTime()
            : 0;
          const bDate = (b as any).createdAt
            ? new Date((b as any).createdAt).getTime()
            : 0;
          return bDate - aDate; // newest first
        });
        break;
      default: // 'due'
        out.sort((a, b) => {
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return aDue - bDue;
        });
    }
    return out;
  }

  goToMembersPage(): void {
    if (this.teamId) {
      this.router.navigate(['/workspace', 'team', this.teamId, 'members']);
    }
  }

  /* ───────── ROUTE HELPERS ───────── */
  private base(): string[] {
    return this.teamId
      ? ['/workspace', 'team', this.teamId]
      : ['/workspace', 'solo'];
  }
  getListLink(listId: string): string[] {
    return [...this.base(), 'lists', listId];
  }
  getNewListLink(): string[] {
    return [...this.base(), 'new-list'];
  }
  linkToEditList(listId: string): string[] {
    return [...this.base(), 'lists', listId, 'edit'];
  }
  getAiSchedulerLink(): string[] {
    return [...this.base(), 'lists', this.listId!, 'ai-scheduler'];
  }
  getNewTaskLink(): string[] {
    return [...this.base(), 'lists', this.listId!, 'new-task'];
  }
  linkToTaskEdit(listId: string, taskId: string): string[] {
    return [...this.base(), 'lists', listId, 'tasks', taskId, 'edit'];
  }

  /* ───────── UTILS ───────── */
  priorityLabel(p: number): string {
    return ['🟢 Low', '⏳ Medium', '⚠️ High', '🔥 Urgent'][p] ?? '–';
  }
  priorityClass(p: number): string {
    return (
      ['is-success', 'is-info', 'is-warning', 'is-danger'][p] ?? 'is-light'
    );
  }
  isOverdue(dateStr: string | undefined | null): boolean {
    if (!dateStr) {
      return false;
    }
    const now = new Date();
    const due = new Date(dateStr);
    return due < now && now.toDateString() !== due.toDateString();
  }

  private error(msg: string, err: any): void {
    console.error(msg, err);
    alert(msg);
  }

  /* ───────── WORKSPACE SWITCH ───────── */
  switchWorkspace(): void {
    localStorage.removeItem('lastWorkspace');
    this.router.navigate(['/choose-workspace']);
  }
}