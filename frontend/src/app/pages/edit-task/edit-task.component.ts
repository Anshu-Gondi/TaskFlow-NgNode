import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.scss'],
})
export class EditTaskComponent implements OnInit {
  listId!: string; // Declare listId
  taskId!: string; // Declare taskId

  constructor(
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Extract listId and taskId from route parameters
    this.listId = this.route.snapshot.paramMap.get('listId')!;
    this.taskId = this.route.snapshot.paramMap.get('taskId')!;

    // Add checks to ensure they are retrieved successfully
    if (!this.listId || !this.taskId) {
      console.error('List ID or Task ID is missing from the route parameters.');
      alert('Invalid request: Missing List ID or Task ID.');
      this.router.navigate(['/lists']);
      return; // Exit early if missing parameters
    }
  }

  updateTask(title: string, priority: number, dueDate: string): void {
    if (!title.trim()) {
      alert('Task title cannot be empty.');
      return;
    }

    const updateData = {
      title,
      priority: isNaN(priority) ? 0 : priority,
      dueDate: dueDate || null,
    };

    this.taskService.updateTask(this.listId, this.taskId, updateData).subscribe(
      () => {
        alert('Task updated successfully.');
        this.router.navigate(['/lists', this.listId]);
      },
      (error) => {
        console.error('Error updating task:', error);
        alert('Failed to update the task. Please try again.');
      }
    );
  }
}
