
// @source grid/plugin/SelectionMemory.js

Ext.define('Ext.grid.plugin.SelectionMemory', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.selectionmemory',
    lockableScope: 'normal',

    init: function (grid) {
        if (grid.isLocked || grid.getSelectionMemory) {
            return;
        }

        var me = this;
        this.grid = grid;
        this.headerCt = this.grid.normalGrid ? this.grid.normalGrid.headerCt : this.grid.headerCt;
        this.store = grid.store;
        this.selModel = this.grid.getSelectionModel();
        this.hasPaging = this.grid.down("pagingtoolbar") || this.grid.store.buffered;

        if (this.selModel instanceof Ext.selection.CellModel) {
            this.selModel.onViewRefresh = Ext.emptyFn;
            this.grid.getView().on("beforerefresh", function () {
                this.selModel.selection = null;
            }, this);
        }

        this.grid.getSelectionMemory = function () {
            return me;
        };

        this.selectedIds = {};

        this.selModel.on("select", this.onMemorySelect, this);
        this.selModel.on("deselect", this.onMemoryDeselect, this);
        this.grid.store.on("remove", this.onStoreRemove, this);
        this.grid.store.on("load", this.checkPhantoms, this);
        this.grid.getView().on("refresh", this.memoryReConfigure, this, { single: true });

        this.store.on("add", this.restoreRecordSelection, this);

        this.grid.getView()._onMaskBeforeShow = this.grid.getView().onMaskBeforeShow;
        this.grid.getView().onMaskBeforeShow = Ext.Function.createInterceptor(this.grid.getView().onMaskBeforeShow, this.onMaskBeforeShowBefore, this);
        this.grid.getView().onMaskBeforeShow = Ext.Function.createSequence(this.grid.getView().onMaskBeforeShow, this.onMaskBeforeShowAfter, this);

        this.selModel._onSelectChange = this.selModel.onSelectChange;
        this.selModel.onSelectChange = Ext.Function.createSequence(this.selModel.onSelectChange, this.onSelectChange, this);
    },

    destroy: function () {
        if (this.grid && !this.grid.lockable) {
            this.selModel.un("select", this.onMemorySelect, this);
            this.selModel.un("deselect", this.onMemoryDeselect, this);
            this.store.un("remove", this.onStoreRemove, this);
            this.grid.getView().un("refresh", this.memoryReConfigure, this, { single: true });
            this.grid.getView().onMaskBeforeShow = this.grid.getView()._onMaskBeforeShow;
            this.selModel.onSelectChange = this.selModel._onSelectChange;
        }
    },

    onMaskBeforeShowBefore: function () {
        this.surpressDeselection = true;
    },

    onMaskBeforeShowAfter: function () {
        this.surpressDeselection = false;
    },

    onSelectChange: function (record, isSelected, suppressEvent, commitFn) {
        if (suppressEvent) {
            if (isSelected) {
                this.onMemorySelect(this.selModel, record, this.store.indexOf(record), null);
            }
            else {
                this.onMemoryDeselect(this.selModel, record, this.store.indexOf(record));
            }
        }
    },

    clearMemory: function () {
        delete this.selModel.selectedData;
        this.selectedIds = {};
    },

    memoryReConfigure: function () {
        this.store.on("clear", this.onMemoryClear, this);
        this.store.on("datachanged", function () {
            this.memoryRestoreState();
        }, this, { delay: 100 });
    },

    restoreRecordSelection: function (store, records, index) {
        this.memoryRestoreState(records);
    },

    onMemorySelect: function (sm, rec, idx, column) {
        if (this.selModel.selectionMode == "SINGLE") {
            this.clearMemory();
        }

        if (!Ext.isFunction(rec.getId)) {
            return;
        }

        var id = rec.getId(),
            absIndex = this.getAbsoluteIndex(idx);

        if (id || id === 0) {
            this.onMemorySelectId(sm, absIndex, id, column);
        }
    },

    onMemorySelectId: function (sm, index, id, column) {
        if (!id && id !== 0) {
            return;
        }

        var obj = {
            id: id,
            index: index
        },
        col = Ext.isNumber(column) && this.headerCt.getHeaderAtIndex(column);

        if (col && col.dataIndex) {
            obj.dataIndex = col.dataIndex;
        }

        this.selectedIds[id] = obj;
    },

    getAbsoluteIndex: function (pageIndex) {
        return ((this.store.currentPage - 1) * this.store.pageSize) + pageIndex;
    },

    onMemoryDeselect: function (sm, rec, idx) {
        if (this.surpressDeselection) {
            return;
        }

        if (Ext.isArray(rec)) {
            for (var i = 0; i < rec.length; i++) {
                delete this.selectedIds[rec[i].getId()];
            }
        }
        else {
            delete this.selectedIds[rec.getId()];
        }        
    },

    onStoreRemove: function (store, rec, idx) {
        this.onMemoryDeselect(null, rec, idx);
    },

    memoryRestoreState: function (records) {
        if (this.store !== null && !this.store.isBufferedStore /*&& !this.grid.view.bufferedRenderer*/) {
            var i = 0,
                ind,
                sel = [],
                len,
                all = true,
                cm = this.headerCt;

            if (!records) {
                records = this.store.getRange();
            }

            if (!Ext.isArray(records)) {
                records = [records];
            }

            if (this.selModel.isLocked()) {
                this.wasLocked = true;
                this.selModel.setLocked(false);
            }

            if (this.selModel instanceof Ext.selection.RowModel) {
                for (ind = 0, len = records.length; ind < len; ind++) {
                    var rec = records[ind],
                        id = rec.getId();

                    if ((id || id === 0) && !Ext.isEmpty(this.selectedIds[id])) {
                        sel.push(rec);
                    } else {
                        all = false;
                    }

                    ++i;
                }

                if (sel.length > 0) {
                    this.surpressDeselection = true;
                    this.selModel.select(sel, false, !this.grid.selectionMemoryEvents);
                    this.surpressDeselection = false;
                }
            } else {
                for (ind = 0, len = records.length; ind < len; ind++) {
                    var rec = records[ind],
                        id = rec.getId();

                    if ((id || id === 0) && !Ext.isEmpty(this.selectedIds[id])) {
                        if (this.selectedIds[id].dataIndex) {
                            var colIndex = cm.getHeaderIndex(cm.down('gridcolumn[dataIndex=' + this.selectedIds[id].dataIndex + ']'))
                            this.selModel.setCurrentPosition({
                                row: i,
                                column: colIndex
                            });
                        }
                        return false;
                    }

                    ++i;
                }
            }

            if (this.selModel instanceof Ext.selection.CheckboxModel) {
                if (all) {
                    this.selModel.toggleUiHeader(true);
                } else {
                    this.selModel.toggleUiHeader(false);
                }
            }

            if (this.wasLocked) {
                this.selModel.setLocked(true);
            }
        }
    },

    onMemoryClear: function () {
        this.selectedIds = {};
    },

    checkPhantoms: function () {
        if (!this.hasPaging) {
            var removeIds = [];
            for (var id in this.selectedIds) {
                if (this.selectedIds.hasOwnProperty(id) && !this.grid.store.getById(id)) {
                    removeIds.push(id);
                }
            }

            if (removeIds.length) {
                for (var i = 0; i < removeIds.length; i++) {
                    delete this.selectedIds[removeIds[i]];
                }
            }
        }
    }
});