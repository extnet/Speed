
// @source core/form/Picker.js

Ext.form.field.Picker.override({
    collapseIf: function(e) { // #554
        var me = this;

        if (!me.destroyed && !e.within(me.bodyEl, false, true) && !me.owns(e.target) && !e.within(me.picker.el, false, true) && !Ext.fly(e.target).isFocusable()) {
            me.collapse();
        }
    },

    setHideBaseTrigger: function (value) {
        if (this.triggers && this.triggers.picker) {
            this.triggers.picker[value ? "hide" : "show"].apply(this.triggers.picker, []);
        }
    },

    applyTriggers: function (triggers) {
        var me = this,
            picker = triggers.picker;

        if (this.hideBaseTrigger) {
            picker.hidden = true;
        }
        
        return me.callParent([triggers]);
    },

    setReadOnly: function (readOnly) {
        this.callParent(arguments);

        if (!readOnly && this.hideBaseTrigger) { // #904
            this.setHideBaseTrigger(true);
        }
    }
});

Ext.form.field.Picker.override({
    config: {
        triggers: {
            picker: {
                weight: 1, // This is added to get the main trigger to be appeared on the right by default.
                handler: 'onTriggerClick',
                scope: 'this'
            }
        }
    }
});