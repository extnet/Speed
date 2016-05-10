
Ext.selection.CheckboxModel.override({
    renderer : function (value, metaData, record, rowIndex, colIndex, store, view) {
        if (this.rowspan) {
            metaData.tdAttr = 'rowspan="' + this.rowspan + '"';
        } 
        
        return this.callParent(arguments);
    }
});