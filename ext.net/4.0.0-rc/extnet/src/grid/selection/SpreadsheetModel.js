// @source src/grid/selection/SpreadsheetModel.js

Ext.grid.selection.SpreadsheetModel.override({
    // Defined in Ext.NET for better API
    getColumnByConfig: function (config) {
        var column;

        if (config instanceof Ext.grid.column.Column) {
            column = config;
        } else if (Ext.isNumber(config) || Ext.isString(config)) {
            column = this.view.headerCt.getComponent(config);
        } else if (Ext.isObject(config)) {
            if (!Ext.isEmpty(config.columnID)) {
                column = this.view.headerCt.getComponent(config.columnID);
            } else if (!Ext.isEmpty(config.columnIndex)) {
                column = this.view.headerCt.getComponent(config.columnIndex);;
            } else if (!Ext.isEmpty(config.columnDataIndex)) {
                column = this.view.headerCt.down("gridcolumn[dataIndex=" + config.columnDataIndex + "]");
            }
        }

        return column;
    },

    // Defined in Ext.NET for better API
    parseRow: function (row) {
        var store = this.store,
            ret;

        if (row.isEntity) {
            ret = row;
        } else if (Ext.isNumber(row)) {
            ret = store.getAt(row) || store.getById(row);
        } else if (!Ext.isEmpty(row.recordID)) {
            ret = store.getById(row.recordID);
        } else if (!Ext.isEmpty(row.rowIndex)) {
            ret = store.getAt(row.rowIndex);
        } else {
            ret = store.getById(row);
        }

        return ret;
    },

    // Defined in Ext.NET for better API
    parseRows: function (rows) {
        var ret, i, len;

        if (Ext.isArray(rows)) {
            ret = [];

            for (i = 0, len = rows.length; i < len; i++) {
                ret.push(this.parseRow(rows[i]));
            }
        } else {
            ret = this.parseRow(rows);
        }

        return ret;
    },

    deselect: function (records, suppressEvent) {
        records = this.parseRows(records); // Defined in Ext.NET for better API

        // Overridden because of #1270
        var me = this,
            sel = me.selected,
            store = me.view.dataSource,
            len,
            i,
            record,
            changed = false;

        if (sel && sel.isRows) {
            if (!Ext.isArray(records)) {
                records = [records];
            }

            len = records.length;

            for (i = 0; i < len; i++) {
                record = records[i];

                if (typeof record === 'number') {
                    record = store.getAt(record);
                }

                if (sel.remove(record)) { // Here is the fix for #1270
                    changed = true;
                }
            }
        }

        if (changed) {
            me.updateHeaderState();

            if (!suppressEvent) {
                me.fireSelectionChange();
            }
        }
    },

    // Overridden in Ext.NET for better API
    deselectColumn: function (column) {
        arguments[0] = this.getColumnByConfig(column);
        this.callParent(arguments);
    },

    // Overridden in Ext.NET for better API
    selectCells: function (rangeStart, rangeEnd) {
        if (Ext.isObject(rangeStart) && Ext.isObject(rangeEnd)) {
            arguments[0] = Ext.grid.plugin.SelectionSubmit.getCellContext(this.view, rangeStart);
            arguments[1] = Ext.grid.plugin.SelectionSubmit.getCellContext(this.view, rangeEnd);
        }

        this.callParent(arguments);
    },

    // Overridden in Ext.NET for better API
    selectColumn: function (column) {
        arguments[0] = this.getColumnByConfig(column);
        this.callParent(arguments);
    },

    // Overridden in Ext.NET for better API
    selectRows: function (rows) {
        arguments[0] = this.parseRows(rows);
        this.callParent(arguments);
    },

    // Defined in Ext.NET for submitting selected data
    getSubmitData: function (config) {
        var config = config || {},
            selectedData = this.getSelected(),
            grid = this.view.panel,
            i, selectedColumns, selectedRecords,
            startCell, endCell,
            startColIdx, endColIdx,
            startRowIdx, endRowIdx;

        if (!selectedData) {
            return [];
        }

        if (!Ext.isDefined(config.excludeId)) {
            config.excludeId = false;
        }

        if (selectedData.isRows) {
            values = grid.getRowsValues({
                selectedOnly: true,
                excludeId: config.excludeId
            });
        } else if (selectedData.isColumns) {
            values = grid.getRowsValues({
                filterField: Ext.bind(this.filterFieldBySelectedColumns, { selectedColumns: selectedData.selectedColumns }),
                excludeId: config.excludeId
            });
        } else if (selectedData.isCells) {
            startCell = selectedData.startCell;
            endCell = selectedData.endCell;
            selectedColumns = this.view.headerCt.getVisibleGridColumns();
            startColIdx = startCell.colIdx,
            endColIdx = endCell.colIdx;

            if (startColIdx > endColIdx) { // The range can be selected from right to left
                endColIdx = startColIdx;
                startColIdx = endCell.colIdx;
            }

            selectedColumns = Ext.Array.slice(selectedColumns, startColIdx, endColIdx + 1);

            startRowIdx = startCell.rowIdx,
            endRowIdx = endCell.rowIdx;

            if (startRowIdx > endRowIdx) { // The range can be selected from bottom to top
                endRowIdx = startRowIdx;
                startRowIdx = endCell.rowIdx;
            }

            selectedRecords = this.view.store.getRange(startRowIdx, endRowIdx);

            values = grid.getRowsValues({
                filterField: Ext.bind(this.filterFieldBySelectedColumns, { selectedColumns: selectedColumns }),
                filterRecord: function (record) {
                    return selectedRecords.indexOf(record) > -1;
                },
                excludeId: config.excludeId
            });
        }

        return values;
    },

    // Defined in Ext.NET
    filterFieldBySelectedColumns: function (record, fieldName, value) {
        var include = false;

        for (i = 0; i < this.selectedColumns.length; i++) {
            if (this.selectedColumns[i].dataIndex === fieldName) {
                include = true;
                break;
            }
        }

        return include;
    }
});