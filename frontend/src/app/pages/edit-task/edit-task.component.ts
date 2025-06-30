import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../task.service';

// Optional: define proper types if available
interface TaskUpdatePayload {
  title: string;
  priority: number;
  dueDate: string | null;
}

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss'],
})
export class EditTaskComponent implements OnInit {
  workspaceType: 'solo' | 'team' = 'solo';
  teamId: string | null = null;
  listId!: string;
  taskId!: string;

  constructor(
    private taskSvc: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe(segs => {
      this.workspaceType = segs[1]?.path === 'team' ? 'team' : 'solo';
    });

    this.route.params.subscribe((p: Params) => {
      this.teamId = p['teamId'] ?? null;
      this.listId = p['listId'];
      this.taskId = p['taskId'];
    });
  }

  updateTask(title: string, priorityLabel: string, dueDate: string): void {
    if (!title.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    const priorityMap: Record<string, number> = {
      low: 0,
      medium: 1,
      high: 2,
      urgent: 3,
    };

    const update: TaskUpdatePayload = {
      title,
      priority: priorityMap[priorityLabel] ?? 0,
      dueDate: dueDate || null,
    };

    const done = () =>
      this.router.navigate(this.getListRoute());

    const save$ =
      this.workspaceType === 'team' && this.teamId
        ? this.taskSvc.updateTeamTask(this.teamId, this.listId, this.taskId, update)
        : this.taskSvc.updateSoloTask(this.listId, this.taskId, update);

    save$.subscribe({
      next: done,
      error: (err: any) => {
        console.error('Task update failed', err);
        alert('Failed to update the task.');
      }
    });
  }

  baseRoute(): string[] {
    return this.workspaceType === 'team' && this.teamId
      ? ['/workspace', 'team', this.teamId]
      : ['/workspace', 'solo'];
  }

  getListRoute(): string[] {
    const base = this.baseRoute();
    return base.concat(['lists', this.listId]);
  }
}
