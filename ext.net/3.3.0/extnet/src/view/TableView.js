
Ext.view.Table.override({
    processUIEvent: function (e) {
        if (this.stopEventFn && this.stopEventFn(this, e) === false) {
            return false;
        }

        return this.callParent(arguments);
    },

    getFeature: function(id) {
        var f = this.callParent(arguments);

        if (!f) {
            var features = this.featuresMC;
            if (features) {
                return features.getAt(features.findIndex("proxyId", id));
            }
        }

        return f;
    },

    // Overridden because of #931 only
    processItemEvent: function (record, item, rowIndex, e) {
        var ret = this.callParent(arguments),
            x, columns, len, column, b;

        if (e.type === "mousedown" && !e.position.cellElement) {
            // A mousedown outside a cell
            x = e.getX();
            columns = this.getVisibleColumnManager().getColumns();
            len = columns.length;

            for (i = 0; i < len; i++) {
                column = columns[i];
                b = columns[i].getBox();

                if (x >= b.left && x < b.right) {
                    e.position.column = columns[i];
                    e.position.colIdx = i;

                    return ret;
                }
            }
        }

        return ret;
    }
});