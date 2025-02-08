import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { EditListComponent } from './edit-list.component';
import { TaskService } from '../../task.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { List } from '../../models/list.model';

describe('EditListComponent', () => {
  let component: EditListComponent;
  let fixture: ComponentFixture<EditListComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', [
      'getLists',
      'updateList',
    ]);

    mockTaskService.getLists.and.returnValue(of([]));

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      params: of({ listId: '123' }),
    };

    await TestBed.configureTestingModule({
      imports: [EditListComponent],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch the list title on init', fakeAsync(() => {
    const mockLists: List[] = [{ _id: '123', title: 'Test List' }];

    mockTaskService.getLists.and.returnValue(of(mockLists));

    component.ngOnInit(); // Manually trigger ngOnInit
    tick(); // Wait for async code to complete

    expect(component.originalTitle).toBe('Test List');
  }));

  it('should show an alert if list title is empty', () => {
    spyOn(window, 'alert');
    component.updateList('');
    expect(window.alert).toHaveBeenCalledWith('List title cannot be empty.');

    expect(mockTaskService.updateList).not.toHaveBeenCalled(); // ✅ This should be added
  });

  it('should update the list and navigate to updated list page', fakeAsync(() => {
    const mockUpdatedList: List = { _id: '123', title: 'Updated List' };
    mockTaskService.updateList.and.returnValue(of(mockUpdatedList));

    component.updateList('Updated List');
    tick(); // Ensure async code completes

    expect(mockTaskService.updateList).toHaveBeenCalledWith(
      '123',
      'Updated List'
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/lists', '123']);
  }));

  it('should handle error when updating list fails', fakeAsync(() => {
    spyOn(window, 'alert');
    mockTaskService.updateList.and.returnValue(
      throwError(() => new Error('Update failed'))
    );

    component.updateList('New Title');
    tick(); // Ensure async code completes

    expect(window.alert).toHaveBeenCalledWith(
      'Failed to update list. Check console for details.'
    );
  }));
});
