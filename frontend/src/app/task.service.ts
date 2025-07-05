// src/app/task.service.ts
import { Injectable } from '@angular/core';
import { WebRequestService } from './web-request.service';
import { Task } from './models/task.model';
import { List } from './models/list.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private req: WebRequestService) {}

  // ───────── Solo workspace ─────────
  getSoloLists(): Observable<List[]> {
    return this.req.get<List[]>('lists');
  }
  createSoloList(title: string): Observable<List> {
    return this.req.post<List>('lists', { title });
  }
  updateSoloList(listId: string, data: any): Observable<List> {
    return this.req.patch<List>(`lists/${listId}`, data);
  }
  deleteSoloList(listId: string): Observable<void> {
    return this.req.delete(`lists/${listId}`);
  }

  getSoloTasks(listId: string): Observable<Task[]> {
    return this.req.get<Task[]>(`lists/${listId}/tasks`);
  }
  addSoloTask(listId: string, task: any): Observable<Task> {
    return this.req.post<Task>(`lists/${listId}/tasks`, task);
  }
  updateSoloTask(listId: string, taskId: string, data: any): Observable<Task> {
    return this.req.patch<Task>(`lists/${listId}/tasks/${taskId}`, data);
  }
  deleteSoloTask(listId: string, taskId: string): Observable<void> {
    return this.req.delete(`lists/${listId}/tasks/${taskId}`);
  }

  // ───────── Team workspace ─────────
  getTeamLists(teamId: string): Observable<List[]> {
    return this.req.get<List[]>(`teams/${teamId}/lists`);
  }
  createTeamList(teamId: string, title: string): Observable<List> {
    return this.req.post<List>(`teams/${teamId}/lists`, { title });
  }
  updateTeamList(teamId: string, listId: string, data: any): Observable<List> {
    return this.req.patch<List>(`teams/${teamId}/lists/${listId}`, data);
  }
  deleteTeamList(teamId: string, listId: string): Observable<void> {
    return this.req.delete(`teams/${teamId}/lists/${listId}`);
  }

  getTeamTasks(teamId: string, listId: string): Observable<Task[]> {
    return this.req.get<Task[]>(`teams/${teamId}/lists/${listId}/tasks`);
  }
  addTeamTask(teamId: string, listId: string, task: any): Observable<Task> {
    return this.req.post<Task>(`teams/${teamId}/lists/${listId}/tasks`, task);
  }
  updateTeamTask(
    teamId: string,
    listId: string,
    taskId: string,
    data: any
  ): Observable<Task> {
    return this.req.patch<Task>(
      `teams/${teamId}/lists/${listId}/tasks/${taskId}`,
      data
    );
  }
  deleteTeamTask(
    teamId: string,
    listId: string,
    taskId: string
  ): Observable<void> {
    return this.req.delete(`teams/${teamId}/lists/${listId}/tasks/${taskId}`);
  }

  // toggle complete (solo vs team)
  complete(task: Task): Observable<any> {
    const path = task._teamId
      ? `teams/${task._teamId}/lists/${task._listId}/tasks/${task._id}`
      : `lists/${task._listId}/tasks/${task._id}`;
    return this.req.patch(path, { completed: !task.completed });
  }

  getAiSchedule(
    listId: string,
    isTeam: boolean,
    teamId?: string
  ): Observable<Task[]> {
    if (isTeam && teamId) {
      return this.req.get<{ scheduled: Task[] }>(
        `teams/${teamId}/lists/${listId}/ai-schedule`
      ).pipe(
        // Only return the scheduled array
        map(res => res.scheduled)
      );
    } else {
      return this.req.get<{ scheduled: Task[] }>(`lists/${listId}/ai-schedule`).pipe(
        map(res => res.scheduled)
      );
    }
  }

  // Add this method for AI Scheduler apply order
  updateTaskOrder(task: Task, sortOrder: number): Observable<Task> {
    if (task._teamId) {
      return this.updateTeamTask(
        task._teamId,
        task._listId,
        task._id,
        { sortOrder }
      );
    } else {
      return this.updateSoloTask(
        task._listId,
        task._id,
        { sortOrder }
      );
    }
  }
}
