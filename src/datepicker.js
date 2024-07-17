class DatePicker {
  constructor(inputElement, options = {}) {
    this.inputElement = inputElement;
    this.selectedDate = options.initialDate ? new Date(options.initialDate) : null;
    this.selectedYear = this.selectedDate ? this.selectedDate.getFullYear() : null;
    this.selectedMonth = this.selectedDate ? this.selectedDate.getMonth() : null;
    this.today = new Date();

    // Options
    this.dateFormat = options.dateFormat || 'yyyy-mm-dd';
    this.minDate = options.minDate ? new Date(options.minDate) : null;
    this.maxDate = options.maxDate ? new Date(options.maxDate) : null;

    this.setup();
  }

  setup() {
    this.createDatePicker();
    this.setupListeners();
    this.disableInputSuggestions();
    this.addIcon();
    this.initialView();
  }

  createDatePicker() {
    // Create date picker elements
    this.datepicker = document.createElement('div');
    this.datepicker.classList.add('datepicker');
    this.datepicker.innerHTML = `
			<div class="datepicker-header">
				<select class="year-select"></select>
				<select class="month-select"></select>
			</div>
			<div class="datepicker-days"></div>
			<div class="year-grid"></div>
			<div class="month-grid"></div>
		`;
    document.body.appendChild(this.datepicker);

    this.assignDomeElementsToContext();
    this.populateYearSelect();
    this.populateMonthSelect();
  }

  assignDomeElementsToContext() {
    this.yearSelect = this.datepicker.querySelector('.year-select');
    this.monthSelect = this.datepicker.querySelector('.month-select');
  }

  setupListeners() {
    // Open date picker on input click
    this.inputElement.addEventListener('click', event => {
      event.stopPropagation();
      this.closeAllDatePickers();
      this.datepicker.classList.add('visible');
      this.positionDatePicker();
      this.renderInitialView();
    });

    // Close date picker on outside click
    document.addEventListener('click', event => {
      if (!this.datepicker.contains(event.target) && event.target !== this.inputElement) {
        this.datepicker.classList.remove('visible');
      }
    });

    // Year select change listener
    this.yearSelect.addEventListener('change', () => {
      this.selectedYear = parseInt(this.yearSelect.value);
      this.renderCalendar();
    });

    // Month select change listener
    this.monthSelect.addEventListener('change', () => {
      this.selectedMonth = parseInt(this.monthSelect.value);
      this.renderCalendar();
    });
  }

  getMonths() {
    // prettier-ignore
    return ["January","February","March","April","May","June","July","August","September","October","November","December"];
  }

  closeAllDatePickers() {
    document.querySelectorAll('.datepicker').forEach(dp => {
      dp.classList.remove('visible');
    });
  }

  positionDatePicker() {
    const rect = this.inputElement.getBoundingClientRect();
    this.datepicker.style.top = `${rect.bottom + window.scrollY}px`;
    this.datepicker.style.left = `${rect.left + window.scrollX}px`;
  }

  initialView() {
    if (!this.selectedDate) {
      this.showYearGrid();
      const daysContainer = this.datepicker.querySelector('.datepicker-days');
      daysContainer.style.display = 'none';
    } else {
      this.renderCalendar();
    }
  }

  showYearGrid() {
    const yearGrid = this.datepicker.querySelector('.year-grid');
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
        this.yearSelect.value = year;
        this.selectedMonth = null; // Reset selected month
        this.populateMonthSelect();
        this.showMonthGrid();
        this.triggerChange(this.yearSelect);
      });
      yearGrid.appendChild(yearCell);
    }

    yearGrid.style.display = 'grid';
    yearGrid.scrollTop = yearGrid.querySelector('.year-cell.selected')?.offsetTop - yearGrid.clientHeight / 2;
  }

  showMonthGrid() {
    this.datepicker.querySelector('.year-grid').style.display = 'none';
    const monthGrid = this.datepicker.querySelector('.month-grid');
    monthGrid.innerHTML = '';

    const months = this.getMonths();

    months.forEach((month, index) => {
      const monthCell = document.createElement('div');
      monthCell.classList.add('month-cell');
      monthCell.textContent = month;
      monthCell.addEventListener('click', () => {
        this.selectedMonth = index;
        // this.selectedDate = new Date(this.selectedYear, this.selectedMonth, 1);
        this.monthSelect.value = index;
        this.triggerChange(this.monthSelect);
        this.renderCalendar();
        this.datepicker.querySelector('.month-grid').style.display = 'none';
        this.datepicker.querySelector('.datepicker-days').style.display = 'grid';
      });
      monthGrid.appendChild(monthCell);
    });

    monthGrid.style.display = 'grid';
  }

  renderCalendar() {
    const daysContainer = this.datepicker.querySelector('.datepicker-days');
    daysContainer.innerHTML = '';

    const year = this.selectedYear;
    const month = this.selectedMonth;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // Populate days
    for (let i = 0; i < firstDay; i++) {
      daysContainer.innerHTML += '<span></span>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0];
      const formattedDate = this.formatDate(new Date(year, month, day), this.dateFormat);
      const dayClass = [];
      if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
        dayClass.push('today');
      }
      if (
        this.selectedDate &&
        year === this.selectedDate.getFullYear() &&
        month === this.selectedDate.getMonth() &&
        day === this.selectedDate.getDate()
      ) {
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
        this.datepicker.classList.remove('visible');
        this.renderCalendar();
      });
    });
  }

  renderInitialView() {
    const yearGrid = this.datepicker.querySelector('.year-grid');
    const monthGrid = this.datepicker.querySelector('.month-grid');
    const daysContainer = this.datepicker.querySelector('.datepicker-days');

    if (!this.selectedDate) {
      yearGrid.style.display = 'grid';
      monthGrid.style.display = 'none';
      daysContainer.style.display = 'none';
    } else {
      yearGrid.style.display = 'none';
      monthGrid.style.display = 'none';
      daysContainer.style.display = 'grid';
    }
  }

  populateYearSelect() {
    this.yearSelect.innerHTML = '';
    const currentYear = new Date().getFullYear();
    const startYear = this.minDate ? this.minDate.getFullYear() : currentYear - 10;
    const endYear = this.maxDate ? this.maxDate.getFullYear() : currentYear + 10;
    for (let year = startYear; year <= endYear; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      this.yearSelect.appendChild(option);
    }

    this.yearSelect.value = this.selectedYear;
  }

  populateMonthSelect() {
    this.monthSelect.innerHTML = '';
    const months = this.getMonths();
    months.forEach((month, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = month;
      this.monthSelect.appendChild(option);
    });

    this.monthSelect.value = this.selectedMonth;
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
    const icon = document.createElement('span');
    icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/></svg>`;
    icon.classList.add('datepicker-icon');

    const wrapper = document.createElement('div');
    wrapper.classList.add('datepicker-wrapper');
    this.inputElement.parentNode.insertBefore(wrapper, this.inputElement);
    wrapper.appendChild(this.inputElement);
    wrapper.appendChild(icon);

    icon.addEventListener('click', event => {
      event.stopPropagation();
      this.closeAllDatePickers();
      this.datepicker.classList.toggle('visible');
      this.positionDatePicker();
      this.renderInitialView();
    });
  }
}
