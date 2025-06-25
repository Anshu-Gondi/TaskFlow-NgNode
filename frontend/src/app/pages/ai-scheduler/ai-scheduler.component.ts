import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../task.service';
import { Task } from '../../models/task.model';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ai-scheduler',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ai-scheduler.component.html',
  styleUrls: ['./ai-scheduler.component.scss'],
})
export class AiSchedulerComponent implements OnInit {
  schedule: Task[] = [];
  listId!: string;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.listId = this.route.snapshot.paramMap.get('listId')!;
  }

  generateSchedule(): void {
    if (!this.listId) {
      alert('No list selected for scheduling.');
      return;
    }

    this.taskService.getTasks(this.listId).subscribe({
      next: (tasks: Task[]) => {
        // Filter out tasks with no dueDate (optional)
        const tasksWithDates = tasks.filter(t => t.dueDate);

        // Sort by dueDate ascending (soonest first)
        this.schedule = tasksWithDates.sort((a, b) => {
          return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
        });
      },
      error: (error) => {
        console.error('AI scheduling failed:', error);
        alert('Failed to generate schedule. Please try again.');
      },
    });
  }
}
