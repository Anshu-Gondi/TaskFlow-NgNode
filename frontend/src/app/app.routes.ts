import { Routes } from '@angular/router';
import { TaskViewComponent } from './pages/task-view/task-view.component';
import { NewListComponent } from './pages/new-list/new-list.component';
import { NewTaskComponent } from './pages/new-task/new-task.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { SignupPageComponent } from './pages/signup-page/signup-page.component';
import { EditListComponent } from './pages/edit-list/edit-list.component';
import { EditTaskComponent } from './pages/edit-task/edit-task.component';
import { AiSchedulerComponent } from './pages/ai-scheduler/ai-scheduler.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  /* ───── Authentication ───── */
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },

  /* ───── Solo Workspace Routes (mapped to /lists backend) ───── */
  { path: 'workspace/solo', component: TaskViewComponent },
  { path: 'workspace/solo/lists/:listId', component: TaskViewComponent },
  { path: 'workspace/solo/new-list', component: NewListComponent },
  { path: 'workspace/solo/lists/:listId/edit', component: EditListComponent },
  {
    path: 'workspace/solo/lists/:listId/new-task',
    component: NewTaskComponent,
  },
  {
    path: 'workspace/solo/lists/:listId/tasks/:taskId/edit',
    component: EditTaskComponent,
  },
  {
    path: 'workspace/solo/lists/:listId/ai-scheduler',
    component: AiSchedulerComponent,
  },

  /* ───── Team Workspace Routes (still mapped to /teams/:teamId/lists) ───── */
  { path: 'workspace/team/:teamId', component: TaskViewComponent },
  { path: 'workspace/team/:teamId/lists/:listId', component: TaskViewComponent },
  { path: 'workspace/team/:teamId/new-list', component: NewListComponent },
  {
    path: 'workspace/team/:teamId/lists/:listId/edit',
    component: EditListComponent,
  },
  {
    path: 'workspace/team/:teamId/lists/:listId/new-task',
    component: NewTaskComponent,
  },
  {
    path: 'workspace/team/:teamId/lists/:listId/tasks/:taskId/edit',
    component: EditTaskComponent,
  },
  {
    path: 'workspace/team/:teamId/lists/:listId/ai-scheduler',
    component: AiSchedulerComponent,
  },

  /* ───── Team Hub ───── */
  {
    path: 'teams',
    loadComponent: () =>
      import('./pages/team-hub/team-hub.component').then(
        (m) => m.TeamHubComponent
      ),
  },

  /* ───── Workspace Selector ───── */
  {
    path: 'choose-workspace',
    loadComponent: () =>
      import('./pages/workspace-selector/workspace-selector.component').then(
        (m) => m.WorkspaceSelectorComponent
      ),
  },

  /* ───── Fallback ───── */
  { path: '**', redirectTo: 'login' },
];
