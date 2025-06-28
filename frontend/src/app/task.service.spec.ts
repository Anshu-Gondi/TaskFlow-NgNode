import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { WebRequestService } from './web-request.service';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

describe('TaskService', () => {
  let service: TaskService;
  let webRequestServiceSpy: jasmine.SpyObj<WebRequestService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Create spies for dependencies
    webRequestServiceSpy = jasmine.createSpyObj('WebRequestService', [
      'get',
      'post',
      'patch',
      'delete',
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken']); // Use same variables

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TaskService,
        { provide: WebRequestService, useValue: webRequestServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLists', () => {
    it('should fetch the lists if access token is available', () => {
      const mockToken = 'mock-token';
      const mockLists = [{ _id: '1', title: 'List 1' }]; // Use _id instead of id
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.get.and.returnValue(of(mockLists));

      service.getLists().subscribe((lists) => {
        expect(lists).toEqual(mockLists);
        expect(webRequestServiceSpy.get).toHaveBeenCalledWith('lists', {
          Authorization: `Bearer ${mockToken}`,
        });
      });
    });

    it('should throw an error if no access token is available', () => {
      authServiceSpy.getAccessToken.and.returnValue(null);

      expect(() => service.getLists()).toThrowError('Access token is missing');
    });
  });

  describe('getTasks', () => {
    it('should fetch tasks for the given listId', () => {
      const mockToken = 'mock-token';
      const mockTasks = [
        { _id: '1', title: 'Task 1', completed: false, _listId: 'list-1' },
      ]; // Add _id and _listId
      const mockListId = 'list-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.get.and.returnValue(of(mockTasks));

      service.getTasks(mockListId).subscribe((tasks) => {
        expect(tasks).toEqual(mockTasks);
        expect(webRequestServiceSpy.get).toHaveBeenCalledWith(
          `lists/${mockListId}/tasks`,
          {
            Authorization: `Bearer ${mockToken}`,
          }
        );
      });
    });

    it('should return an empty array if no tasks are found', () => {
      const mockToken = 'mock-token';
      const mockListId = 'list-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.get.and.returnValue(throwError({ status: 404 }));

      service.getTasks(mockListId).subscribe((tasks) => {
        expect(tasks).toEqual([]);
      });
    });
  });

  describe('createList', () => {
    it('should create a list and return the created list', () => {
      const mockToken = 'mock-token';
      const mockList = { _id: '1', title: 'New List' }; // Add _id
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.post.and.returnValue(of(mockList));

      service.createList('New List').subscribe((list) => {
        expect(list).toEqual(mockList);
        expect(webRequestServiceSpy.post).toHaveBeenCalledWith(
          'lists',
          { title: 'New List' },
          {
            Authorization: `Bearer ${mockToken}`,
          }
        );
      });
    });
  });

  describe('updateList', () => {
    it('should update a list', () => {
      const mockToken = 'mock-token';
      const mockList = { _id: '1', title: 'Updated List' }; // Add _id
      const mockListId = 'list-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.patch.and.returnValue(of(mockList));

      service.updateList(mockListId, 'Updated List').subscribe((list) => {
        expect(list).toEqual(mockList);
        expect(webRequestServiceSpy.patch).toHaveBeenCalledWith(
          `lists/${mockListId}`,
          { title: 'Updated List' },
          {
            Authorization: `Bearer ${mockToken}`,
          }
        );
      });
    });
  });
  describe('createTasks', () => {
    it('should create a new task in the list', () => {
      const mockToken = 'mock-token';
      const listId = 'list-1';
      const taskTitle = 'New Task';
      const mockTask = {
        _id: 'task-1',
        title: taskTitle,
        _listId: listId,
        completed: false,
      };
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.post.and.returnValue(of(mockTask));

      service.createTasks({ title: taskTitle }, listId).subscribe((task) => {
        expect(task).toEqual(mockTask);
        expect(webRequestServiceSpy.post).toHaveBeenCalledWith(
          `lists/${listId}/tasks`,
          { title: taskTitle },
          { Authorization: `Bearer ${mockToken}` }
        );
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task title', () => {
      const mockToken = 'mock-token';
      const listId = 'list-1';
      const taskId = 'task-1';
      const newTitle = 'Updated Task';
      const mockTask = {
        _id: taskId,
        title: newTitle,
        _listId: listId,
        completed: false,
      };
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.patch.and.returnValue(of(mockTask));

      service
        .updateTask(listId, taskId, { title: newTitle })
        .subscribe((task) => {
          expect(task).toEqual(mockTask);
          expect(webRequestServiceSpy.patch).toHaveBeenCalledWith(
            `lists/${listId}/tasks/${taskId}`,
            { title: newTitle },
            { Authorization: `Bearer ${mockToken}` }
          );
        });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task by ID', () => {
      const mockToken = 'mock-token';
      const listId = 'list-1';
      const taskId = 'task-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.delete.and.returnValue(of(void 0));

      service.deleteTask(listId, taskId).subscribe((response) => {
        expect(response).toBeUndefined();
        expect(webRequestServiceSpy.delete).toHaveBeenCalledWith(
          `lists/${listId}/tasks/${taskId}`,
          { Authorization: `Bearer ${mockToken}` }
        );
      });
    });
  });

  describe('deleteList', () => {
    it('should delete a list by ID', () => {
      const mockToken = 'mock-token';
      const listId = 'list-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.delete.and.returnValue(of(void 0));

      service.deleteList(listId).subscribe((response) => {
        expect(response).toBeUndefined();
        expect(webRequestServiceSpy.delete).toHaveBeenCalledWith(
          `lists/${listId}`,
          { Authorization: `Bearer ${mockToken}` }
        );
      });
    });
  });

  describe('complete', () => {
    it('should toggle task completion', () => {
      const mockToken = 'mock-token';
      const task = {
        _id: 'task-1',
        _listId: 'list-1',
        title: 'Test Task',
        completed: false,
      };
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.patch.and.returnValue(of(void 0));

      service.complete(task).subscribe((response) => {
        expect(response).toBeUndefined();
        expect(webRequestServiceSpy.patch).toHaveBeenCalledWith(
          `lists/${task._listId}/tasks/${task._id}`,
          { completed: true },
          { Authorization: `Bearer ${mockToken}` }
        );
      });
    });
  });
});
