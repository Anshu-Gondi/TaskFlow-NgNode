import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewListComponent } from './new-list.component';
import { TaskService } from '../../task.service';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { List } from '../../models/list.model';

describe('NewListComponent', () => {
  let component: NewListComponent;
  let fixture: ComponentFixture<NewListComponent>;
  let taskService: jasmine.SpyObj<TaskService>;
  let router: Router; // Note: Now we’re using the real Router from RouterTestingModule

  beforeEach(async () => {
    // Create a spy for TaskService
    const taskServiceSpy = jasmine.createSpyObj<TaskService>('TaskService', [
      'createList',
    ]);
    taskServiceSpy.createList.and.returnValue(
      of({ _id: '123', title: 'Test List' })
    );

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        NewListComponent,
      ],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        // **Do not override Router here** so that RouterTestingModule can supply a full instance.
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewListComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;

    // Inject the Router from RouterTestingModule and spy on navigate:
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not create a list if title is empty', () => {
    spyOn(window, 'alert');

    component.createList('');
    expect(window.alert).toHaveBeenCalledWith('List title cannot be empty.');
    expect(taskService.createList).not.toHaveBeenCalled();
  });

  it('should call taskService.createList and navigate on success', () => {
    const mockList: List = { _id: '123', title: 'Test List' };
    taskService.createList.and.returnValue(of(mockList)); // Ensure observable

    component.createList('Test List');
    fixture.detectChanges(); // Ensure Angular picks up changes

    expect(taskService.createList).toHaveBeenCalledWith('Test List');
    expect(router.navigate).toHaveBeenCalledWith(['/lists', '123']);
  });

  it('should handle errors and show an alert on failure', () => {
    spyOn(window, 'alert');
    taskService.createList.and.returnValue(
      throwError(() => new Error('API error'))
    );

    component.createList('Test List');

    expect(taskService.createList).toHaveBeenCalledWith('Test List');
    expect(window.alert).toHaveBeenCalledWith(
      'Failed to create list. Check console for details.'
    );
  });
});
