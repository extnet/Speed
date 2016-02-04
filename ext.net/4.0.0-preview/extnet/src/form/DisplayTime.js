
// @source core/form/DisplayTime.js

Ext.util.Format.timeSettings = {
    pastPrefix: null,
    futurePrefix: null,
    pastSuffix: "ago",
    futureSuffix: "from now",
    seconds: "less than a minute",
    minute: "about a minute",
    minutes: "{0} minutes",
    hour: "about an hour",
    hours: "about {0} hours",
    day: "a day",
    days: "{0} days",
    month: "about a month",
    months: "{0} months",
    year: "about a year",
    years: "{0} years",
    ranges : [
        {value: 0, unit: "second"},
        {value: 45, unit: "second", setting : "seconds"},
        {value: 90, unit: "second", setting : "minute"},
        {value: 45, unit: "minute", setting : "minutes"},
        {value: 90, unit: "minute", setting : "hour"},
        {value: 24, unit: "hour", setting : "hours"},
        {value: 42, unit: "hour", setting : "day"},
        {value: 30, unit: "day", setting : "days"},
        {value: 45, unit: "day", setting : "month"},
        {value: 365, unit: "day", setting : "months", divider: 30},
        {value: 1.5, unit: "year", setting : "year"},
        {value: Number.POSITIVE_INFINITY, unit: "year", setting : "years"},
    ]
};

Ext.util.Format.time = function (value) {
    if (!value) {
        return null;
    }
            
    if (!Ext.isDate(value)) {
        value = Ext.Date.parse(value, "c");
               
        if (!value) {
            value = Ext.Date.parse(value, "MS");
        }

        if (!value) {
            value = Ext.Date.parse(value, "time");
        }
    } 

    if (!value) {
        return null;
    }

    var diff = new Date().getTime() - value.getTime(),
        absDiff = Math.abs(diff),
        settings = Ext.util.Format.timeSettings,
        prefix = diff < 0 ? settings.futurePrefix : settings.pastPrefix,
        suffix = diff < 0 ? settings.futureSuffix : settings.pastSuffix,
        multiplier = {
            second : 1000,
            minute : 60000,
            hour : 3600000,
            day : 86400000,
            year : 31536000000
        },
        times = {
            second : absDiff / 1000,
            minute : absDiff / 60000,  // seconds / 60
            hour : absDiff / 3600000,  // minutes / 60
            day : absDiff / 86400000,  // hours / 24
            year : absDiff / 31536000000  // days / 365
        },                               
        i, 
        fn,
        range,                
        value1,
        value2,
        ranges = settings.ranges,
        length = ranges.length;

    for (i = 0; i < length; i++) {
        range = ranges[i];

        if(i < (length-1)){
            value1 = range.value * multiplier[range.unit];
            value2 = ranges[i+1].value * multiplier[ranges[i+1].unit];
                
            if(absDiff >= value1 && absDiff< value2) {
                range = ranges[i+1];
                break;
            }
        }                
    }

    fn = settings[range.setting];
    value1 = Math.round(range.divider ? (times[range.unit] / range.divider) : times[range.unit]);
    value2 = Ext.String.format(Ext.isFunction(fn) ? fn(value1) : fn, value1);

    return [prefix, value2, suffix].join(" ");
};

Ext.define('Ext.form.field.DisplayTime', {
    extend:'Ext.form.field.Display',
    alias: 'widget.displaytimefield',

    autoUpdate : false,
    updateInterval : 60000,

    constructor : function (config) {
        this.date = config.date;

        if (this.date) {
            config.value = this.date;
        }

        this.setValue = Ext.Function.bind(this.setValue, this);

        this.callParent(arguments);

        if(this.autoUpdate) {
            this.startUpdating();
        }
    },

    startUpdating : function (interval) {
        if(interval) {
            this.updateInterval = interval;
        }
        
        this.autoUpdate = true;
        this.timer = setInterval(this.setValue, this.updateInterval);
    },

    stopUpdating : function () {
        this.autoUpdate = false;
        if(this.timer) {
            clearInterval(this.timer);
            delete this.timer;
        }
    },

    setValue : function (date) {
        if(date) {
            this.date = date;
        }
        this.callParent([this.date ? Ext.util.Format.time(this.date) : ""]);
    }
});