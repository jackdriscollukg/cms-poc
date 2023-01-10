import { Injectable } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { catchError, Observable, of, throwError } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { StrapiEvent, StrapiResponse } from './app.component';
@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(private http: HttpClient) {}

  eventsUrl = 'http://localhost:1337/api/calendar-events';
  categoriesUrl = 'http://localhost:1337/api/categories';

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `,
        error.error
      );
    }
    // Return an observable with a user-facing error message.
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }

  getEvents(): Observable<StrapiResponse> {
    return this.http.get<StrapiResponse>(this.eventsUrl + '?populate=%2A');
  }

  addEvent(event: CalendarEvent, category: any) {
    if (event.allDay) {
      event.start.setHours(0, 0, 0, 0);
      event.end?.setHours(0, 0, 0, 0);
    }

    const newEvent: any = {
      id: Math.floor(Math.random() * 10000),
      title: event.title,
      startDate: event.start.toISOString().split('T')[0],
      startTime: event.allDay
        ? '00:00:00'
        : event.start.toLocaleTimeString('en', { hour12: false }),
      endDate: event.end?.toISOString().split('T')[0],
      endTime: event.allDay
        ? '23:59:59'
        : event.end?.toLocaleTimeString('en', { hour12: false }),
      category: category,
      allDay: event.allDay,
    };
    console.log('new event', newEvent);
    const data: any = {
      data: newEvent,
    };
    return this.http
      .post<StrapiResponse>(this.eventsUrl + '?populate=%2A', data)
      .pipe(catchError(this.handleError));
  }

  deleteEvent(event: CalendarEvent) {
    const res = this.http.delete<StrapiResponse>(
      this.eventsUrl + '/' + event.id
    );
    res.subscribe((ev) => console.log(ev));
  }

  updateEvent(event: CalendarEvent) {
    const updatedEvent: any = {
      id: Number(event.id),
      title: event.title,
      startDate: event.start.toISOString(),
      endDate: event.end?.toISOString(),
      category: 'Benefits',
    };
    const data: any = {
      data: updatedEvent,
    };
    return this.http.put<StrapiResponse>(this.eventsUrl + '/' + event.id, data);
  }

  getCategories() {
    return this.http.get<any>(this.categoriesUrl);
  }

  addCategory(category: any) {
    console.log({ data: category });
    const res = this.http
      .post<any>(this.categoriesUrl, { data: category })
      .pipe(catchError(this.handleError));
    return res;
  }
}
