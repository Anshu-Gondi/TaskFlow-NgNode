import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskViewComponent } from './task-view.component';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Task } from '../../models/task.model';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

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
        HttpClientTestingModule, // Import HttpClientTestingModule for HTTP-related tests
        RouterTestingModule, // Import RouterTestingModule to handle routing in tests
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

    // Spy on confirm to simulate user confirming the delete
    spyOn(window, 'confirm').and.returnValue(true);

    mockTaskService.deleteList.and.returnValue(of(null));

    component.onDeleteListClick();

    expect(mockTaskService.deleteList).toHaveBeenCalledWith(listId);
    expect(component.lists.length).toBe(0); // List should be removed
    expect(component.listId).toBeNull(); // ListId should be reset
    expect(component.tasks.length).toBe(0); // Tasks should be cleared
  });

  it('should delete a task when givem() is called', () => {
    const taskId = '456';
    const task: Task = {
      _id: taskId,
      _listId: '123',
      title: 'Test Task',
      completed: false,
    }; // Updated mock task
    component.tasks = [task];

    spyOn(window, 'confirm').and.returnValue(true);
    mockTaskService.deleteTask.and.returnValue(of(null));

    component.givem(taskId);

    expect(mockTaskService.deleteTask).toHaveBeenCalledWith(
      component.listId,
      taskId
    );
    expect(component.tasks.length).toBe(0); // Task should be removed
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
});
