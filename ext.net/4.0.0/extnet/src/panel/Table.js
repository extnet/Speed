Ext.panel.Table.override({
    processEvent: function (type, view, cell, recordIndex, cellIndex, e, record, row) {
        if (this.ignoreTargets) {
            var i;

            for (i = 0; i < this.ignoreTargets.length; i++) {
                if (e.getTarget(this.ignoreTargets[i])) {
                    return false;
                }
            }
        }

        return this.callParent(arguments);
    },

    beforeDestroy: function () {
        if (this.editors) {
            Ext.destroy(this.editors);
        }

        this.callParent(arguments);
    },

    hasLockedColumns: function (columns) {
        var i,
            len,
            column;

        if (columns && columns.isRootHeader) {
            columns = columns.items.items;
        } else if (Ext.isObject(columns)) {
            columns = columns.items;
        }

        for (i = 0, len = columns ? columns.length : 0; i < len; i++) {
            column = columns[i];
            if (!column.processed && column.locked) {
                return true;
            }
        }
    },

    insertColumn: function (index, newCol, updateLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt;

        if (index < 0) {
            index = 0;
        }

        if (newCol.locked && this.lockedGrid) {
            headerCt = this.lockedGrid.headerCt;
        }

        headerCt.insert(index, newCol);

        if (updateLayout !== false) {
            this.updateLayout();
            this.fireEvent('reconfigure', this, null, null);
            this.getView().refresh();
        }
    },

    addColumn: function (newCol, updateLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt;

        if (newCol.locked && this.lockedGrid) {
            headerCt = this.lockedGrid.headerCt;
        }

        this.insertColumn(headerCt.getColumnCount(), newCol, updateLayout);
    },

    removeColumn: function (index, updateLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt,
            column,
            locked = false;

        column = headerCt.getComponent(index);

        if (!column && this.lockedGrid) {
            headerCt = this.lockedGrid.headerCt;
            column = headerCt.getComponent(index);
            locked = true;
        }

        if (column) {
            headerCt.remove(column);

            if (updateLayout !== false) {
                if (locked) {
                    this.syncLockedWidth();
                    this.lockedGrid.getView().refresh();
                }

                this.updateLayout();
                this.fireEvent('reconfigure', this, null, null);
                this.getView().refresh();
            }
        }
    },

    removeAllColumns: function (updateLayout) {
        var headerCt = this.normalGrid ? this.normalGrid.headerCt : this.headerCt;

        headerCt.removeAll();

        if (this.lockedGrid) {
            this.lockedGrid.headerCt.removeAll();
        }

        if (updateLayout !== false) {
            this.updateLayout();
            this.fireEvent('reconfigure', this, null, null);
            this.getView().refresh();
        }
    },

    // #871
    setHideHeaders: function (hideHeaders) {
        var headerCt;

        if (this.lockedGrid) {
            this.lockedGrid.setHideHeaders(hideHeaders);
            this.normalGrid.setHideHeaders(hideHeaders);

            return;
        }

        if (this.rendered) {
            headerCt = this.getView().headerCt;

            if (hideHeaders) {
                headerCt.setHeight(0);
                headerCt.addCls(this.hiddenHeaderCtCls);
                this.addCls(this.hiddenHeaderCls);
                headerCt.hiddenHeaders = true;
            } else {
                headerCt.setHeight("auto");
                headerCt.removeCls(this.hiddenHeaderCtCls);
                this.removeCls(this.hiddenHeaderCls);
                headerCt.hiddenHeaders = false;
            }
        } else {
            this.hideHeaders = hideHeaders;
        }
    },

    // #902
    updateSelection: function (selection) {
        var me = this,
            sm;

        if (!me.ignoreNextSelection) {
            me.ignoreNextSelection = true;
            sm = me.getSelectionModel();

            if (selection || selection === 0) { // #902
                sm.select(selection);
            } else {
                sm.deselectAll();
            }

            me.ignoreNextSelection = false;
        }
    }
});