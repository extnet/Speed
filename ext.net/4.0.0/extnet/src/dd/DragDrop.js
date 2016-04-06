
// @source core/dd/DragDrop.js

Ext.dd.DragDrop.override({
    applyConfig: function() {
        var me = this;

        me.callParent();

        if (me.dragDropGroups) {
            Ext.Object.each(me.dragDropGroups, function (key, value, groups) {
                if (value) {
                    me.addToGroup(key);
                }
            });

            delete me.dragDropGroups;
            me.removeFromGroup("default");
        }
    }
});