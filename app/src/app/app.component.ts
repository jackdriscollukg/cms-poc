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

export interface Category {
  data: {
    id: number;
    attributes: {
      color: string;
      name: string;
    };
  };
}

export interface StrapiEvent {
  id: number;
  attributes: {
    title: string;
    startDate: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    allDay?: boolean | null;
    category?: Category;
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
  categories: any[] = [];

  activeDayIsOpen: boolean = true;

  constructor(private modal: NgbModal, private eventsService: EventsService) {}

  ngOnInit() {
    this.getCategories();
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

  async addEvent(): Promise<void> {
    const title = (
      document.querySelector('#title-input') as HTMLUkgInputElement
    )?.value;
    let start, end;
    const dateRangePicker = document.querySelector(
      '#date-range-input'
    ) as HTMLUkgDateRangePickerElement;
    if (dateRangePicker) {
      const dates = await dateRangePicker.getDates();
      start = dates.startDate;
      end = dates.endDate;
    }
    let allDay = false;
    const allDayCheckbox = document.querySelector(
      '#all-day-checkbox'
    ) as HTMLUkgCheckboxElement;

    let startTime, endTime;
    if (allDayCheckbox) {
      allDay = allDayCheckbox.checked;
    }
    if (!allDay) {
      const startTimeInput = document.querySelector(
        '#start-time'
      ) as HTMLUkgInputElement;
      const endTimeInput = document.querySelector(
        '#end-time'
      ) as HTMLUkgTimePickerElement;
      if (startTimeInput && endTimeInput) {
        startTime = startTimeInput.value;
        endTime = endTimeInput.value;
      }
    }
    const categorySelect = document.querySelector(
      '#category-select'
    ) as HTMLUkgSelectElement;

    let category;
    if (categorySelect) {
      category = this.categories.find(
        (cat) => cat.attributes.name === categorySelect.value
      );
    }

    if (
      !title ||
      !start ||
      !end ||
      !category ||
      (!allDay && (!startTime || !endTime))
    ) {
      return;
    }
    this.eventsService
      .addEvent(
        {
          title,
          start: this.stringToDate(start, startTime, false),
          end: this.stringToDate(end, endTime, true),
          allDay,
        },
        category
      )
      .subscribe((event) => {
        console.log(event);
        this.events = [
          ...this.events,
          this.strapiEventToCalendarEvent(event.data as any),
        ];
      });
  }

  async addCategory() {
    const categoryNameInput = document.querySelector(
      '#category-input'
    ) as HTMLUkgInputElement;
    const categoryColorInput = document.querySelector(
      '#color-input'
    ) as HTMLUkgInputElement;

    const name = categoryNameInput?.value;
    const color = categoryColorInput?.value;

    if (!name || !color) {
      console.error('Missing name or color!');
      console.error('Name: ', name);
      console.error('Color: ', color);
    }

    const data = {
      color,
      name,
    };
    this.eventsService.addCategory(data).subscribe((category) => {
      console.log(category);
      this.categories = [...this.categories, category.data];
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
      console.log(data);
      const calendarEvents: CalendarEvent[] = data.map((event: any) =>
        this.strapiEventToCalendarEvent(event)
      );
      this.events = calendarEvents;
    });
  }

  getCategories(): void {
    this.eventsService.getCategories().subscribe((categories) => {
      const data = categories.data;
      this.categories = data;
      console.log(this.categories);
    });
  }

  strapiEventToCalendarEvent(event: StrapiEvent): CalendarEvent {
    console.log('strapi event', event);
    return {
      id: event.id,
      start: new Date(
        event.attributes.startDate + 'T' + event.attributes.startTime
      ),
      end: event.attributes.endDate
        ? new Date(event.attributes.endDate + 'T' + event.attributes.endTime)
        : new Date(
            event.attributes.startDate + 'T' + event.attributes.startTime
          ),
      title: event.attributes.title,
      color: {
        primary:
          event.attributes.category?.data.attributes.color ??
          colors['red'].primary,
        secondary: '#FFFFFF',
      },
    };
  }

  stringToDate(
    dateString: string,
    time?: string | null,
    isEnd?: boolean
  ): Date {
    let date;

    console.log('date string before', dateString);

    if (time) {
      date = new Date(dateString + 'T' + time);
    } else {
      date = new Date(dateString);
    }
    console.log('date here', date);

    date = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );

    if (!time) {
      if (!isEnd) {
        date.setHours(0, 0, 0, 0);
      } else {
        date.setHours(23, 59, 59, 59);
      }
    }

    console.log('date after', date);
    return date;
  }

  setView(view: CalendarView) {
    this.view = view;
  }

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  showTimeRange = true;
  handleAllDayChange(event: any) {
    this.showTimeRange = !event.detail.checked;
  }
}
