
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

    updateOptions : function (options) { // The method has been added in Ext.NET
        if (this.menu && this.menu.store) {
            var data = [],
                i,
                len = options.length;

            for (i = 0; i < len; i++) {
                data.push([ options[i], options[i] ]);
            }
        
            this.menu.store.loadData(data);
            this.createMenuItems(this.menu.store);
        } else {
            this.options = options;
        }
    },

    destroy: function () {
        if (Ext.isString(this.store)) { // #689
            this.store = Ext.StoreMgr.lookup(this.store);
        }

        this.callParent(arguments);
    }
});