class DatePicker {
  constructor(inputElement, options = {}) {
    this.inputElement = inputElement;
    this.selectedDate = options.initialDate ? new Date(options.initialDate) : null;
    this.selectedYear = this.selectedDate ? this.selectedDate.getFullYear() : null;
    this.selectedMonth = this.selectedDate ? this.selectedDate.getMonth() : null;
    this.today = new Date();

    console.log(this.selectedDate, this.selectedYear, this.selectedMonth);

    // Options
    this.dateFormat = options.dateFormat || 'yyyy-mm-dd';
    this.minDate = options.minDate ? new Date(options.minDate) : null;
    this.maxDate = options.maxDate ? new Date(options.maxDate) : null;
    this.mobileLayout = options.mobileBreakPoint || 679;

    this.setup();
  }

  static initializeDatePicker() {
    if (!DatePicker.datepicker) {
      // Create date picker elements only once
      DatePicker.backdrop = document.createElement('div');
      DatePicker.backdrop.setAttribute('yawdc-datepicker-backdrop', '');

      DatePicker.datepicker = document.createElement('div');
      DatePicker.datepicker.classList.add('yawdc-datepicker');
      DatePicker.datepicker.innerHTML = `<div yawdc-datepicker-header><div yawdc-normal-header><select hidden yawdc-month-select-hidden></select> <select hidden yawdc-year-select-hidden></select><div yawdc-datepicker-year-month><button yawdc-action-button yawdc-month-select></button> <button yawdc-action-button yawdc-year-select></button></div></div><div yawdc-year-header>Select a year</div><div yawdc-month-header>Select a month</div></div><div yawdc-datepicker-calendar><div yawdc-datepicker-weekdays><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div yawdc-datepicker-days></div></div><div style=overflow-y:auto yawdc-datepicker-years></div><div class=month-grid yawdc-datepicker-months></div>`;
      document.body.appendChild(DatePicker.backdrop);
      document.body.appendChild(DatePicker.datepicker);

      DatePicker.datepicker.addEventListener('click', event => {
        event.stopPropagation();
      });

      DatePicker.yearSelect = DatePicker.datepicker.querySelector('[yawdc-year-select-hidden]');
      DatePicker.monthSelect = DatePicker.datepicker.querySelector('[yawdc-month-select-hidden]');

      DatePicker.headerNormal = DatePicker.datepicker.querySelector('[yawdc-normal-header]');
      DatePicker.headerYear = DatePicker.datepicker.querySelector('[yawdc-year-header]');
      DatePicker.headerMonth = DatePicker.datepicker.querySelector('[yawdc-month-header]');

      // Views
      DatePicker.yearView = DatePicker.datepicker.querySelector('[yawdc-datepicker-years]');
      DatePicker.monthView = DatePicker.datepicker.querySelector('[yawdc-datepicker-months]');
      DatePicker.calendarView = DatePicker.datepicker.querySelector('[yawdc-datepicker-calendar]');

      DatePicker.yearSelect.addEventListener('change', () => {
        if (DatePicker.activeInstance) {
          DatePicker.activeInstance.selectedYear = parseInt(DatePicker.yearSelect.value);
          DatePicker.activeInstance.renderCalendar();
        }
      });

      DatePicker.monthSelect.addEventListener('change', () => {
        if (DatePicker.activeInstance) {
          DatePicker.activeInstance.selectedMonth = parseInt(DatePicker.monthSelect.value);
          DatePicker.activeInstance.renderCalendar();
        }
      });
    }
  }

  setup() {
    DatePicker.initializeDatePicker();
    this.setupListeners();
    this.disableInputSuggestions();
    this.addIcon();
  }

  setupListeners() {
    // Open date picker on input click
    this.inputElement.addEventListener('click', event => {
      event.stopPropagation();
      this.closeAllDatePickers();
      DatePicker.activeInstance = this;
      this.openDatePicker();
    });

    document.addEventListener('click', event => {
      if (!DatePicker.datepicker.contains(event.target) && event.target !== this.inputElement) {
        this.closeDatePicker();
      }
    });

    DatePicker.headerNormal
      .querySelector('[yawdc-datepicker-year-month] [yawdc-year-select]')
      .addEventListener('click', event => {
        this.hide(DatePicker.calendarView);
        this.showYearGrid(true);
      });

    DatePicker.headerNormal
      .querySelector('[yawdc-datepicker-year-month] [yawdc-month-select]')
      .addEventListener('click', event => {
        this.hide(DatePicker.calendarView);
        this.showMonthGrid(true);
      });
  }

