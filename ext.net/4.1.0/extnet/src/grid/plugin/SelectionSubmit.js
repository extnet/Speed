
// @source grid/plugin/SelectionSubmit.js

Ext.define('Ext.grid.plugin.SelectionSubmit', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.selectionsubmit',
    lockableScope: 'normal',

    statics: {
        getCellContext: function (view, cellConfig) {
            var record,
                column;

            if (cellConfig.isCellContext) {
                return cellConfig;
            }

            if (!Ext.isEmpty(cellConfig.rowIndex)) {
                record = view.panel.store.getAt(cellConfig.rowIndex);
            } else if (!Ext.isEmpty(cellConfig.recordID)) {
                record = view.panel.store.indexOfId(cellConfig.recordID);
            }

            if (!Ext.isEmpty(cellConfig.columnID)) {
                column = view.headerCt.getComponent(cellConfig.columnID);
            } else if (!Ext.isEmpty(cellConfig.columnIndex)) {
                column = view.headerCt.getComponent(cellConfig.columnIndex);
            } else if (!Ext.isEmpty(cellConfig.columnDataIndex)) {
                column = view.headerCt.down("gridcolumn[dataIndex=" + cellConfig.columnDataIndex + "]");
            }

            return new Ext.grid.CellContext(view).setPosition(record, column);
        }
    },

    init: function (grid) {
        if (grid.getSelectionSubmit
            // Locking grids with SpreadsheetModel are supported by SelectionSubmit
            || (grid.isLocked && !(grid.getSelectionModel() instanceof Ext.grid.selection.SpreadsheetModel))) {
            return;
        }

        this.grid = grid;
        this.isTree = this.grid.isTree;
        this.headerCt = this.grid.normalGrid ? this.grid.normalGrid.headerCt : this.grid.headerCt;
        this.store = grid.store;
        this.selModel = this.grid.getSelectionModel();
        var me = this;

        this.grid.getSelectionSubmit = function () {
            return me;
        };

        this.initSelection();
    },

    initSelection: function () {
        var sm = this.grid.getSelectionModel();
        this.hField = this.getSelectionModelField();

        if (sm instanceof Ext.grid.selection.SpreadsheetModel) {
            (this.grid.ownerGrid || this.grid).on("selectionchange", this.updateSelection, this, { buffer: 10 });
        } else {
            sm.on("selectionchange", this.updateSelection, this, { buffer: 10 });
        }

        this.store.on("add", this.updateSelection, this, { buffer: 1 });
        this.store.on("remove", this.updateSelection, this, { buffer: 1 });

        this.grid.getView().on("viewready", this.renderHiddenField, this);
        this.store.on("clear", this.clearField, this);
    },

    renderHiddenField: function () {
        if (this.grid.selectionSubmit && this.grid.getSelectionModel().proxyId) {
            this.getSelectionModelField().render(this.grid.el.parent() || this.grid.el);
        }
        this.initSelectionData();
    },

    clearField: function () {
        this.getSelectionModelField().setValue("");
    },

    getSelectionModelField: function () {
        if (!this.hField) {
            var id = this.selModel.hiddenName || this.selModel.proxyId || this.selModel.id;
            this.hField = new Ext.form.field.Hidden({ name: id });
        }

        return this.hField;
    },

    destroy: function () {
        if (this.hField) {
            this.hField.destroy();

            if (!this.isTree) {
                this.store.un("load", this.doSelection, this);
            }
        }

        if (this.grid && !this.grid.lockable && this.grid.selModel) {
            var sm = this.grid.getSelectionModel();

            if (sm) {
                if (sm instanceof Ext.grid.selection.SpreadsheetModel) {
                    (sm.grid.ownerGrid || sm.grid).un("selectionchange", this.updateSelection, this);
                } else {
                    sm.un("selectionchange", this.updateSelection, this);
                }
            }

            this.store.un("add", this.updateSelection, this);
            this.store.un("remove", this.updateSelection, this);

            this.grid.getView().un("viewready", this.renderHiddenField, this);
            this.store.un("clear", this.clearField, this);
        }
    },

    doSelection: function () {
        var grid = this.grid,
            cm = this.headerCt,
            store = this.grid.store,
            selModel = grid.getSelectionModel(),
            data = selModel.selectedData,
            notFoundRecords = [],
            records = [];

        if (!Ext.isEmpty(data)) {
            selModel.suspendChanges();
            if (selModel instanceof Ext.selection.CellModel) {
                selModel.setPosition(Ext.grid.plugin.SelectionSubmit.getCellContext(this.headerCt.view, data));
            } else if (selModel instanceof Ext.selection.RowModel) {
                var sMemory = grid.getSelectionMemory && grid.getSelectionMemory(),
                    record;

                for (var i = 0; i < data.length; i++) {
                    if (!Ext.isEmpty(data[i].recordID)) {
                        record = store.getById(data[i].recordID);

                        if (!record && Ext.isNumeric(data[i].recordID)) {
                            record = store.getById(parseInt(data[i].recordID, 10));
                        }

                        if (sMemory) {
                            var idx = data[i].rowIndex || -1;

                            if (!Ext.isEmpty(record)) {
                                idx = this.store.indexOfId(record.getId());
                                idx = sMemory.getAbsoluteIndex(idx);

                                if (idx < 0) {
                                    record = null;
                                }
                            }

                            sMemory.onMemorySelectId(null, idx, data[i].recordID);
                        }
                    } else if (!Ext.isEmpty(data[i].rowIndex)) {
                        record = this.isTree ? store.getRootNode().getChildAt(data[i].rowIndex) : store.getAt(data[i].rowIndex);

                        if (sMemory && !Ext.isEmpty(record)) {
                            sMemory.onMemorySelectId(null, data[i].rowIndex, record.getId());
                        }
                    }

                    if (!Ext.isEmpty(record)) {
                        records.push(record);
                    }
                    else if (this.isTree) {
                        notFoundRecords.push(data[i]);
                    }
                }
                if (records.length == 0) {
                    selModel.deselectAll();
                }
                else {
                    selModel.select(records, false, !this.grid.selectionMemoryEvents);
                }
            } else if (selModel instanceof Ext.grid.selection.SpreadsheetModel) {
                this.doSpreadsheetSelection();
                return;
            }

            this.updateSelection();
            selModel.resumeChanges();
            delete selModel.selectedData;

            if (this.isTree && notFoundRecords.length > 0) {
                selModel.selectedData = notFoundRecords;
                this.store.on("load", this.doSelection, this, { single: true, delay: 10 });
            }

            selModel.maybeFireSelectionChange(records.length > 0);
        }
    },

    doSpreadsheetSelection: function () {
        var grid = this.grid,
            store = this.grid.store,
            selModel = grid.getSelectionModel(),
            data = selModel.selectedData,
            rowsData = data.rows,
            columnsData = data.columns,
            rangeStart = data.rangeStart,
            rangeEnd = data.rangeEnd,
            headerCt,
            records = [],
            columns = [],
            i,
            record,
            column;

        if (rowsData) {
            // Parse rows configs and get records
            for (i = 0; i < rowsData.length; i++) {
                if (!Ext.isEmpty(rowsData[i].recordID)) {
                    record = store.getById(rowsData[i].recordID);

                    if (!record && Ext.isNumeric(rowsData[i].recordID)) {
                        record = store.getById(parseInt(rowsData[i].recordID, 10));
                    }
                } else if (!Ext.isEmpty(rowsData[i].rowIndex)) {
                    record = store.getAt(rowsData[i].rowIndex);
                }

                if (!Ext.isEmpty(record)) {
                    records.push(record);
                }
            }

            // Select rows
            if (records.length == 0) {
                selModel.deselectAll();
            } else {
                selModel.selectRows(records, false, true);
            }
        } else if (columnsData) {
            headerCt = this.headerCt;

            // Parse columns configs and get columns instances
            for (i = 0; i < columnsData.length; i++) {
                if (!Ext.isEmpty(columnsData[i].columnID)) {
                    column = headerCt.getComponent(columnsData[i].columnID);
                } else if (!Ext.isEmpty(columnsData[i].columnDataIndex)) {
                    column = headerCt.down("gridcolumn[dataIndex=" + columnsData[i].columnDataIndex + "]");
                } else if (!Ext.isEmpty(columnsData[i].columnIndex)) {
                    column = headerCt.getComponent(columnsData[i].columnIndex);
                }

                if (!Ext.isEmpty(column)) {
                    columns.push(column);
                }
            }

            // Select columns
            selModel.resetSelection(true);

            for (i = 0; i < columns.length; i++) {
                selModel.selectColumn(columns[i], true, true);
            }
        } else if (rangeStart && rangeEnd) {
            selModel.selectCells(rangeStart, rangeEnd, true);
        }

        this.updateSelection();
        selModel.resumeChanges();
        delete selModel.selectedData;
        selModel.maybeFireSelectionChange(records.length > 0 || columns.length > 0);
    },

    updateSelection: function () {
        var grid = this.grid,
            cm = this.headerCt,
            store = this.grid.store,
            selModel = grid.getSelectionModel(),
            sMemory = grid.getSelectionMemory && grid.getSelectionMemory(),
            rowIndex;

        if (this.grid.selectionSubmit === false) {
            return;
        }

        if (selModel instanceof Ext.selection.RowModel) {
            var records = [];

            if (sMemory && sMemory.selectedIds && !Ext.isEmptyObj(sMemory.selectedIds)) {
                for (var id in sMemory.selectedIds) {
                    if (sMemory.selectedIds.hasOwnProperty(id)) {
                        records.push({ RecordID: sMemory.selectedIds[id].id, RowIndex: sMemory.selectedIds[id].index });
                    }
                }
            } else {
                var selectedRecords = selModel.getSelection();

                for (var i = 0; i < selectedRecords.length; i++) {
                    if (this.isTree) {
                        records.push({ RecordID: selectedRecords[i].getId() });
                    } else {
                        rowIndex = store.indexOf(selectedRecords[i]);
                        records.push({ RecordID: selectedRecords[i].getId(), RowIndex: rowIndex });
                    }
                }
            }

            this.hField.setValue(Ext.encode(records));
        }
        else if (selModel instanceof Ext.selection.CellModel) {
            var pos = selModel.getCurrentPosition(),
                r = pos && this.store.getAt(pos.row);

            if (!pos || !r) {
                this.hField.setValue("");
                return;
            }

            var column = cm.getHeaderAtIndex(pos.column),
                columnDataIndex = column.dataIndex,
                value = r.get(columnDataIndex),
                id = r.getId() || "";

            this.hField.setValue(Ext.encode({
                RecordID: id,
                columnDataIndex: columnDataIndex,
                SubmittedValue: value,
                RowIndex: pos.row,
                ColumnIndex: pos.column,
                ColumnID: column.getId()
            }));
        }
        else if (selModel instanceof Ext.grid.selection.SpreadsheetModel) {
            this.updateSpreadsheetSelection();
        }
    },

    updateSpreadsheetSelection: function () {
        var grid = this.grid,
            selModel = grid.getSelectionModel(),
            selected = selModel.getSelected(),
            data = {},
            values;

        if (selected instanceof Ext.grid.selection.Rows) {
            values = [];

            selected.eachRow(function (record) {
                values.push({
                    rowIndex: this.view.indexOf(record),
                    recordID: record.getId()
                });
            });

            data.rows = values;
        } else if (selected instanceof Ext.grid.selection.Columns) {
            values = [];

            selected.eachColumn(function (column) {
                values.push({
                    columnID: column.getId(),
                    columnDataIndex: column.dataIndex,
                    columnIndex: this.headerCt.items.indexOf(column)
                });
            }, this);

            data.columns = values;
        } else if (selected instanceof Ext.grid.selection.Cells && selected.startCell && selected.endCell) {
            data.rangeStart = {
                columnIndex: selected.startCell.colIdx,
                rowIndex: selected.startCell.rowIdx,
                recordID: selected.startCell.record.getId(),
                columnDataIndex: selected.startCell.column.dataIndex,
                columnID: selected.startCell.column.getId()
            };

            data.rangeEnd = {
                columnIndex: selected.endCell.colIdx,
                rowIndex: selected.endCell.rowIdx,
                recordID: selected.endCell.record.getId(),
                columnDataIndex: selected.endCell.column.dataIndex,
                columnID: selected.endCell.column.getId()
            };
        }

        this.hField.setValue(Ext.encode(data));
    },

    initSelectionData: function () {
        if (this.grid.view.viewReady && this.store) {
            if (this.store.getCount() > 0 || this.isTree) {
                Ext.defer(this.doSelection, 100, this);
            } else {
                this.store.on("load", this.doSelection, this, { single: true, delay: 100 });
            }
        }
    }
});