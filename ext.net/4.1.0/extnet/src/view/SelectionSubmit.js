

Ext.define('Ext.view.plugin.SelectionSubmit', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.viewselectionsubmit',
    
    init : function (view) {
        var me = this;       
        view.getSelectionSubmit = function () {
            return me;
        };
        
        if (view instanceof Ext.view.Table || view instanceof Ext.view.BoundList) {
            return;
        }
        
        this.view = view;
        this.store = view.store;              
        
        this.initSelection();
    },
    
    initSelection : function () {
        this.hField = this.getSelectionModelField();

        if(this.view.hasId() && this.view.selectionSubmit !== false) {
            this.view.on("selectionchange", this.updateSelection, this, { buffer: 10 });
            this.store.on("clear", this.clearField, this);
        }
        
        this.view.on("viewready", function () {
            if(this.view.hasId() && this.view.selectionSubmit !== false) {
                this.getSelectionModelField().render(this.view.el.parent() || this.view.el);
            }
            this.initSelectionData();
        }, this);        
    },

    clearField : function () {
        this.getSelectionModelField().setValue("");
    },
    
    getSelectionModelField : function () {        
        if (!this.hField) {
            this.hField = new Ext.form.field.Hidden({ name: this.view.id });           
        }

        return this.hField;
    },
    
    destroy : function () {
        if (this.hField) {
            this.hField.destroy();
        }
    },
    
    doSelection : function () {
        var view = this.view,
            store = this.store,
            selModel = view.getSelectionModel(),
            data = view.selectedData;

        if (!Ext.isEmpty(data)) {
            selModel.suspendChanges();
            
            var records = [],
                record;

            for (var i = 0; i < data.length; i++) {
                if (!Ext.isEmpty(data[i].recordID)) {
                    record = store.getById(data[i].recordID);
                        
                    if (!record && Ext.isNumeric(data[i].recordID)) {
                        record = store.getById(parseInt(data[i].recordID, 10));
                    }
                } else if (!Ext.isEmpty(data[i].rowIndex)) {
                    record = store.getAt(data[i].rowIndex);
                }

                if (!Ext.isEmpty(record)) {
                    records.push(record);
                }
            }
            selModel.select(records);
            
            
            this.updateSelection();
            selModel.resumeChanges();
            delete selModel.selectedData;
        }
    },
    
    updateSelection : function () {
        var view = this.view,
            store = this.store,
            selModel = view.getSelectionModel(),
            rowIndex,
            selectedRecords,
            records = [];
            
        if (this.view.selectionSubmit === false) {
            return;
        }
            
        selectedRecords = selModel.getSelection();

        for (var i = 0; i < selectedRecords.length; i++) {
            rowIndex = store.indexOfId(selectedRecords[i].getId());                    
            records.push({ RecordID: selectedRecords[i].getId(), RowIndex: rowIndex });
        }
        

        this.hField.setValue(Ext.encode(records));
    },

    initSelectionData : function () {
        if (this.store && this.view.viewReady) {
            if (this.store.getCount() > 0) {
               Ext.defer(this.doSelection, 100, this);
            } else {
                this.store.on("load", this.doSelection, this, { single: true, delay : 100 });
            }
        }
    }   
});