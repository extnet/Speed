Ext.resizer.Splitter.override({
    getCollapseTarget: function () {
        var me = this;

        if (me.collapseTarget != "prev" && me.collapseTarget != "next" && Ext.isString(me.collapseTarget)) {
           var cmp = Ext.net.ResourceMgr.getCmp(me.collapseTarget);
           if (cmp) {
               me.collapseTarget = cmp;
           }
        }

        return this.callParent(arguments);
    }
});

Ext.resizer.SplitterTracker.override({
    // #898
    createDragOverlay: function () {
        this.callParent(arguments);
        this.overlay.setStyle({
            cursor: this.el.getStyle("cursor")
        });
    }
});