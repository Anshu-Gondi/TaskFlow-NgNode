import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EditTaskComponent } from './edit-task.component';
import { TaskService } from '../../task.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Task } from '../../models/task.model';

describe('EditTaskComponent', () => {
  let component: EditTaskComponent;
  let fixture: ComponentFixture<EditTaskComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'getTask',
      'updateTask',
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: new Map([
          ['listId', '123'],
          ['taskId', '456'],
        ]),
      },
    };

    await TestBed.configureTestingModule({
      imports: [EditTaskComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize listId and taskId from route parameters', () => {
    expect(component.listId).toBe('123');
    expect(component.taskId).toBe('456');
  });

  it('should show an alert if task title is empty', () => {
    spyOn(window, 'alert');
    component.updateTask('');
    expect(window.alert).toHaveBeenCalledWith('Task title cannot be empty.');
    expect(mockTaskService.updateTask).not.toHaveBeenCalled(); // ✅ This should be added
  });

  it('should update the task and navigate back to the list', fakeAsync(() => {
    const mockUpdatedTask: Task = {
      _id: '456',
      title: 'Updated Task',
      _listId: '123', // Include _listId
      completed: false, // Include completed
    };
    mockTaskService.updateTask.and.returnValue(of(mockUpdatedTask));

    component.updateTask('Updated Task');
    tick(); // Ensure async code completes

    expect(mockTaskService.updateTask).toHaveBeenCalledWith(
      '123',
      '456',
      'Updated Task'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/lists', '123']);
  }));

  it('should handle error when updating task fails', fakeAsync(() => {
    spyOn(window, 'alert');
    mockTaskService.updateTask.and.returnValue(
      throwError(() => new Error('Update failed'))
    );

    component.updateTask('New Title');
    tick(); // Ensure async code completes

    expect(window.alert).toHaveBeenCalledWith(
      'Failed to update the task. Please try again.'
    );
  }));

  it('should alert if listId or taskId is missing from the route parameters', fakeAsync(() => {
    mockActivatedRoute.snapshot.paramMap = new Map(); // Simulate missing parameters
    fixture.detectChanges();

    spyOn(window, 'alert');
    component.ngOnInit(); // Manually trigger ngOnInit

    expect(window.alert).toHaveBeenCalledWith(
      'Invalid request: Missing List ID or Task ID.'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/lists']);
  }));
});