  openDatePicker() {
    DatePicker.datepicker.classList.add('visible');
    this.positionDatePicker();
    this.shouldTriggerMobileLayout();
    this.renderInitialView();
  }

  closeDatePicker() {
    DatePicker.datepicker.classList.remove('visible');
    DatePicker.backdrop.classList.remove('visible');
    document.body.classList.remove('yawdc-datepicker-open');
    this.resetDatePickerStyles();
  }

  shouldTriggerMobileLayout() {
    const viewPortWidth = document.documentElement.clientWidth;

    if (viewPortWidth <= this.mobileLayout) {
      document.body.classList.add('yawdc-datepicker-open');

      DatePicker.datepicker.style.top = `calc(50% + ${window.scrollY}px)`;
      DatePicker.datepicker.style.left = 0;
      DatePicker.datepicker.style.right = 0;
      DatePicker.datepicker.style.margin = 'auto';
      DatePicker.datepicker.style.transform = 'translateY(-50%)';

      DatePicker.backdrop.classList.add('visible');
    } else {
      this.resetDatePickerStyles();
      document.body.classList.remove('yawdc-datepicker-open');
    }
  }

  resetDatePickerStyles() {
    DatePicker.datepicker.style.right = null;
    DatePicker.datepicker.style.margin = null;
    DatePicker.datepicker.style.transform = null;
  }

  closeAllDatePickers() {
    DatePicker.activeInstance = null;
    this.closeDatePicker();
  }

  positionDatePicker() {
    const rect = this.inputElement.getBoundingClientRect();
    DatePicker.datepicker.style.top = `${rect.bottom + window.scrollY}px`;
    DatePicker.datepicker.style.left = `${rect.left + window.scrollX}px`;
  }

  renderInitialView() {
    this.populateYearSelect();
    this.populateMonthSelect();
    if (!this.selectedDate) {
      this.hide(DatePicker.headerNormal);
      this.hide(DatePicker.headerMonth);
      this.show(DatePicker.headerYear);

      this.hide(DatePicker.monthView);
      this.hide(DatePicker.calendarView);
      this.showYearGrid();
    } else {
      this.show(DatePicker.headerNormal);
      this.hide(DatePicker.headerMonth);
      this.hide(DatePicker.headerYear);
      this.renderCalendar();
      this.setCalendarHeader();
      this.hide(DatePicker.monthView);
      this.hide(DatePicker.yearView);
    }
  }

  setCalendarHeader() {
    const monthValue = this.getMonths()[this.selectedMonth];
    const yearValue = this.selectedYear;

    DatePicker.headerNormal.querySelector(
      '[yawdc-datepicker-year-month] [yawdc-month-select]'
    ).innerHTML = `${monthValue}`;

    DatePicker.headerNormal.querySelector(
      '[yawdc-datepicker-year-month] [yawdc-year-select]'
    ).innerHTML = `${yearValue}`;
  }

  showYearGrid(single = false) {
    this.hide(DatePicker.monthView);
    const yearGrid = DatePicker.yearView;
    yearGrid.innerHTML = '';

    const currentYear = this.today.getFullYear();
    const startYear = this.minDate ? this.minDate.getFullYear() : currentYear - 10;
    const endYear = this.maxDate ? this.maxDate.getFullYear() : currentYear + 10;

    for (let year = startYear; year <= endYear; year++) {
      const yearCell = document.createElement('div');
      yearCell.classList.add('year-cell');
      if (year === this.selectedYear || (year === currentYear && !this.selectedYear)) {
        yearCell.classList.add('selected');
      }
      yearCell.textContent = year;
      yearCell.addEventListener('click', () => {
        this.selectedYear = year;
        DatePicker.yearSelect.value = year;
        this.selectedMonth = null; // Reset selected month
        this.populateMonthSelect();
        this.triggerChange(DatePicker.yearSelect);

        if (single) {
          DatePicker.headerNormal.querySelector(
            '[yawdc-datepicker-year-month] [yawdc-year-select]'
          ).innerHTML = `${this.selectedYear}`;

          this.hide(DatePicker.yearView);
          this.show(DatePicker.headerNormal);
          this.show(DatePicker.calendarView);
        } else {
          this.showMonthGrid();
        }
      });
      yearGrid.appendChild(yearCell);
    }

    yearGrid.style.display = 'grid';
    yearGrid.scrollTop = yearGrid.querySelector('.year-cell.selected')?.offsetTop - yearGrid.clientHeight / 2;
  }

