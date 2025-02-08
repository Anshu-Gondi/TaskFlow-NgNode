import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WebRequestService } from './web-request.service';

describe('WebRequestService', () => {
  let service: WebRequestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],  // Importing HttpClientTestingModule
      providers: [WebRequestService],     // Providing the WebRequestService
    });
    service = TestBed.inject(WebRequestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform a GET request', () => {
    const mockData = { name: 'John', age: 30 };
    const url = 'users/1';

    service.get(url).subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('http://localhost:3000/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockData); // Respond with mock data
  });

  it('should perform a POST request', () => {
    const mockData = { name: 'John', age: 30 };
    const url = 'users';
    const payload = { name: 'John', age: 30 };

    service.post(url, payload).subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('http://localhost:3000/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockData); // Respond with mock data
  });

  it('should perform a PATCH request', () => {
    const mockData = { name: 'John', age: 30 };
    const url = 'users/1';
    const payload = { age: 30 };

    service.patch(url, payload).subscribe((data) => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('http://localhost:3000/users/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush(mockData); // Respond with mock data
  });

  it('should perform a DELETE request', () => {
    const url = 'users/1';

    service.delete(url).subscribe(() => {
      expect(true).toBeTrue();  // Expect the delete to be successful
    });

    const req = httpMock.expectOne('http://localhost:3000/users/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({}); // Respond with empty object to simulate a successful delete
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });
});
