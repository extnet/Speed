// @source src/view/DropZone.js

Ext.view.DropZone.override({
    getPosition: function (e, node) {
        var regionEl = Ext.get(node);

        if (regionEl.down("td.x-group-hd-container")) {
            regionEl = regionEl.down("tr.x-grid-row");
        }

        return this.callParent([e, regionEl]);
    },

    positionIndicator: function (node, data, e) {
        var me = this,
            view = me.view,
            pos = me.getPosition(e, node),
            overRecord = view.getRecord(node);

        if (me.overRecord != overRecord || me.currentPosition != pos) {
            node = Ext.get(node);

            if (node.down("td.x-group-hd-container")) {
                node = node.down("tr.x-grid-row");
            }
        }

        this.callParent([node, data, e]);
    }
});