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
  applying = false;
  applySuccess = false;

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
    this.applySuccess = false;

    this.taskSvc
      .getAiSchedule(this.listId, this.workspaceType === 'team', this.teamId ?? undefined)
      .subscribe(
        (result: Task[]) => {
          this.schedule = result;
          this.loading = false;
        },
        (err: any) => {
          console.error('AI scheduling failed:', err);
          alert('Failed to generate schedule.');
          this.loading = false;
        }
      );
  }

  applySchedule(): void {
    if (!this.schedule.length) return;
    this.applying = true;
    this.applySuccess = false;

    // For each task, update its sortOrder (or a custom field)
    // We'll use the index in the schedule as the new order
    const updates = this.schedule.map((task, idx) => {
      // Add/Update a sortOrder property
      return this.taskSvc.updateTaskOrder(
        task,
        idx
      );
    });

    // Wait for all updates to finish
    Promise.all(updates.map(obs => obs.toPromise()))
      .then(() => {
        this.applying = false;
        this.applySuccess = true;
      })
      .catch(() => {
        this.applying = false;
        alert('Failed to apply new order.');
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
