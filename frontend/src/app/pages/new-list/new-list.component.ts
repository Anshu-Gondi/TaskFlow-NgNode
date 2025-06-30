import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params, RouterLink } from '@angular/router';
import { TaskService } from '../../task.service';
import { List } from '../../models/list.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-list',
  standalone: true,
  templateUrl: './new-list.component.html',
  styleUrls: ['./new-list.component.scss'],
  imports: [CommonModule, RouterLink],
})
export class NewListComponent implements OnInit {
  workspaceType: 'solo' | 'team' = 'solo';
  teamId: string | null = null;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe(segments => {
      this.workspaceType = segments[1]?.path === 'team' ? 'team' : 'solo';
    });

    this.route.params.subscribe((params: Params) => {
      this.teamId = params['teamId'] ?? null;
    });
  }

  createList(title: string): void {
    if (!title.trim()) {
      alert('List title cannot be empty.');
      return;
    }

    const onSuccess = (res: List) =>
      this.router.navigate([...this.baseRoute(), 'lists', res._id]);

    const req$ = this.workspaceType === 'team' && this.teamId
      ? this.taskService.createTeamList(this.teamId, title)
      : this.taskService.createSoloList(title);

    req$.subscribe({
      next: onSuccess,
      error: (e) => {
        console.error('List creation failed:', e);
        alert('Failed to create list.');
      }
    });
  }

  baseRoute(): string[] {
    return this.workspaceType === 'team' && this.teamId
      ? ['/workspace', 'team', this.teamId]
      : ['/workspace', 'solo'];
  }
}
