import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { TaskService } from '../../task.service';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-scheduler',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ai-scheduler.component.html',
  styleUrls: ['./ai-scheduler.component.scss'],
})
export class AiSchedulerComponent implements OnInit {
  workspaceType: 'solo' | 'team' = 'solo';
  teamId: string | null = null;
  listId!: string;

  schedule: Task[] = [];
  loading = false;

  constructor(
    private taskSvc: TaskService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe(segs => {
      this.workspaceType = segs[1]?.path === 'team' ? 'team' : 'solo';
    });

    this.route.params.subscribe((p: Params) => {
      this.teamId = p['teamId'] ?? null;
      this.listId = p['listId'];
    });
  }

  generateSchedule(): void {
    if (!this.listId) {
      alert('No listId found in route.');
      return;
    }

    this.loading = true;
    this.schedule = [];

    this.taskSvc
      .getAiSchedule(this.listId, this.workspaceType === 'team', this.teamId ?? undefined)
      .subscribe({
        next: (result: Task[]) => {
          this.schedule = result;
          this.loading = false;
        },
        error: (err: any) => {
          console.error('AI scheduling failed:', err);
          alert('Failed to generate schedule.');
          this.loading = false;
        },
      });
  }

  priorityLabel(pr: number | undefined): string {
    const map = ['Low', 'Medium', 'High', 'Urgent'];
    return map[pr ?? 0] ?? 'Unknown';
  }

  priorityClass(pr: number | undefined): string {
    const map = ['is-success', 'is-info', 'is-warning', 'is-danger'];
    return map[pr ?? 0] ?? 'is-light';
  }
}
