
// @source core/form/Display.js

Ext.form.field.Display.override({
    initComponent: function () {
        if (!this.value && this.html) {
            this.value = this.html;
        }
 
        this.callParent(arguments);
    },

    getDisplayValue: function () {
        var me = this,
            value = this.getRawValue(),
            display;

        if (Ext.isEmpty(value) && !Ext.isEmpty(me.emptyText)) {
             display = me.emptyText;
        }
        else if (me.format) {
             display = Ext.net.StringUtils.format(me.format, value);
        }
        else if (me.renderer) {
             display = me.renderer.call(me.scope || me, value, me);
        } else {
             display = me.htmlEncode ? Ext.util.Format.htmlEncode(value) : value;
        }
        return display;
    },
    
    // Appends the specified string and a new line to the DisplayField's value.
    // Options:
    //      text - a string to append.
    appendLine : function (text) {
        this.append(text + "<br/>");
    }
});