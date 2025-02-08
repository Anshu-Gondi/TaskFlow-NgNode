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
    webRequestServiceSpy = jasmine.createSpyObj('WebRequestService', ['get', 'post', 'patch', 'delete']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken']); // Use same variables

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TaskService,
        { provide: WebRequestService, useValue: webRequestServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
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

      service.getLists().subscribe(lists => {
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
      const mockTasks = [{ _id: '1', title: 'Task 1', completed: false, _listId: 'list-1' }]; // Add _id and _listId
      const mockListId = 'list-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.get.and.returnValue(of(mockTasks));

      service.getTasks(mockListId).subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
        expect(webRequestServiceSpy.get).toHaveBeenCalledWith(`lists/${mockListId}/tasks`, {
          Authorization: `Bearer ${mockToken}`,
        });
      });
    });

    it('should return an empty array if no tasks are found', () => {
      const mockToken = 'mock-token';
      const mockListId = 'list-1';
      authServiceSpy.getAccessToken.and.returnValue(mockToken);
      webRequestServiceSpy.get.and.returnValue(throwError({ status: 404 }));

      service.getTasks(mockListId).subscribe(tasks => {
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

      service.createList('New List').subscribe(list => {
        expect(list).toEqual(mockList);
        expect(webRequestServiceSpy.post).toHaveBeenCalledWith('lists', { title: 'New List' }, {
          Authorization: `Bearer ${mockToken}`,
        });
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

      service.updateList(mockListId, 'Updated List').subscribe(list => {
        expect(list).toEqual(mockList);
        expect(webRequestServiceSpy.patch).toHaveBeenCalledWith(`lists/${mockListId}`, { title: 'Updated List' }, {
          Authorization: `Bearer ${mockToken}`,
        });
      });
    });
  });
});
