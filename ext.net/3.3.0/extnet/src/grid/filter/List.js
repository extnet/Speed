
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

    destroy: function() { // Overriden because of #689
        var me = this,
            store = me.store,
            autoStore = me.autoStore,
            gridStoreListeners = me.gridStoreListeners;

        if (store && !Ext.isString(store)) {
            if (autoStore || store.autoDestroy) {
                store.destroy();
            } else {
                store.un('load', me.bindMenuStore, me);
            }

            me.store = null;
        }

        if (me.inferOptionsFromGridStore) {
            me.grid.un('reconfigure', me.onReconfigure, me);
        }

        if (autoStore) {
            me.getGridStore().un(gridStoreListeners);
            me.gridStoreListeners = null;
        }

        me.callSuper();
    }
});