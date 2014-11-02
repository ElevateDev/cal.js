describe("Days array", function() {
  var cal;
  beforeEach(function(){
    cal = $('#calTest').clndr({
      render: function(){}
    });
  });
  it("14 length of time should return days array of size 14", function() {
    cal.options.lengthOfTime.interval = 14;
    cal.options.lengthOfTime.intervalUnit = 'days';
    cal.applyChange( moment() );

    expect(cal.createDaysObject().length).toBe(14);
  });
});
