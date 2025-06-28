import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewTaskComponent } from './new-task.component';
import { TaskService } from '../../task.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing'; // Import from @angular/router/testing
import { of } from 'rxjs';

// Mock TaskService
class MockTaskService {
  createTasks = jasmine.createSpy('createTasks').and.returnValue(of({})); // Mocked response for create task
}

describe('NewTaskComponent', () => {
  let component: NewTaskComponent;
  let fixture: ComponentFixture<NewTaskComponent>;
  let mockTaskService: MockTaskService;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockTaskService = new MockTaskService();
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, NewTaskComponent], // Import RouterTestingModule from @angular/router/testing
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        {
          provide: ActivatedRoute,
          useValue: { params: of({ listId: '123' }) },
        },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize listId from route params', () => {
    expect(component.listId).toBe('123');
  });

  it('should call createTask with correct title', () => {
    const taskTitleInput = fixture.nativeElement.querySelector('input');
    const createButton = fixture.nativeElement.querySelector(
      'button.button.is-link'
    );

    taskTitleInput.value = 'Test Task';
    createButton.click();

    expect(mockTaskService.createTasks).toHaveBeenCalledWith(
      { title: 'Test Task', priority: 0, dueDate: null },
      '123'
    );
  });

  it('should navigate to parent route on successful task creation', () => {
    const taskTitleInput = fixture.nativeElement.querySelector('input');
    const createButton = fixture.nativeElement.querySelector(
      'button.button.is-link'
    );

    taskTitleInput.value = 'Test Task';
    createButton.click();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['../'], {
      relativeTo: component['route'],
    }); // Access private route using `component['route']`
  });

  it('should alert when task title is empty', () => {
    spyOn(window, 'alert'); // Spy on alert function
    const taskTitleInput = fixture.nativeElement.querySelector('input');
    const createButton = fixture.nativeElement.querySelector(
      'button.button.is-link'
    );

    taskTitleInput.value = ''; // Empty task title
    createButton.click();

    expect(window.alert).toHaveBeenCalledWith('Task title cannot be empty.');
  });

  it('should cancel and navigate to lists when cancel button is clicked', () => {
    spyOn(component, 'cancel').and.callThrough(); // Spy on cancel method
    const cancelButton = fixture.nativeElement.querySelector('button.button');
    cancelButton.click();
    expect(component.cancel).toHaveBeenCalled(); // Ensure cancel() is called
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/lists']); // Ensure navigation happens
  });
});
