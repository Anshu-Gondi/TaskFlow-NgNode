import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Params, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { List } from '../../models/list.model';
import { Task } from '../../models/task.model';
import { of } from 'rxjs';

@Component({
  selector: 'app-task-view',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss'],
})
export class TaskViewComponent implements OnInit {
  lists: List[] = [];
  tasks: Task[] = [];
  listId: string | null = null;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.listId = params['listId'] || null;
      this.listId ? this.fetchTasks(this.listId) : (this.tasks = []);
    });
    this.fetchLists();
  }

  fetchLists(): void {
    this.taskService.getLists().subscribe(
      (lists: List[]) => (this.lists = lists),
      (error) => this.handleError(error, 'Error fetching lists')
    );
  }

  fetchTasks(listId: string): void {
    this.taskService.getTasks(listId).subscribe(
      (tasks: Task[]) => (this.tasks = tasks),
      (error) => this.handleError(error, 'Error fetching tasks')
    );
  }

  onTaskClick(task: Task): void {
    this.taskService.complete(task).subscribe(() => (task.completed = !task.completed));
  }

  onDeleteListClick(): void {
    if (!this.listId) return alert('No list selected to delete.');

    if (confirm('Are you sure you want to delete this list and all its tasks?')) {
      this.taskService.deleteList(this.listId).subscribe(
        () => {
          this.lists = this.lists.filter((list) => list._id !== this.listId);
          this.listId = null;
          this.tasks = [];
          alert('List deleted successfully.');
          this.router.navigate(['/lists']);
        },
        (error) => this.handleError(error, 'Failed to delete the list')
      );
    }
  }

  givem(taskId: string): void {
    if (!taskId) return alert('Task ID is required to delete the task.');

    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(this.listId!, taskId).subscribe(
        () => {
          this.tasks = this.tasks.filter((task) => task._id !== taskId);
          alert('Task deleted successfully.');
        },
        (error) => this.handleError(error, 'Failed to delete the task')
      );
    }
  }

  onTaskEditClick(task: Task): void {
    if (!task._id || !task._listId) return console.error('Task ID or List ID is missing');
    this.router.navigate([`/lists/${task._listId}/tasks/${task._id}/edit`]);
  }

  private handleError(error: any, message: string): void {
    console.error(message, error);
    alert(message);
  }
}
