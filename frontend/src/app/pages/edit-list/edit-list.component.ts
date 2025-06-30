import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../task.service';
import { List } from '../../models/list.model';

@Component({
  selector: 'app-edit-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.scss'],
})
export class EditListComponent implements OnInit {
  workspaceType: 'solo' | 'team' = 'solo';
  teamId: string | null = null;
  listId!: string;
  originalTitle = '';

  constructor(
    private taskSvc: TaskService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.url.subscribe((segs) => {
      this.workspaceType = segs[1]?.path === 'team' ? 'team' : 'solo';
    });

    this.route.params.subscribe((p: Params) => {
      this.listId = p['listId'];
      this.teamId = p['teamId'] ?? null;

      const load$ =
        this.workspaceType === 'team' && this.teamId
          ? this.taskSvc.getTeamLists(this.teamId)
          : this.taskSvc.getSoloLists();

      load$.subscribe((lists) => {
        const l = lists.find((x) => x._id === this.listId);
        this.originalTitle = l?.title ?? '';
      });
    });
  }

  updateList(newTitle: string): void {
    if (!newTitle.trim()) {
      alert('List title cannot be empty.');
      return;
    }

    const done = (l: List) =>
      this.router.navigate([...this.baseRoute(), 'lists', l._id]);

    const save$ =
      this.workspaceType === 'team' && this.teamId
        ? this.taskSvc.updateTeamList(this.teamId, this.listId, {
            title: newTitle,
          })
        : this.taskSvc.updateSoloList(this.listId, { title: newTitle });

    save$.subscribe({
      next: done,
      error: (err) => {
        console.error('List update failed', err);
        alert('Failed to update list.');
      },
    });
  }

  baseRoute(): string[] {
    return this.workspaceType === 'team' && this.teamId
      ? ['/workspace', 'team', this.teamId]
      : ['/workspace', 'solo'];
  }
}
