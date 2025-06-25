import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../task.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-new-task',
  imports: [RouterLink],
  templateUrl: './new-task.component.html',
  styleUrls: ['./new-task.component.scss'],
})
export class NewTaskComponent implements OnInit {
  listId!: string;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.listId = params['listId']; // Fetching listId from route params
      console.log(this.listId); // For debugging purposes
    });
  }

  createTask(title: string, priority: number, dueDate: string): void {
    if (!title.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    const taskData = {
      title,
      priority: isNaN(priority) ? 0 : priority,
      dueDate: dueDate || null,
    };

    this.taskService.createTasks(taskData, this.listId).subscribe({
      next: () => this.router.navigate(['../'], { relativeTo: this.route }),
      error: (error) => {
        console.error('Error creating task:', error);
        alert('Failed to create task. Check console for details.');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/lists']);
  }
}
