/*
 *               ~ CLNDR v1.2.0 ~
 * ==============================================
 *       https://github.com/kylestetz/CLNDR
 * ==============================================
 *  created by kyle stetz (github.com/kylestetz)
 *        &available under the MIT license
 * http://opensource.org/licenses/mit-license.php
 * ==============================================
 *
 * This is the fully-commented development version of CLNDR.
 * For the production version, check out clndr.min.js
 * at https://github.com/kylestetz/CLNDR
 *
 * This work is based on the
 * jQuery lightweight plugin boilerplate
 * Original author: @ajpiano
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */

/*global moment*/ 

(function ($, window, document, undefined) {
    "use strict";

    // This is the default calendar template. This can be overridden.
    var clndrTemplate = "<div class='clndr-controls'>" +
        "<div class='clndr-control-button'><span class='clndr-previous-button'>previous</span></div><div class='month'><%= month %> <%= year %></div><div class='clndr-control-button rightalign'><span class='clndr-next-button'>next</span></div>" +
        "</div>" +
      "<table class='clndr-table' border='0' cellspacing='0' cellpadding='0'>" +
        "<thead>" +
        "<tr class='header-days'>" +
        "<% for(var i = 0; i < daysOfTheWeek.length; i++) { %>" +
          "<td class='header-day'><%= daysOfTheWeek[i] %></td>" +
        "<% } %>" +
        "</tr>" +
        "</thead>" +
        "<tbody>" +
        "<% for(var i = 0; i < numberOfRows; i++){ %>" +
          "<tr>" +
          "<% for(var j = 0; j < 7; j++){ %>" +
          "<% var d = j + i * 7; %>" +
          "<td class='<%= days[d].classes %>'><div class='day-contents'><%= days[d].day %>" +
          "</div></td>" +
          "<% } %>" +
          "</tr>" +
        "<% } %>" +
        "</tbody>" +
      "</table>";

    var pluginName = 'clndr';

    var defaults = {
      template: clndrTemplate,
      startWithMonth: null,
      clickEvents: {
        click: null,
        nextMonth: null,
        previousMonth: null,
        nextYear: null,
        previousYear: null,
        today: null,
        onMonthChange: null,
        onYearChange: null,
        onIntervalChange: null
      },
      targets: {
        nextButton: 'clndr-next-button',
        previousButton: 'clndr-previous-button',
        nextYearButton: 'clndr-next-year-button',
        previousYearButton: 'clndr-previous-year-button',
        todayButton: 'clndr-today-button',
        scrollable: 'clndr-scrollable',
        day: 'day',
        empty: 'empty'
      },
      extras: null,
      extraDateData: null,
      dateParameter: 'date',
      doneRendering: null,
      render: null,
      daysOfTheWeek: null,
      ready: null,
      constraints: null,
      grid: null,
      /*{
        adjacentDaysChangeMonth: false,
        forceSixRows: null,
        showAdjacentMonths: true,
        weekOffset: 0
      },*/
      lengthOfTime: {
        interval: 1,
        intervalUnit: 'months',
        increment: 1
      }
    };

    function Clndr( element, options ) {
      this.element = element;

      // merge the default options with user-provided options
      this.options = $.extend(true, {}, defaults, options);

      this._defaults = defaults;
      this._name = pluginName;

      this.init();
    }

    Clndr.prototype.init = function () {
      // create the days of the week using moment's current language setting
      this.daysOfTheWeek = this.options.daysOfTheWeek || [];
      if(!this.options.daysOfTheWeek) {
        this.daysOfTheWeek = [];
        for(var i = 0; i < 7; i++) {
          this.daysOfTheWeek.push( moment().weekday(i).format('dd').charAt(0) );
        }
      }
      // shuffle the week if there's an offset
      if(this.options.weekOffset) {
        this.daysOfTheWeek = this.shiftWeekdayLabels(this.options.weekOffset);
      }

      // quick & dirty test to make sure rendering is possible.
      if( !$.isFunction(this.options.render) ) {
        this.options.render = null;
        if (typeof _ === 'undefined') {
          throw new Error("Underscore was not found. Please include underscore.js OR provide a custom render function.");
        }
        else {
          // we're just going ahead and using underscore here if no render method has been supplied.
          this.compiledClndrTemplate = _.template(this.options.template);
        }
      }

      // create the parent element that will hold the plugin & save it for later
      $(this.element).html("<div class='clndr'></div>");
      this.calendarContainer = $('.clndr', this.element);

      // attach event handlers for clicks on buttons/cells
      this.bindEvents();

      this.applyChange( this.options.lengthOfTime.startDate );

      this.selectedDate = this.intervalStart.clone();
    
      // if a ready callback has been provided, call it.
      if(this.options.ready) {
        this.options.ready.apply(this, []);
      }
    };

    Clndr.prototype.shiftWeekdayLabels = function(offset) {
      var days = this.daysOfTheWeek;
      for(var i = 0; i < offset; i++) {
        days.push( days.shift() );
      }
      return days;
    };

    // This is where the magic happens. Given a moment object representing the current month,
    // an array of calendarDay objects is constructed that contains appropriate events and
    // classes depending on the circumstance.
    Clndr.prototype.createDaysObject = function(startDate, endDate) {
      // this array will hold numbers for the entire grid (even the blank spaces)
      var daysArray = [];
      var date = startDate.clone();
      var lengthOfInterval = endDate.diff(startDate, 'days');

      // this is a helper object so that days can resolve their classes correctly.
      // Don't use it for anything please.
      this._currentIntervalStart = startDate.clone();

      // if diff is greater than 0, we'll have to fill in last days of the previous month
      // to account for the empty boxes in the grid.
      // we also need to take into account the weekOffset parameter.
      // None of this needs to happen if the interval is being specified in days rather than months.
      if(this.options.grid) {
        var diff = date.weekday() - this.options.weekOffset;
        if(diff < 0) diff += 7;

        if(this.options.grid && this.options.grid.showAdjacentMonths) {
          for(var i = 0; i < diff; i++) {
            var day = moment([startDate.year(), startDate.month(), i - diff + 1]);
            daysArray.push( this.createDayObject(day, this.eventsLastMonth) );
          }
        } else {
          for(var index = 0; index < diff; index++) {
            daysArray.push( this.calendarDay({ classes: this.options.targets.empty + " last-month" }) );
          }
        }
      }

      // now we push all of the days in the interval
      var dateIterator = startDate.clone();
      while( dateIterator.isBefore(endDate) || dateIterator.isSame(endDate, 'day') ) {
        daysArray.push( this.createDayObject(dateIterator.clone(), this.eventsThisInterval) );
        dateIterator.add('days', 1);
      }

      // ...and if there are any trailing blank boxes, fill those in
      // with the next month first days.
      // Again, we can ignore this if the interval is specified in days.
      if(this.options.grid) {
        while(daysArray.length % 7 !== 0) {
          if(this.options.showAdjacentMonths) {
            daysArray.push( this.createDayObject(dateIterator.clone(), this.eventsNextMonth) );
          } else {
            daysArray.push( this.calendarDay({ classes: this.options.targets.empty + " next-month" }) );
          }
          dateIterator.add('days', 1);
        }
      }

      // if we want to force six rows of calendar, now's our last chance to add another row.
      // if the 42 seems explicit it's because we're creating a 7-row grid and 6 rows of 7 is always 42!
      if(this.options.grid && this.options.grid.forceSixRows && daysArray.length !== 42 ) {
        while(daysArray.length < 42) {
          if(this.options.showAdjacentMonths) {
            daysArray.push( this.createDayObject(dateIterator.clone(), this.eventsNextMonth) );
            dateIterator.add('days', 1);
          } else {
            daysArray.push( this.calendarDay({ classes: this.options.targets.empty + " next-month" }) );
          }
        }
      }

      return daysArray;
    };

    Clndr.prototype.createDayObject = function(day, events, intervalStart) {
      var eventsToday = [];
      var now = moment();
      var self = this;

      // validate moment date
      if (!day.isValid() && day.hasOwnProperty('_d') && day._d !== undefined) {
          day = moment(day._d);
      }

      var extraClasses = "";

      if(now.format("YYYY-MM-DD") == day.format("YYYY-MM-DD")) {
         extraClasses += " today";
      }
      if(day.isBefore(now, 'day')) {
        extraClasses += " past";
      }
      
      if(this.options.grid) {
        if(this._currentIntervalStart.month() > day.month()) {
           extraClasses += " adjacent-month";
           extraClasses += this._currentIntervalStart.year() === day.year() ? " last-month" : " next-month";

        } else if(this._currentIntervalStart.month() < day.month()) {
           extraClasses += " adjacent-month";
           extraClasses += this._currentIntervalStart.year() === day.year() ? " next-month" : " last-month";
        }
      }

      // if there are constraints, we need to add the inactive class to the days outside of them
      if(this.options.constraints) {
        if(this.options.constraints.startDate && day.isBefore(moment( this.options.constraints.startDate ))) {
          extraClasses += " inactive";
        }
        if(this.options.constraints.endDate && day.isAfter(moment( this.options.constraints.endDate ))) {
          extraClasses += " inactive";
        }
      }

      if( day.isSame( this.selectedDate, 'day') ){ extraClasses += " selected"; }

      // These are important.
      extraClasses += " calendar-day-" + day.format("YYYY-MM-DD");

      // day of week
      extraClasses += " calendar-dow-" + day.weekday();

      var defaults = { day: "", classes: this.options.targets.empty, events: [], date: null };
      var dateData = $.extend({}, defaults, {
        day: day,
        intervalStart: intervalStart,
        classes: this.options.targets.day + extraClasses
      });
      if( this.options.extraDateData ){
        return $.extend({}, dateData, this.options.extraDateData( day ));
      }else{
        return dateData;
      }
    };

    Clndr.prototype.render = function() {
      // get rid of the previous set of calendar parts.
      // TODO: figure out if this is the right way to ensure proper garbage collection?
      this.calendarContainer.children().remove();

      var days = this.createDaysObject(this.intervalStart.clone(), this.intervalEnd.clone());
      var data = {
          daysOfTheWeek: this.daysOfTheWeek,
          days: days,
          intervalStart: this.intervalStart.clone(),
          intervalEnd: this.intervalEnd.clone(),
          extras: this.options.extras
        };

      // render the calendar with the data above & bind events to its elements
      if(!this.options.render) {
        this.calendarContainer.html(this.compiledClndrTemplate(data));
      } else {
        this.calendarContainer.html(this.options.render.apply(this, [data]));
      }

      // if there are constraints, we need to add the 'inactive' class to the controls
      if(this.options.constraints) {
        // in the interest of clarity we're just going to remove all inactive classes and re-apply them each render.
        for( var target in this.options.targets) {
          if(target != this.options.targets.day) {
            this.element.find('.' + this.options.targets[target]).toggleClass('inactive', false);
          }
        }

        var start = null;
        var end = null;

        if(this.options.constraints.startDate) {
          start = moment(this.options.constraints.startDate);
        }
        if(this.options.constraints.endDate) {
          end = moment(this.options.constraints.endDate);
        }
        // deal with the month controls first.
        // do we have room to go back?
        if(start && (start.isAfter(this.intervalStart) || start.isSame(this.intervalStart, 'day'))) {
          this.element.find('.' + this.options.targets.previousButton).toggleClass('inactive', true);
        }
        // do we have room to go forward?
        if(end && (end.isBefore(this.intervalEnd) || end.isSame(this.intervalEnd, 'day'))) {
          this.element.find('.' + this.options.targets.nextButton).toggleClass('inactive', true);
        }
        // what's last year looking like?
        if(start && start.isAfter(this.intervalStart.clone().subtract('years', 1)) ) {
          this.element.find('.' + this.options.targets.previousYearButton).toggleClass('inactive', true);
        }
        // how about next year?
        if(end && end.isBefore(this.intervalEnd.clone().add('years', 1)) ) {
          this.element.find('.' + this.options.targets.nextYearButton).toggleClass('inactive', true);
        }
        // today? we could put this in init(), but we want to support the user changing the constraints on a living instance.
        if(( start && start.isAfter( moment(), 'month' ) ) || ( end && end.isBefore( moment(), 'month' ) )) {
          this.element.find('.' + this.options.targets.today).toggleClass('inactive', true);
        }
      }


      if(this.options.doneRendering) {
        this.options.doneRendering.apply(this, []);
      }
    };

    Clndr.prototype.bindEvents = function() {
      var $container = $(this.element);
      var self = this;

      // target the day elements and give them click events
      $container.on('click', '.'+this.options.targets.day, function(event) {
        var target = self.buildTargetObject(event.currentTarget, true);
        self.setSelected( target.date );
        if(self.options.clickEvents.click) {
          self.options.clickEvents.click.apply(self, [target]);
        }
        // if adjacentDaysChangeMonth is on, we need to change the month here.
        if(self.options.adjacentDaysChangeMonth) {
          if($(event.currentTarget).is(".last-month")) {
            self.backActionWithContext(self);
          } else if($(event.currentTarget).is(".next-month")) {
            self.forwardActionWithContext(self);
          }
        }
      });
      // target the empty calendar boxes as well
      $container.on('click', '.'+this.options.targets.empty, function(event) {
        if(self.options.clickEvents.click) {
          var target = self.buildTargetObject(event.currentTarget, false);
          self.options.clickEvents.click.apply(self, [target]);
        }
        if(self.options.adjacentDaysChangeMonth) {
          if($(event.currentTarget).is(".last-month")) {
            self.backActionWithContext(self);
          } else if($(event.currentTarget).is(".next-month")) {
            self.forwardActionWithContext(self);
          }
        }
      });

      // bind the previous, next and today buttons
      $container
        .on('click', '.'+this.options.targets.previousButton, { context: this }, this.backAction)
        .on('click', '.'+this.options.targets.nextButton, { context: this }, this.forwardAction)
        .on('click', '.'+this.options.targets.todayButton, { context: this }, this.todayAction)
        .on('click', '.'+this.options.targets.nextYearButton, { context: this }, this.nextYearAction)
        .on('click', '.'+this.options.targets.previousYearButton, { context: this }, this.previousYearAction)
        .on('mousewheel', '.'+this.options.targets.scrollable, { context: this }, this.scroll);
    };

    // If the user provided a click callback we'd like to give them something nice to work with.
    // buildTargetObject takes the DOM element that was clicked and returns an object with
    // the DOM element, events, and the date (if the latter two exist). Currently it is based on the id,
    // however it'd be nice to use a data- attribute in the future.
    Clndr.prototype.buildTargetObject = function(currentTarget, targetWasDay) {
      // This is our default target object, assuming we hit an empty day with no events.
      var target = {
        element: currentTarget,
        date: null
      };
      // did we click on a day or just an empty box?
      if(targetWasDay) {
        var dateString;

        // Our identifier is in the list of classNames. Find it!
        var classNameIndex = currentTarget.className.indexOf('calendar-day-');
        if(classNameIndex !== 0) {
          // our unique identifier is always 23 characters long.
          // If this feels a little wonky, that's probably because it is.
          // Open to suggestions on how to improve this guy.
          dateString = currentTarget.className.substring(classNameIndex + 13, classNameIndex + 23);
          target.date = moment(dateString);
        } else {
          target.date = null;
        }
      }

      return target;
    };

    Clndr.prototype.forwardAction = function(event) {
      event.data.context.forward();
    };

    Clndr.prototype.backAction = function(event) {
      event.data.context.back();
    };
   
    /* 
     * Go to previous on scroll up
     * Go to next on scroll down
     */
    Clndr.prototype.scroll = function(event) {
      event.preventDefault();
      if (event.originalEvent.wheelDelta >= 0) {
        event.data.context.back();
      }
      else {
        event.data.context.forward();
      }
    };

    /*
     * Move calendar to today
     */
    Clndr.prototype.todayAction = function(event) { 
      var self = event.data.context; 
      var newIntervalStart = moment();
      self.applyChange( newIntervalStart,
        function(){ 
          if(self.options.clickEvents.today) {
            self.options.clickEvents.today.apply( self, [moment(self.intervalStart)] );
          }
        }
      );
    };

    Clndr.prototype.forward = function() {
      var newIntervalStart = this.intervalStart.clone().add(this.options.lengthOfTime.increment, this.options.lengthOfTime.intervalUnit).startOf(this.options.lengthOfTime.intervalUnit);
      this.applyChange( newIntervalStart );

      return this;
    };

    Clndr.prototype.back = function(options) {
      var newIntervalStart = this.intervalStart.clone().subtract(this.options.lengthOfTime.increment, this.options.lengthOfTime.intervalUnit).startOf(this.options.lengthOfTime.intervalUnit);
      this.applyChange( newIntervalStart );

      return this;
    };

    // alternate names for convenience
    Clndr.prototype.next = function() {
      this.forward();
      return this;
    };

    Clndr.prototype.previous = function() {
      this.back();
      return this;
    };

    Clndr.prototype.setIntervalStart = function( newDate ) {
      this.applyChange( newIntervalStart );
      return this;
    };
    
    Clndr.prototype.setSelected = function( date ) {
      this.selectedDate = date;
      this.render();
      return this;
    };

    /*
     * Apply a new interval start date, move intervalEnd accordingly
     * Trigger callbacks.
     */
    Clndr.prototype.applyChange = function( newIntervalStart, extraHooks ){
      var oldIntervalStart;
      if( this.intervalStart ){
        oldIntervalStart = this.intervalStart.clone();
      }
      
      this.setIntervalBounds(newIntervalStart);
      this.render();
      if( oldIntervalStart ){ 
        this.callChangeHooks( oldIntervalStart ); 
        if( extraHooks ){ 
          extraHooks( newIntervalStart, oldIntervalStart ); 
        }
      }
    };

    /*
     * Compare old date to new date (currently set ) and determine which callbacks to trigger
     */
    Clndr.prototype.callChangeHooks = function( old ){
      if(this.options.clickEvents.previousInterval) {
        this.options.clickEvents.previousInterval.apply( this, [moment(this.intervalStart), moment(this.intervalEnd)] );
      }
      if(this.options.clickEvents.onIntervalChange) {
        this.options.clickEvents.onIntervalChange.apply( this, [moment(this.intervalStart), moment(this.intervalEnd)] );
      }

      if(this.options.clickEvents.previousMonth && !old.isSame(this.intervalStart,'month') ) {
        this.options.clickEvents.previousMonth.apply( this, [moment(this.intervalStart)] );
      }
      if(this.options.clickEvents.onMonthChange && !old.isSame(this.intervalStart,'month')) {
        this.options.clickEvents.onMonthChange.apply( this, [moment(this.intervalStart)] );
      }
      if(this.options.clickEvents.onYearChange && !old.isSame(this.intervalStart,'year')) {
        this.options.clickEvents.onYearChange.apply( this, [moment(this.intervalStart)] );
      }
    };

    Clndr.prototype.setIntervalBounds = function(intervalStart){
      this.intervalStart = intervalStart;
      this.intervalEnd = this.intervalStart.clone().add(
          this.options.lengthOfTime.interval - 1, 
          this.options.lengthOfTime.intervalUnit 
      ).endOf(this.options.lengthOfTime.intervalUnit);
    };

    $.fn.clndr = function(options) {
      if(this.length === 1) {
        if(!this.data('plugin_clndr')) {
          var clndr_instance = new Clndr(this, options);
          this.data('plugin_clndr', clndr_instance);
          return clndr_instance;
        }
      } else if(this.length > 1) {
        throw new Error("CLNDR does not support multiple elements yet. Make sure your clndr selector returns only one element.");
      }
    };

})( jQuery, window, document );
