
// @source picker/MonthPicker.js

Ext.picker.Month.override({
    initComponent: function () {
        this.callParent(arguments);

        this.on("render", this.onDateSelect, this, {single:true});
        this.on("select", this.onDateSelect, this);
    },

    onDateSelect: function () {
        this.getInputField().setValue(Ext.encode(this.getValue()));
    },

    onRender: function () {
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
    }
});