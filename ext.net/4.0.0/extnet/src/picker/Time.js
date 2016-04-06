
// @source core/DatePicker.js

Ext.picker.Time.override({
    initComponent : function () {
        this.callParent(arguments);

        this.mon(this.getSelectionModel(), {
            selectionchange: this.onTimeSelect,
            scope : this
        });
    
        this.on("render", this.onTimeSelect, this, {single: true});
    },

    onTimeSelect: function (list, recordArray) { 
        var record = recordArray ? recordArray[0] : this.getSelectionModel().getSelection()[0],
            val = record ? record.get('disp') : "";

        this.getInputField().setValue(val); 
    },

    onRender : function (el) {
        this.callParent(arguments);

        if (this.hasId()) {
            this.getInputField().render(this.el.parent() || this.el);    
        }
    },
    
    getInputField : function () {
        if (!this.inputField) {
            this.inputField = new Ext.form.field.Hidden({                 
                name : this.id
            });

			this.on("beforedestroy", function () {
                this.destroy();
            }, this.inputField);
        }
        
        return this.inputField;
    },

    afterRender : function () { 
        this.callParent(arguments);

        if (this.value) {
            this.setValue(this.value);
        }
    },

    safeParse : function (value, format) {
        var me = this,            
            parsedDate,
            result = null,
            initDate = '1/1/2008',
            initDateFormat = 'j/n/Y';

        if (Ext.Date.formatContainsDateInfo(format)) {
            result = Ext.Date.parse(value, format);
        } else {
            parsedDate = Ext.Date.parse(initDate + ' ' + value, initDateFormat + ' ' + format);
            if (parsedDate) {
                result = parsedDate;
            }
        }
        return result;
    },

    setValue : function (value) {
        if (!this.rendered) {
            this.valueOf = value;
            return;
        }
        
        var d,
            initDate = '1/1/2008',
            selModel,
            itemNode,
            lastSelected;

        if (Ext.isString(value)) {
            d = this.safeParse(value, this.format);
        }
        else if (Ext.isDate(value)) {
            d = value;
        }

        if (d) {
            value = Ext.Date.clearTime(new Date(initDate));
            value.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
            value = value.getTime();

            selModel = this.getSelectionModel();

            selModel.select(this.store.getAt(this.store.findBy(function (record) {
                  var date = record.get('date');
                  return date && date.getTime() == value;
            })));
            
            lastSelected = selModel.lastSelected;
            itemNode = this.getNode(lastSelected);
            if (itemNode) {
                this.highlightItem(itemNode);
                itemNode.scrollIntoView(this.el, false);
            }
        }
    },

    getValue : function () {
        var records = this.getSelectionModel().getSelection();

        if (records && records.length > 0) {
            return records[0].get('date');
        }

        return null;
    },

    getText : function () {
        var records = this.getSelectionModel().getSelection();

        if (records && records.length > 0) {
            return records[0].get('disp');
        }

        return "";
    }
});