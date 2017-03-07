Ext.grid.feature.Grouping.override({
    init: function(grid) {
        this.callParent(arguments);
        grid.groupingFeature = this;

        if (this.dataSource) {
            grid.store.groupingDataSource = this.dataSource;
        }
    }
});