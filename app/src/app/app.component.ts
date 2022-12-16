import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  TemplateRef,
} from '@angular/core';
import {
  startOfDay,
  endOfDay,
  subDays,
  addDays,
  endOfMonth,
  isSameDay,
  isSameMonth,
  addHours,
} from 'date-fns';
import { Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  CalendarEvent,
  CalendarEventAction,
  CalendarEventTimesChangedEvent,
  CalendarView,
} from 'angular-calendar';
import { EventColor } from 'calendar-utils';
import { EventsService } from './events.service';
const colors: Record<string, EventColor> = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA',
  },
};

export interface StrapiResponse {
  data: StrapiEvent[];
  meta?: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiEvent {
  id: number;
  attributes: {
    title: string;
    startDate: string;
    endDate?: string;
    endTime?: string;
    allDay?: boolean | null;
    category: string;
    createdAt?: string;
    updatedAt?: string;
    publishedA?: string;
  };
}

@Component({
  selector: 'app-root',
  styles: [
    `
      h3 {
        margin: 0 0 10px;
      }

      pre {
        background-color: #f5f5f5;
        padding: 15px;
      }
    `,
  ],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  @ViewChild('modalContent', { static: true }) modalContent:
    | TemplateRef<any>
    | undefined;

  view: CalendarView = CalendarView.Month;

  CalendarView = CalendarView;

  viewDate: Date = new Date();

  modalData:
    | {
        action: string;
        event: CalendarEvent;
      }
    | undefined;

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fas fa-fw fa-pencil-alt"></i>',
      a11yLabel: 'Edit',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edited', event);
      },
    },
    {
      label: '<i class="fas fa-fw fa-trash-alt"></i>',
      a11yLabel: 'Delete',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.events = this.events.filter((iEvent) => iEvent !== event);
        this.handleEvent('Deleted', event);
      },
    },
  ];

  refresh = new Subject<void>();

  events: CalendarEvent[] = [];

  activeDayIsOpen: boolean = true;

  constructor(private modal: NgbModal, private eventsService: EventsService) {}

  ngOnInit() {
    this.getEvents();
    this.refresh.subscribe((ev) => console.log(ev));
  }

  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
    this.handleEvent('Dropped or resized', event);
  }

  handleEvent(action: string, event: CalendarEvent): void {
    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
  }

  handleChange(event: CalendarEvent) {
    this.eventsService.updateEvent(event).subscribe((res) => {
      this.events.splice(this.events.indexOf(event), 1);
      this.events = [
        ...this.events,
        this.strapiEventToCalendarEvent(res.data as any),
      ];
    });
  }

  addEvent(): void {
    this.eventsService
      .addEvent({
        title: 'New event',
        start: new Date(),
        end: new Date(),
      })
      .subscribe((event) => {
        this.events = [
          ...this.events,
          this.strapiEventToCalendarEvent(event.data as any),
        ];
      });
  }

  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter((event) => event !== eventToDelete);
    this.eventsService.deleteEvent(eventToDelete);
  }

  getEvents(): void {
    this.eventsService.getEvents().subscribe((events) => {
      // format events to match CalendarEvent type
      const data: StrapiEvent[] = events.data;
      const calendarEvents: CalendarEvent[] = data.map((event: any) =>
        this.strapiEventToCalendarEvent(event)
      );
      this.events = calendarEvents;
    });
  }

  strapiEventToCalendarEvent(event: StrapiEvent): CalendarEvent {
    return {
      id: event.id,
      start: this.stringToDate(event.attributes.startDate),
      end: event.attributes.endDate
        ? this.stringToDate(event.attributes.endDate)
        : this.stringToDate(event.attributes.startDate),
      title: event.attributes.title,
      color: colors['red'],
    };
  }

  stringToDate(dateString: string): Date {
    let date = new Date(dateString);
    date = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    return date;
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }
}
