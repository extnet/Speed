Ext.tree.Column.override({
    initComponent : function () {
        this.callParent(arguments);

        this.renderer = Ext.Function.createInterceptor(this.renderer, function (value, metaData, record, rowIdx, colIdx, store, view) {
            var iconCls = record.data.iconCls;

            if (iconCls && iconCls[0] === "#") {
                record.data.iconCls = X.net.RM.getIcon(iconCls.substring(1));
            }
        });
    }
});