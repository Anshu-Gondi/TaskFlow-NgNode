import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-task',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss'],
})
export class NewTaskComponent implements OnInit {
  workspaceType: 'solo' | 'team' = 'solo';
  teamId: string | null = null;
  listId!: string;

  constructor(
    private taskSvc: TaskService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe(segments => {
      this.workspaceType = segments[1]?.path === 'team' ? 'team' : 'solo';
    });

    this.route.params.subscribe((p: Params) => {
      this.teamId = p['teamId'] ?? null;
      this.listId = p['listId'];
    });
  }

  createTask(title: string, priorityLabel: string, dueDate: string): void {
    if (!title.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    const priority = { low: 0, medium: 1, high: 2, urgent: 3 }[priorityLabel] ?? 0;

    const data = { title, priority, dueDate: dueDate || null };

    const onDone = () =>
      this.router.navigate([...this.baseRoute(), 'lists', this.listId]);

    const save$ =
      this.workspaceType === 'team' && this.teamId
        ? this.taskSvc.addTeamTask(this.teamId, this.listId, data)
        : this.taskSvc.addSoloTask(this.listId, data);

    save$.subscribe({
      next: onDone,
      error: (e) => {
        console.error('Task creation failed:', e);
        alert('Failed to create task.');
      },
    });
  }

  cancel(): void {
    this.router.navigate([...this.baseRoute(), 'lists', this.listId]);
  }

  private baseRoute(): string[] {
    return this.workspaceType === 'team' && this.teamId
      ? ['/workspace', 'team', this.teamId]
      : ['/workspace', 'solo'];
  }
}
