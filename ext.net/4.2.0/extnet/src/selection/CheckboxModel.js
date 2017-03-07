Ext.define("Ext.selection.CheckboxModel", {
    override: "Ext.selection.CheckboxModel",

    // This renderer adds a rowspan to the checkbox cells (table's td) if specified in 
    // the checkbox selection model settings.
    // Ext.NET specific setting.
    renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
        var me = this,
            columnClassProto = Ext.ClassManager.classes[me.column.$className].prototype;

        if (me.rowspan) {
            if (metaData.tdAttr.length > 0) {
                metaData.tdAttr += ' ';
            }
            metaData.tdAttr += 'rowspan="' + me.rowspan + '"';
        }

        // Calls the original defaultRenderer from ExtJS
        return columnClassProto.defaultRenderer(value, metaData);
    },

    // Bind the custom renderer to the checkbox column so that we can add custom behavior
    // to the cells.
    // Ext.NET specific setting.
    getHeaderConfig: function () {
        var me = this,
            config = me.callParent(arguments);

        // Replaces the check column's defaultRenderer with checkboxmodel's specific renderer
        config.defaultRenderer = me.renderer.bind(me);

        return config;
    }
});