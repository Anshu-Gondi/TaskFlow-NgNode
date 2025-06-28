import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiSchedulerComponent } from './ai-scheduler.component';
import { TaskService } from '../../task.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Task } from '../../models/task.model';
import { By } from '@angular/platform-browser';

describe('AiSchedulerComponent (full flow)', () => {
  let component: AiSchedulerComponent;
  let fixture: ComponentFixture<AiSchedulerComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;

  const dummyListId = 'test-list';
  const mockRoute = {
    snapshot: {
      paramMap: {
        get: () => dummyListId,
      },
    },
  };

  beforeEach(async () => {
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTasks']);

    await TestBed.configureTestingModule({
      imports: [AiSchedulerComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should fetch, filter, sort, and render schedule list', () => {
    const mockTasks: Task[] = [
      { _id: 'a', title: 'Clean Room', _listId: dummyListId, completed: false, priority: 1, dueDate: '2025-08-01' },
      { _id: 'b', title: 'Finish Report', _listId: dummyListId, completed: false, priority: 2, dueDate: '2025-07-01' },
      { _id: 'c', title: 'Unscheduled Task', _listId: dummyListId, completed: false, priority: 0 }, // no dueDate
    ];

    taskServiceSpy.getTasks.and.returnValue(of(mockTasks));

    component.generateSchedule();
    fixture.detectChanges(); // update DOM

    expect(component.schedule.length).toBe(2);
    expect(component.schedule[0].title).toBe('Finish Report');
    expect(component.schedule[1].title).toBe('Clean Room');

    const renderedList = fixture.debugElement.queryAll(By.css('.schedule-result ul li'));
    expect(renderedList.length).toBe(2);
    expect(renderedList[0].nativeElement.textContent).toContain('Finish Report');
    expect(renderedList[1].nativeElement.textContent).toContain('Clean Room');
  });

  it('should handle task fetch errors gracefully', () => {
    spyOn(window, 'alert');
    taskServiceSpy.getTasks.and.returnValue(throwError(() => new Error('Failed')));

    component.generateSchedule();

    expect(window.alert).toHaveBeenCalledWith('Failed to generate schedule. Please try again.');
    expect(component.schedule.length).toBe(0);
  });

  it('should not generate schedule if listId is missing', () => {
    component.listId = '';
    spyOn(window, 'alert');
    component.generateSchedule();

    expect(taskServiceSpy.getTasks).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('No list selected for scheduling.');
  });
});
