
// @source core/DatePicker.js

Ext.picker.Date.override({
    initComponent: function () {
        this.callParent(arguments);

        this.on("render", this.onDateSelect, this, { single: true });
        this.on("select", this.onDateSelect, this);
    },

    onDateSelect: function () {
        this.getInputField().setValue(Ext.Date.dateFormat(this.getValue(), "Y-m-d\\Th:i:s"));
    },

    onRender: function () {
        this.callParent(arguments);

        if (this.hasId()) {
            this.getInputField().render(this.el.parent() || this.el);
        }
    },

    getInputField: function () {
        if (!this.inputField) {
            this.inputField = new Ext.form.field.Hidden({
                name: this.id
            });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.inputField);
        }

        return this.inputField;
    },

    createMonthPicker: function () {
        var me = this,
            picker = me.monthPicker,
            pickerConfig;

        if (!picker) {
            pickerConfig = {
                renderTo: me.el,
                ownerCmp: me,
                floating: true,
                padding: me.padding,
                shadow: false,
                small: me.showToday === false,
                listeners: {
                    scope: me,
                    cancelclick: me.onCancelClick,
                    okclick: me.onOkClick,
                    yeardblclick: me.onOkClick,
                    monthdblclick: me.onOkClick
                }
            };

            if (me.monthPickerOptions) {
                Ext.apply(pickerConfig, me.monthPickerOptions);
            }

            me.monthPicker = picker = Ext.create('Ext.picker.Month', pickerConfig);

            if (!me.disableAnim) {
                // hide the element if we're animating to prevent an initial flicker
                picker.el.setStyle('display', 'none');
            }

            picker.hide();
            me.on('beforehide', me.doHideMonthPicker, me);
        }

        return picker;
    }
});