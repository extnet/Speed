
// @source grid/plugin/HeaderResizer.js

Ext.grid.plugin.HeaderResizer.override({
    afterHeaderRender: function () {
        this.callParent(arguments);

        this.tracker.on("beforedragstart", function (tracker, e) {
            return !e.getTarget('.x-grid-header-widgets', this.headerCt.el);
        }, this);
    }
});