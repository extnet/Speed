
// @source src/grid/filter/List.js

Ext.grid.filters.filter.List.override({
    setValue: function(value) { // The GitHub issue #542
        if (arguments.length === 1) {
            this.filter.setValue(value);

            if (this.active) {
                this.updateStoreFilter();
            } else {
                this.setActive(!!value);
            }
        } else {
            this.callParent(arguments);
        }
    },

    // This method has been introduced by Ext.NET for convenience.
    updateOptions: function (options) {
        var me = this,
            store = this.store;

        this.options = options;
        if (this.menu && store) {
            var data = [],
                i,
                len = options.length;

            for (i = 0; i < len; i++) {
                data.push([options[i], options[i]]);
            }

            this.store.loadData(data);
            this.createMenuItems(store);
        }
    }
});