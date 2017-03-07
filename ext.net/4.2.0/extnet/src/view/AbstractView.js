Ext.view.AbstractView.override({
    // #1330: many Ext.NET code relies on the "view" first argument being passed to "beforeitemupdate" handlers,
    // but ExtJS doesn't pass the "view" argument. This overrides fixes it.
    fireEvent: function() {
        if (arguments.length >= 2 && arguments[0] === "beforeitemupdate" && !(arguments[1] instanceof Ext.view.AbstractView)) {
            arguments = Ext.Array.insert(Array.prototype.slice.call(arguments), 1, [this]);
        }

        return this.callParent(arguments); // The original fix for #1330 missed "return"
    },

    onRemove: function (ds, records, index) {
        var i;

        for (i = records.length - 1; i >= 0; --i) {
            this.fireEvent('beforeitemremove', this, records[i], index + i);
        }

        this.callParent(arguments);
    }
});