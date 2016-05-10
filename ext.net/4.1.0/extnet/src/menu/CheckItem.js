
// @source core/menu/CheckItem.js

Ext.menu.CheckItem.override({
    onRender: function () {
        this.callParent(arguments);

        if (this.hasId()) {
            this.getCheckedField().render(Ext.net.ResourceMgr.getAspForm() || this.el.parent() || this.el);
        }
    },

    getCheckedField : function () {
        if (!this.checkedField) {
            this.checkedField = new Ext.form.field.Hidden({                
                name : this.id 
            });

			this.on("beforedestroy", function () {
                this.destroy();
            }, this.checkedField);	

            this.on("checkchange", function (item, checked) {
                this.getCheckedField().setValue(checked);
            }, this);
        }
        
        return this.checkedField;
    }
});