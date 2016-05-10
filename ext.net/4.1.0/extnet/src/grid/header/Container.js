Ext.grid.header.Container.override({
    onHeaderCtEvent: function (e, t) {
        if (e.getTarget('.x-grid-header-widgets', this.el)) {
            return false;
        }

        return this.callParent(arguments);
    },

    afterRender: function () {
        this.callParent(arguments);

        if (this.focusableKeyNav) {
            this._processBinding = this.focusableKeyNav.map.processBinding;
            this.focusableKeyNav.map.processBinding = this.processBinding;
            this.focusableKeyNav.map.ignoreInputFields = true;
        }
    },

    processBinding: function (binding, e) {
        if (e.getTarget('.x-grid-header-widgets', this.el)) {
            return;
        }

        if (this.focusableKeyNav) {
            this._processBinding.apply(this.focusableKeyNav.map, arguments);
        }
    }
});