  showMonthGrid(single = false) {
    this.hide(DatePicker.yearView);
    const monthGrid = DatePicker.datepicker.querySelector('[yawdc-datepicker-months]');
    monthGrid.innerHTML = '';

    const months = this.getMonthsShort();

    months.forEach((month, index) => {
      const monthCell = document.createElement('div');
      monthCell.classList.add('month-cell');
      monthCell.textContent = month;
      monthCell.addEventListener('click', () => {
        this.selectedMonth = index;
        DatePicker.monthSelect.value = index;
        this.triggerChange(DatePicker.monthSelect);
        this.renderCalendar();

        this.hide(DatePicker.monthView);
        this.show(DatePicker.calendarView);

        const monthValue = this.getMonths()[index];
        const yearValue = this.selectedYear;

        DatePicker.headerNormal.querySelector(
          '[yawdc-datepicker-year-month] [yawdc-month-select]'
        ).innerHTML = `${monthValue}`;

        DatePicker.headerNormal.querySelector(
          '[yawdc-datepicker-year-month] [yawdc-year-select]'
        ).innerHTML = `${yearValue}`;

        this.show(DatePicker.headerNormal);
        this.hide(DatePicker.headerMonth);
        this.hide(DatePicker.headerYear);
      });
      monthGrid.appendChild(monthCell);
    });

    monthGrid.style.display = 'grid';
    if (!single) {
      this.show(DatePicker.headerMonth);
      this.hide(DatePicker.headerNormal);
      this.hide(DatePicker.headerYear);
    }
  }

  renderCalendar() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const daysContainer = DatePicker.datepicker.querySelector('[yawdc-datepicker-days]');
    daysContainer.innerHTML = '';

    const year = this.selectedYear;
    const month = this.selectedMonth;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Populate days
    for (let i = 0; i < firstDay; i++) {
      daysContainer.innerHTML += '<span>-</span>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toLocaleDateString('en-US', { timeZone: timezone });
      const formattedDate = this.formatDate(new Date(year, month, day), this.dateFormat);
      const dayClass = [];
      if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
        dayClass.push('today');
      }

      if (
        this.selectedDate &&
        year === this.selectedDate.getFullYear() &&
        month === this.selectedDate.getMonth() &&
        day === this.selectedDate.getDate() // Use day instead of date
      ) {
        console.log(day);
        console.log(date);
        dayClass.push('selected');
      }
      daysContainer.innerHTML += `<span class="day ${dayClass.join(
        ' '
      )}" data-date="${date}" data-formatted="${formattedDate}">${day}</span>`;
    }

    // Add click event listener to select a date
    daysContainer.querySelectorAll('.day').forEach(dayElement => {
      dayElement.addEventListener('click', event => {
        this.inputElement.value = event.target.dataset.formatted || event.target.dataset.date;
        this.selectedDate = new Date(event.target.dataset.date);
        this.closeDatePicker();
        this.renderCalendar();
      });
    });
  }

  populateYearSelect() {
    DatePicker.yearSelect.innerHTML = '';
    const currentYear = new Date().getFullYear();
    const startYear = this.minDate ? this.minDate.getFullYear() : currentYear - 10;
    const endYear = this.maxDate ? this.maxDate.getFullYear() : currentYear + 10;
    for (let year = startYear; year <= endYear; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      DatePicker.yearSelect.appendChild(option);
    }

    DatePicker.yearSelect.value = this.selectedYear;
  }

  populateMonthSelect() {
    DatePicker.monthSelect.innerHTML = '';
    const months = this.getMonths();
    months.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = month;
      DatePicker.monthSelect.appendChild(option);
    });

    DatePicker.monthSelect.value = this.selectedMonth;
  }

  formatDate(date, format) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return format
      .replace('yyyy', year)
      .replace('mm', month.toString().padStart(2, '0'))
      .replace('dd', day.toString().padStart(2, '0'));
  }

  disableInputSuggestions() {
    this.inputElement.setAttribute('autocomplete', 'off');
  }

  triggerChange(target) {
    target.dispatchEvent(new Event('change'));
  }

  addIcon() {
    const wrapper = document.createElement('div');
    wrapper.classList.add('yawdc-datepicker-wrapper');
    this.inputElement.parentNode.insertBefore(wrapper, this.inputElement);
    wrapper.appendChild(this.inputElement);
  }

  getMonths() {
    // prettier-ignore
    return ["January","February","March","April","May","June","July","August","September","October","November","December"];
  }

  getMonthsShort() {
    // prettier-ignore
    return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];
  }

  // Show an element
  show(elem, display = 'block') {
    elem.style.display = display;
  }

  // Hide an element
  hide(elem) {
    elem.style.display = 'none';
  }
}
