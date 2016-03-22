
// @source core/ColorPalette.js

Ext.override(Ext.picker.Color, {
	getColorField : function () {
        if (!this.colorField) {
            this.colorField = new Ext.form.field.Hidden({name : this.id });

			this.on("beforedestroy", function () {
                this.destroy();
            }, this.colorField);
        }
        
        return this.colorField;
    },

    afterRender : function () {
        this.callParent(arguments);
        this.on("select", function (cp, color) {
            this.getColorField().setValue(color);
        });

        if (this.hasId()) {
            this.getColorField().render(this.el.parent() || this.el);
        }
    }
});