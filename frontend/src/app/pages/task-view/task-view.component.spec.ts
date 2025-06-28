import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { TaskViewComponent } from './task-view.component';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Task } from '../../models/task.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideRouter } from '@angular/router';

// Create mock services
class MockTaskService {
  getLists = jasmine.createSpy('getLists').and.returnValue(of([]));
  getTasks = jasmine.createSpy('getTasks').and.returnValue(of([]));
  complete = jasmine.createSpy('complete').and.returnValue(of(null));
  deleteList = jasmine.createSpy('deleteList').and.returnValue(of(null));
  deleteTask = jasmine.createSpy('deleteTask').and.returnValue(of(null));
}

describe('TaskViewComponent', () => {
  let component: TaskViewComponent;
  let fixture: ComponentFixture<TaskViewComponent>;
  let mockTaskService: MockTaskService;
  let mockRouter: any;

  beforeEach(async () => {
    mockTaskService = new MockTaskService();
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        TaskViewComponent,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: ActivatedRoute, useValue: { params: of({ listId: null }) } },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch lists on init', () => {
    expect(mockTaskService.getLists).toHaveBeenCalled();
  });

  it('should not fetch tasks if listId is null', () => {
    expect(mockTaskService.getTasks).not.toHaveBeenCalled();
  });

  it('should delete the list and tasks on confirm delete', () => {
    const listId = '123';
    component.listId = listId;
    component.lists = [{ _id: listId, title: 'Test List' }];

    spyOn(window, 'confirm').and.returnValue(true);
    mockTaskService.deleteList.and.returnValue(of(null));

    component.onDeleteListClick();

    expect(mockTaskService.deleteList).toHaveBeenCalledWith(listId);
    expect(component.lists.length).toBe(0);
    expect(component.listId).toBeNull();
    expect(component.tasks.length).toBe(0);
  });

  it('should delete a task when givem() is called', () => {
    const taskId = '456';
    const listId = '123';

    const task: Task = {
      _id: taskId,
      _listId: listId,
      title: 'Test Task',
      completed: false,
    };

    component.listId = listId; // ✅ Ensure listId is defined
    component.tasks = [task];

    spyOn(window, 'confirm').and.returnValue(true);
    mockTaskService.deleteTask.and.returnValue(of(null));

    component.givem(taskId);

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith(listId, taskId);
    expect(component.tasks.length).toBe(0);
  });

  it('should navigate to task edit page when onTaskEditClick() is called', () => {
    const task: Task = {
      _id: '789',
      _listId: '123',
      title: 'Test Task',
      completed: false,
    };

    component.onTaskEditClick(task);

    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/lists/123/tasks/789/edit',
    ]);
  });

  it('should toggle task completion status when onTaskClick is called', () => {
    const task: Task = {
      _id: '123',
      _listId: '321',
      title: 'Test Task',
      completed: false,
    };

    component.onTaskClick(task);

    expect(mockTaskService.complete).toHaveBeenCalledWith(task);
    expect(task.completed).toBeTrue();
  });

  it('should alert when trying to delete list with no listId', () => {
    component.listId = null;
    spyOn(window, 'alert');
    component.onDeleteListClick();
    expect(window.alert).toHaveBeenCalledWith('No list selected to delete.');
  });

  it('should alert when trying to delete task with no taskId', () => {
    spyOn(window, 'alert');
    component.givem('');
    expect(window.alert).toHaveBeenCalledWith(
      'Task ID is required to delete the task.'
    );
  });

  it('should call handleError and alert on list fetch failure', () => {
    const error = new Error('Failed to fetch lists');
    mockTaskService.getLists = jasmine.createSpy().and.returnValue({
      subscribe: (success: any, errorCb: any) => errorCb(error),
    });
    spyOn(window, 'alert');
    spyOn(console, 'error');

    component.fetchLists();

    expect(console.error).toHaveBeenCalledWith('Error fetching lists', error);
    expect(window.alert).toHaveBeenCalledWith('Error fetching lists');
  });

  it('should not navigate if task._id or task._listId is missing', () => {
    const invalidTask: Task = {
      _id: '',
      _listId: '',
      title: 'Broken Task',
      completed: false,
    };
    spyOn(console, 'error');

    component.onTaskEditClick(invalidTask);

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Task ID or List ID is missing');
  });

  it('should call handleError and alert on task fetch failure', () => {
    const error = new Error('Failed to fetch tasks');
    mockTaskService.getTasks = jasmine.createSpy().and.returnValue({
      subscribe: (success: any, errorCb: any) => errorCb(error),
    });
    spyOn(window, 'alert');
    spyOn(console, 'error');

    component.fetchTasks('abc123');

    expect(console.error).toHaveBeenCalledWith('Error fetching tasks', error);
    expect(window.alert).toHaveBeenCalledWith('Error fetching tasks');
  });

  it('should clear tasks if listId is not provided in route params', () => {
    component.tasks = [
      { _id: '1', _listId: 'abc', title: 'Temp', completed: false },
    ];
    component.ngOnInit(); // manually trigger, although already run in fixture.detectChanges()
    expect(component.tasks).toEqual([]);
  });

  it('should toggle task completion from true to false', () => {
    const task: Task = {
      _id: '1',
      _listId: '2',
      title: 'Done',
      completed: true,
    };
    component.onTaskClick(task);
    expect(task.completed).toBeFalse();
  });

  it('should not call deleteTask if taskId is missing', () => {
    spyOn(window, 'alert');
    component.givem('');
    expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
  });

  it('should not call deleteTask if listId is missing', () => {
    spyOn(window, 'alert');
    component.listId = null;
    component.givem('456');
    expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Task ID is required to delete the task.'
    );
  });
});

// ✅ Separate describe to test listId routing param logic
describe('TaskViewComponent (with listId)', () => {
  let fixture: ComponentFixture<TaskViewComponent>;
  let component: TaskViewComponent;
  let mockTaskService: jasmine.SpyObj<TaskService>;

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'getLists',
      'getTasks',
      'complete',
      'deleteList',
      'deleteTask',
    ]);

    // Must return Observables *before* component instantiation
    mockTaskService.getLists.and.returnValue(of([]));
    mockTaskService.getTasks.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        TaskViewComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        {
          // Simulate route with listId
          provide: ActivatedRoute,
          useValue: { params: of({ listId: 'abc123' }) },
        },
        // No manual Router provider needed when using RouterTestingModule
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // runs ngOnInit()
  });

  it('should fetch tasks when listId is present in route params', () => {
    expect(mockTaskService.getTasks).toHaveBeenCalledWith('abc123');
  });
});
