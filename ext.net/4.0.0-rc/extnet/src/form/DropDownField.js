// @source core/form/DropDownField.js

Ext.define("Ext.net.DropDownField", {
    extend: "Ext.form.field.Picker",
    alias: "widget.netdropdown",
    mode: "text",
    includeHiddenStateToSubmitData: false,
    triggerCls: Ext.baseCSSPrefix + 'form-arrow-trigger',

    syncValue: Ext.emptyFn,

    initComponent: function () {
        this.useHiddenField = this.mode !== "text";
        this.callParent();
    },

    getHiddenStateName: function () {
        return this.valueHiddenName || (this.getName() + "_value");
    },

    getHiddenState: function (value) {
        return this.getValue();
    },

    initValue: function () {
        if (!Ext.isEmpty(this.text)) {
            this.originalValue = this.lastValue = this.value;
            this.suspendCheckChange++;
            this.setValue(this.value ? this.value : (this.mode === "text" ? this.text : ""), this.text, false);
            this.suspendCheckChange--;
        }
        else {
            this.callParent();
        }

        this.originalText = this.getText();
    },

    collapseIf: function (e) {
        var me = this;
        if (this.allowBlur !== true && !me.destroyed && !e.within(me.bodyEl, false, true) && !me.owns(e.target) && !e.within(me.picker.el, false, true)) {
            me.collapse();
        }
    },

    initEvents: function () {
        this.callParent(arguments);

        this.keyNav.map.addBinding({
            scope: this,
            key: Ext.util.KeyNav.keyOptions["tab"],
            handler: Ext.Function.bind(this.keyNav.handleEvent, this, [function (e) {
                this.collapse();
                return true;
            }, this.keyNav], true),
            defaultEventAction: this.keyNav.defaultEventAction
        });
    },

    createPicker: function () {
        if (this.component && !this.component.render) {
            this.component = new Ext.ComponentManager.create(Ext.apply(this.component, {
                renderTo: Ext.net.getEl(this.componentRenderTo) || Ext.net.ResourceMgr.getAspForm() || document.body,
                dropDownField: this,
                hidden: true,
                floating: true
            }), "panel");

            if (this.component.rendered) {
                this.syncValue(this.getValue(), this.getText());
            } else {
                this.mon(this.component, "afterrender", function () {
                    this.syncValue(this.getValue(), this.getText());
                }, this);
            }
        }

        return this.component;
    },

    onSyncValue: function (value, text) {
        if (this.component && this.component.rendered) {
            this.syncValue(value, text);
        }
    },

    setValue: function (value, text, collapse, preventSync) {

        if (this.mode === "text") {
            collapse = text;
            text = value;
        }

        this._value = value;

        this.callParent([text]);

        if (preventSync === false || ((preventSync == null || !Ext.isDefined(preventSync)) && !this.isExpanded)) {
            this.onSyncValue(value, text);
        }

        if (collapse !== false) {
            this.collapse();
        }

        return this;
    },

    getText: function () {
        return Ext.net.DropDownField.superclass.getValue.call(this);
    },

    getValue: function () {
        return this.mode == "text" ? this.callParent() : this._value;
    },

    reset: function () {
        this.setValue(this.originalValue, this.originalText, false);
        this.clearInvalid();
        delete this.wasValid;
        this.applyEmptyText();
    },

    clearValue: function () {
        this.setValue("", "", false);
        this.clearInvalid();
        delete this.wasValid;
        this.applyEmptyText();
    },

    checkChange: function () {
        if (!this.suspendCheckChange) {
            var me = this,
                newVal = me.getValue(),
                rawValue = me.getRawValue(),
                oldVal = me.lastValue,
                oldRawVal = me.lastRawValue;

            if (!me.isEqual(newVal, oldVal) && !me.destroyed) {
                me.lastValue = newVal;
                me.lastRawValue = rawValue;

                me.fireEvent('change', me, newVal, oldVal);
                me.onChange(newVal, oldVal);
            } else if (!me.isEqual(rawValue, oldRawVal) && !me.destroyed) {
                me.lastRawValue = rawValue;
                me.fireEvent('change', me, newVal, oldVal);
                me.onChange(newVal, oldVal);
            }
        }
    }
});