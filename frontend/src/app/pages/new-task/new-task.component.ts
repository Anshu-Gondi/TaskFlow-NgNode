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

  constructor(private taskService: TaskService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.listId = params['listId']; // Fetching listId from route params
      console.log(this.listId); // For debugging purposes
    });
  }

  createTask(title: string): void {
    if (!title.trim()) {
      alert('Task title cannot be empty.'); // Alert if title is empty
      return;
    }

    // Creating a new task by passing the title and listId
    this.taskService.createTasks(title, this.listId).subscribe({
      next: (response: any) => {
        this.router.navigate(['../'], { relativeTo: this.route }); // Navigating to the parent route
      },
      error: (error: any) => {
        console.error('Error creating task:', error); // Logging error if task creation fails
        alert('Failed to create task. Check console for details.'); // Alerting the user
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/lists']);
  }
}
