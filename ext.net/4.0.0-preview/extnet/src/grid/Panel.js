
// @source src/grid/Panel.js

Ext.grid.Panel.override({
    selectionSubmit : true,
    selectionMemory : true,
    selectionMemoryEvents: true,
    focusable: false, // temp fix for grid's scroll jumping

    getFilterPlugin : function () {
        return this.filters;
    },

    getRowEditor : function () {
        return this.editingPlugin;
    },

    getRowExpander : function () {
        if (this.plugins && Ext.isArray(this.plugins)) {
            for (var i = 0; i < this.plugins.length; i++) {
                if (this.plugins[i].isRowExpander) {
                    return this.plugins[i];
                }
            }
        } else {
            if (this.plugins && this.plugins.isRowExpander) {
                return this.plugins;
            }
        }
    },
    
    initComponent : function () {
        this.plugins = this.plugins || [];

        if (!Ext.isArray(this.plugins)) {
            this.plugins = [this.plugins];
        }
        
        if (this.selectionMemory) {
            this.initSelectionMemory();
        }    
        
        this.initSelectionSubmit();        
        this.callParent(arguments);
    },
    
    initSelectionSubmit : function () {
        if (!this.isLocked && !this.getSelectionSubmit) {
            this.plugins.push(Ext.create('Ext.grid.plugin.SelectionSubmit', {}));
        }
    },
    
    initSelectionMemory : function () {
        if (!this.isLocked && !this.getSelectionMemory) {
            this.plugins.push(Ext.create('Ext.grid.plugin.SelectionMemory', {}));
        }
    },
    
    clearMemory : function () {
        if (this.selectionMemory) {
            this.getSelectionMemory().clearMemory();
        }
    },
    
    doSelection : function () {
         this.getSelectionSubmit().doSelection();
    },
    
    initSelectionData : function () {
        this.getSelectionSubmit().initSelectionData();
    },
    
    // config :
    //    - selectedOnly
    //    - visibleOnly
    //    - dirtyCellsOnly
    //    - dirtyRowsOnly
    //    - currentPageOnly
    //    - excludeId
    //    - filterRecord - function (record) - return false to exclude the record
    //    - filterField - function (record, fieldName, value) - return false to exclude the field for particular record
    //    - ignoreSubmitEmptyValue - true to ignore the ModelFields' SubmitEmptyValue option; defaults to false
    getRowsValues : function (config) {
        config = config || {};

        if (this.isEditable && this.editingPlugin) {
            this.editingPlugin.completeEdit();
        }

        var records = (config.selectedOnly ? this.selModel.getSelection() : config.currentPageOnly ? this.store.getRange() : this.store.getAllRange()) || [],
            values = [],
            record,
            sIds,
            i,
            idProp = this.store.getModel().idField.name;

        if (this.selectionMemory && config.selectedOnly && !config.currentPageOnly && this.store.isPagingStore) {
            records = [];
            sIds = this.getSelectionMemory().selectedIds;

            for (var id in sIds) {
                if (sIds.hasOwnProperty(id)) {
                    record = this.store.getById(sIds[id].id);

                    if (!Ext.isEmpty(record)) {
                        records.push(record);
                    }
                }
            }
        }

        for (i = 0; i < records.length; i++) {
            var obj = {}, dataR;

            dataR = Ext.apply(obj, records[i].data);

            if (idProp && dataR.hasOwnProperty(idProp)) {
                dataR[idProp] = config.excludeId === true ? undefined : records[i].getId();
            }
            
            config.grid = this;
            dataR = this.store.prepareRecord(dataR, records[i], config);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    serialize : function (config) {
        return Ext.encode(this.getRowsValues(config));
    },
    
    // config:
    //   - selectedOnly,
    //   - visibleOnly
    //   - dirtyCellsOnly
    //   - dirtyRowsOnly
    //   - currentPageOnly
    //   - excludeId
    //   - encode
    //   - filterRecord - function (record) - return false to exclude the record
    //   - filterField - function (record, fieldName, value) - return false to exclude the field for particular record
    //   - ignoreSubmitEmptyValue - true to ignore the ModelFields' SubmitEmptyValue option; defaults to false
    submitData : function (config, requestConfig) {
        config = config || {};
        config.selectedOnly = config.selectedOnly || false;
        encode = config.encode;

        var values = this.getRowsValues(config);

        if (!values || values.length === 0) {
            return false;
        }

        if (encode) {
            values = Ext.util.Format.htmlEncode(values);
            delete config.encode;
        }

        this.store._submit(values, config, requestConfig);
    },

    deleteSelected : function () {
        var selection = this.getSelectionModel().getSelection();

        if (selection && selection.length > 0) {
            this.store.remove(selection);
        }
    },

    hasSelection : function () {
        return this.getSelectionModel().hasSelection();
    },

    print : function (config) {
        Ext.net.GridPrinter.print(this, config);
    }
});