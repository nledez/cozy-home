// Generated by CoffeeScript 1.8.0
var AlarmManager, CozyAdapter, LOCALE_PATH, Polyglot, RRule, buildLocalePath, fs, log, moment, oneDay, useBuildLocales,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

CozyAdapter = require('jugglingdb-cozy-adapter');

RRule = require('rrule').RRule;

moment = require('moment-timezone');

log = require('printit')({
  prefix: 'alarm-manager'
});

Polyglot = require('node-polyglot');

fs = require('fs');

buildLocalePath = '../../client/locales/';

useBuildLocales = fs.existsSync(buildLocalePath);

if (useBuildLocales) {
  LOCALE_PATH = buildLocalePath;
} else {
  LOCALE_PATH = '../../client/app/locales/';
}

oneDay = 24 * 60 * 60 * 1000;

module.exports = AlarmManager = (function() {
  AlarmManager.prototype.dailytimer = null;

  AlarmManager.prototype.timeouts = {};

  function AlarmManager(options) {
    this.handleNotification = __bind(this.handleNotification, this);
    this.handleAlarm = __bind(this.handleAlarm, this);
    this.fetchAlarms = __bind(this.fetchAlarms, this);
    var err, phrases;
    this.timezone = options.timezone || 'UTC';
    this.locale = options.locale || 'en';
    this.Event = options.Event;
    this.notificationHelper = options.notificationHelper;
    try {
      phrases = require("" + LOCALE_PATH + this.locale);
    } catch (_error) {
      err = _error;
      phrases = require("" + LOCALE_PATH + "en");
    }
    this.polyglot = new Polyglot({
      locale: this.locale,
      phrases: phrases
    });
    this.fetchAlarms();
  }

  AlarmManager.prototype.fetchAlarms = function() {
    this.dailytimer = setTimeout(this.fetchAlarms, oneDay);
    return this.Event.all((function(_this) {
      return function(err, events) {
        var event, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = events.length; _i < _len; _i++) {
          event = events[_i];
          _results.push(_this.addEventCounters(event));
        }
        return _results;
      };
    })(this));
  };

  AlarmManager.prototype.clearTimeouts = function(id) {
    var timeout, _i, _len, _ref;
    if (this.timeouts[id] != null) {
      _ref = this.timeouts[id];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        timeout = _ref[_i];
        clearTimeout(timeout);
      }
      return delete this.timeouts[id];
    }
  };

  AlarmManager.prototype.handleAlarm = function(event, msg) {
    console.log(event, msg);
    switch (event) {
      case "event.create":
      case "event.update":
        return this.Event.find(msg, (function(_this) {
          return function(err, event) {
            if (event != null) {
              return _this.addEventCounters(event);
            }
          };
        })(this));
      case "event.delete":
        return this.clearTimeouts(msg);
    }
  };

  AlarmManager.prototype.addEventCounters = function(event) {
    var cozyAlarm, cozyAlarms, _i, _len, _ref, _results;
    if ((event.alarms != null) && ((_ref = event.alarms.items) != null ? _ref.length : void 0) > 0) {
      cozyAlarms = event.getAlarms(this.timezone);
      _results = [];
      for (_i = 0, _len = cozyAlarms.length; _i < _len; _i++) {
        cozyAlarm = cozyAlarms[_i];
        _results.push(this.addAlarmCounters(cozyAlarm));
      }
      return _results;
    }
  };

  AlarmManager.prototype.addAlarmCounters = function(alarm) {
    var delta, in24h, now, timeout, timezone, triggerDate, _base, _name, _ref;
    this.clearTimeouts(alarm._id);
    timezone = alarm.timezone || this.timezone;
    triggerDate = moment.tz(alarm.trigg, timezone);
    now = moment().tz(timezone);
    in24h = moment(now).add(1, 'days');
    if ((now.unix() <= (_ref = triggerDate.unix()) && _ref < in24h.unix())) {
      delta = triggerDate.valueOf() - now.valueOf();
      log.info("Notification in " + (delta / 1000) + " seconds.");
      if ((_base = this.timeouts)[_name = alarm._id] == null) {
        _base[_name] = [];
      }
      timeout = setTimeout(this.handleNotification.bind(this), delta, alarm);
      return this.timeouts[alarm._id].push(timeout);
    }
  };

  AlarmManager.prototype.handleNotification = function(alarm) {
    var agenda, contentKey, contentOptions, data, event, message, resource, titleKey, titleOptions, _ref, _ref1, _ref2;
    if ((_ref = alarm.action) === 'DISPLAY' || _ref === 'BOTH') {
      resource = alarm.related != null ? alarm.related : {
        app: 'calendar',
        url: "/#list"
      };
      message = alarm.description || '';
      this.notificationHelper.createTemporary({
        text: this.polyglot.t('reminder message', {
          message: message
        }),
        resource: resource
      });
    }
    if ((_ref1 = alarm.action) === 'EMAIL' || _ref1 === 'BOTH') {
      if (alarm.event != null) {
        event = alarm.event;
        agenda = event.tags[0] || '';
        titleKey = 'reminder title email expanded';
        titleOptions = {
          description: event.description,
          date: event.start.format('llll'),
          calendarName: agenda
        };
        contentKey = 'reminder message expanded';
        contentOptions = {
          description: event.description,
          start: event.start.format('LLLL'),
          end: event.end.format('LLLL'),
          place: event.place,
          details: event.details,
          timezone: timezone
        };
        data = {
          from: 'Cozy Calendar <no-reply@cozycloud.cc>',
          subject: this.polyglot.t(titleKey, titleOptions),
          content: this.polyglot.t(contentKey, contentOptions)
        };
      } else {
        data = {
          from: "Cozy Calendar <no-reply@cozycloud.cc>",
          subject: this.polyglot.t('reminder title email'),
          content: this.polyglot.t('reminder message', {
            message: message
          })
        };
      }
      CozyAdapter.sendMailToUser(data, function(error, response) {
        if (error != null) {
          return log.error("Error while sending email -- " + error);
        }
      });
    }
    if ((_ref2 = alarm.action) !== 'EMAIL' && _ref2 !== 'DISPLAY' && _ref2 !== 'BOTH') {
      return log.error("UNKNOWN ACTION TYPE (" + alarm.action + ")");
    }
  };

  AlarmManager.prototype.iCalDurationToUnitValue = function(s) {
    var m, o;
    m = s.match(/(\d+)(W|D|H|M|S)/);
    o = {};
    o[m[2].toLowerCase()] = parseInt(m[1]);
    return o;
  };

  return AlarmManager;

})();
