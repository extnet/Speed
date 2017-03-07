// @source core/utils/VTypes.js

Ext.apply(Ext.form.VTypes, {
    daterange : function (val, field) {
        var date = field.parseDate(val),
            ct, end, start;

        if (date) {
            if (field.startDateField && (!this.dateRangeMax || (date.getTime() !== this.dateRangeMax.getTime())) && !this.startValidating) {
                ct = field.up('container');
                
                if (ct) {
                    start = ct.down('#' + field.startDateField);
                }

                if (!start) {
                    start = Ext.getCmp(field.startDateField)
                }

                this.dateRangeMax = date;
                start.setMaxValue(date);
                this.startValidating = true;
                start.validate();
                delete this.startValidating;
            } else if (field.endDateField && (!this.dateRangeMin || (date.getTime() !== this.dateRangeMin.getTime())) && !this.endValidating) {
                ct = field.up('container');
                
                if (ct) {
                    end = ct.down('#' + field.endDateField);
                }

                if (!end) {
                    end = Ext.getCmp(field.endDateField);
                }

                this.dateRangeMin = date;
                end.setMinValue(date);
                this.endValidating = true;
                end.validate();
                delete this.endValidating;
            }
        }
        
        /*
        * Always return true since we're only using this vtype to set the
        * min/max allowed values (these are tested for after the vtype test)
        */
        return true;
    },

    daterangeText : 'Start date must be less than end date',

    password : function (val, field) {
        if (field.initialPassField) {
            var pwd = Ext.isString(field.initialPassField) ? (field.up('container') && field.up('container').down('#' + field.initialPassField) || Ext.getCmp(field.initialPassField)) : field.initialPassField;

            if (pwd) {
                if (pwd.processRawValue) {
                    return pwd ? (val === pwd.processRawValue(pwd.getRawValue())) : false;
                }
                else {
                    return pwd ? (val === pwd.getRawValue()) : false;
                }
            }

            return false;            
        }

        return true;
    },

    passwordText : "Passwords do not match",

    ipRegExp : /^([1-9][0-9]{0,1}|1[013-9][0-9]|12[0-689]|2[01][0-9]|22[0-3])([.]([1-9]{0,1}[0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){2}[.]([1-9][0-9]{0,1}|1[0-9]{2}|2[0-4][0-9]|25[0-4])$/,

    ip : function (val, field) {
        return Ext.form.VTypes.ipRegExp.test(val);
    },

    ipText : "Invalid IP Address format"
});