
// @source core/form/CheckboxGroup.js

Ext.form.CheckboxGroup.override({
    invalidCls: Ext.baseCSSPrefix + 'form-invalid'
});

Ext.form.CheckboxGroup.override({
    onRender: function (ct, position) {
        this.callParent(arguments);

        if (this.fireChangeOnLoad) {
            var checked = false;

            this.eachBox(function (item) {
                if (item.checked) {
                    checked = true;
                    return false;
                }
            });

            if (checked) {
                this.checkChange();
            }
        }
    }
});