Ext.tree.View.override({
    initComponent: function() { 
        this.callParent(arguments);

        if (this.toggleOnClick) {
            this.toggleOnDblClick = false;
        }
    },

    getChecked: function () {
        var checked = [],
            node  = this.node || (this.getStore().getRootNode());
        if (node) {
            node.cascadeBy(function (rec) {
                if (rec.get('checked')) {
                    checked.push(rec);
                }
            });
        }
        return checked;
    },

    onItemClick: function(record, item, index, e) {
        var me = this,
            editingPlugin = me.editingPlugin,
            parent = this.callParent(arguments); 

        if (me.toggleOnClick && record.isExpandable() && !e.getTarget(this.expanderSelector, item) && !(editingPlugin && editingPlugin.clicksToEdit === 1)) {
            me.toggle(record);
        } 

        return parent;
    }
});