
// @source core/form/DateField.js

Ext.form.field.Date.override({
    initComponent: function () {
        if (this.vtype === "daterange") {
            this.enableKeyEvents = true;
            this.on("keyup", this.updateDateRange);
        }

        this.callParent(arguments);
    },

    updateDateRange: function (item, event) {
        var me = this,
            v = me.getValue(),
            field;

        if (me.startDateField) {
            field = Ext.getCmp(me.startDateField);
            field.setMaxValue(v);
            me.dateRangeMax = v;
        } else if (me.endDateField) {
            field = Ext.getCmp(me.endDateField);
            field.setMinValue(v);
            me.dateRangeMin = v;
        }

        field.validate();
    },

    createPicker : function () {
        var me = this,
            isMonth = this.type == "month",
            format = Ext.String.format,
            pickerConfig,
            monthPickerOptions;

        if (me.okText) {
            monthPickerOptions = monthPickerOptions || {};
            monthPickerOptions.okText = me.okText;
        }

        if (me.cancelText) {
            monthPickerOptions = monthPickerOptions || {};
            monthPickerOptions.cancelText = me.cancelText;
        }

        if (isMonth) {
            pickerConfig = {
                ownerCmp: me,
                floating: true,
                hidden: true,
                small:true,
                listeners: {
                    scope: me,
                    cancelclick: me.collapse,
                    okclick: me.onMonthSelect,
                    yeardblclick: me.onMonthSelect,
                    monthdblclick: me.onMonthSelect
                },
                keyNavConfig: {
                    esc : function () {
                        me.collapse();
                    }
                }
            };

            if (Ext.isWebKit) { // #668
                pickerConfig.listeners.show = {
                    fn: function() {
                        this.picker.el.on("mousedown", function(e) {
                            e.stopEvent();
                        });
                    },
                    single: true
                }
            }

            if (me.pickerOptions) {
	            Ext.apply(pickerConfig, me.pickerOptions, monthPickerOptions || {});
            }        

            return Ext.create('Ext.picker.Month', pickerConfig);
        }        

        pickerConfig = {
            pickerField: me,
            monthPickerOptions : monthPickerOptions,            
            floating: true,
            preventRefocus: true,
            hidden: true,            
            minDate: me.minValue,
            maxDate: me.maxValue,
            disabledDatesRE: me.disabledDatesRE,
            disabledDatesText: me.disabledDatesText,
            ariaDisabledDatesText: me.ariaDisabledDatesText,
            disabledDays: me.disabledDays,
            disabledDaysText: me.disabledDaysText,
            ariaDisabledDaysText: me.ariaDisabledDaysText,
            format: me.format,
            showToday: me.showToday,
            startDay: me.startDay,
            minText: format(me.minText, me.formatDate(me.minValue)),
            ariaMinText: format(me.ariaMinText, me.formatDate(me.minValue, me.ariaFormat)),
            maxText: format(me.maxText, me.formatDate(me.maxValue)),
            ariaMaxText: format(me.ariaMaxText, me.formatDate(me.maxValue, me.ariaFormat)),
            listeners: {
                scope: me,
                select: me.onSelect,
                tabout: me.onTabOut
            },
            keyNavConfig: {
                esc: function () {
                    me.inputEl.focus();
                    me.collapse();
                }
            }
        };

        if (me.pickerOptions) {
	        Ext.apply(pickerConfig, me.pickerOptions);
        }        
        
        return Ext.create('Ext.picker.Date', pickerConfig);
    },

    onMonthSelect : function (picker, value) {
        var me = this;

        var me = this,
            month = value[0],
            year = value[1],
            date = new Date(year, month, 1);

        if (date.getMonth() !== month) {
            date = new Date(year, month, 1).getLastDateOfMonth();
        }
        
        me.setValue(date);
        me.fireEvent('select', me, date);
        me.collapse();
    }
});