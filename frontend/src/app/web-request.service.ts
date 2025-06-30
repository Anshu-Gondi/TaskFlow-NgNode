import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebRequestService {
  readonly ROOT_URL = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  get<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.ROOT_URL}/${url}`);
  }

  post<T>(url: string, payload: object = {}): Observable<T> {
    return this.http.post<T>(`${this.ROOT_URL}/${url}`, payload);
  }

  patch<T>(url: string, payload: object = {}): Observable<T> {
    return this.http.patch<T>(`${this.ROOT_URL}/${url}`, payload);
  }

  delete<T = void>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.ROOT_URL}/${url}`);
  }
}
