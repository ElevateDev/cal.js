cal.js
========

WIP!!!
Based on [CLNDR.js](https://github.com/kylestetz/CLNDR) intervals branch.  Intervals are working, and flexible.  Doesn't currently handle creation of a grid though (removed that portion).  Events have also been removed.

Setup
------------
[jQuery](http://jquery.com/download/), [Underscore](http://underscorejs.org/) and [Moment.js](http://momentjs.com/) should be declared before cal.js

Use
------------
Declare this
```html
  <script type="text/template" class="template">
    <div class="vertiCalHeader text-center">
      <%= intervalStart.format("MMMM YYYY") %>
    </div>
    <div class="btn-group-vertical input-group-vertical vertiCalBtns clndr-scrollable">
      <% _.each(days, function(day){ %>
        <div class='btn btn-default <%= day.classes %>'>
          <%= day.day.format("Do") %>
        </div>
      <% }); %>
    </div>
    <div class="btn btn-default btn-block clndr-today-button">
      Jump to Today
    </div>
  </script>
```

Place this where you want your calendar
```html
  <div id="YourTag"></div>
```

then call this

```javascript
  var calTemplate = $('script.template').html();
  var cal = $('#YourTag').clndr({
    template: calTemplate,
    lengthOfTime: {
      intervalUnit: 'days',
      interval: 14,
      startDate: moment()
    }
  });
```


The 'Days' Array
----------------

The `days` array contains most of the stuff we need to make a calendar. Its structure looks like this:
```javascript
{
  day: moment(),
  classes: "day",
  events: [],
}
```

Providing Extra Data
-------------------

To add extra data to the day object set the extraDateData parameter to a function that takes a moment date as a parameter, and returns an object.

```javascript
  function( day ){
    return {
      events: ["Booked solid"]
    };
  }
```

```html
  <% _.each(days, function(day){ %>
    <div class='btn btn-default <%= day.classes %>'>
      ...
      <% _.each(day.events, function(e){ %>
        ...
      <% }); %>
    </div>
  <% }); %>
```


Template Requirements
---------------------

CLNDR is structured so that you don't really _need_ anything in your template.

```javascript
<% _.each(days, function(day){ %>
  <div class='<%= day.classes %>'><%= day.day.format('Do') %></div>
<% }); %>
```

Currently CLNDR sets the class on a day to `'calendar-day-2013-05-30'` and uses it to determine the date when a user clicks on it. Thus, click events will only work if `days.classes` is included in your day element's `class` attribute as seen above.


Some Configuration
==================

Template Rendering Engine
----------------------------------------

You can pass in a `render` function as an option, for example:

```javascript
var precompiledTemplate = myRenderingEngine.template( $('#my-template').html() );

$('#my-calendar').clndr({
  render: function(data) {
    return precompiledTemplate(data);
  }
});
```

where the function must return the HTML result of the rendering operation. In this case you would precompile your template elsewhere in your code, since CLNDR only cares about your template if it's going to use underscore.

If you are using your own render method, underscore.js is NOT a dependency of this plugin.


The Javascript:
```javascript
var clndrTemplate = doT.template( $('#dot-template').html() );

$('#calendar').clndr({
  render: function(data) {
    return clndrTemplate(data);
  }
});
```

Internationalization
--------------------

Clndr has support for internationalization insofar as Moment.js supports it. By configuring your Moment.js instance to a different language, which you can read more about here: [i18n in Moment.js](http://momentjs.com/docs/#/i18n/), you are configuring Clndr as well.

If you are using a moment.js language configuration in which weeks begin on a Monday (e.g. French), Clndr will detect this automatically and there is no need to provide a `weekOffset` or a `daysOfTheWeek` array. If you want to reverse this behavior, there is a field in each moment.js language config file called `dow` which you can set to your liking.

The day of the week abbreviations are created automatically using moment.js's current language setting, however if this does not suit your needs you should override them using the `daysOfTheWeek` option. Make sure the array you provide begins on the same day of the week as your current language setting.


Internet Explorer Issues
========================

If you're planning on supporting IE8 and below, you'll have to be careful about version dependencies. You'll need the jQuery 1.10.x branch for IE support, and if you're taking advantage of the `constraints` feature you'll need to use a version of moment.js `<=2.1.0` or `>=2.5.1`.

Todo
====

- Add Grid Support
- Improve Documentation
  - Document scrolling
- Tests of days array output
- Add Examples
- Add Tests
