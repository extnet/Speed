Ext.grid.column.RowNumberer.override({
    defaultRenderer: function (value, metaData, record, rowIdx, colIdx, dataSource, view) {
        var rowspan = this.rowspan,
            page = dataSource.currentPage,
            result = view.store.indexOf(record);

        if (result == -1 && view.store.indexOfAll) {
            return view.store.indexOfAll(record);
        }

        if (metaData && rowspan) {
            metaData.tdAttr = 'rowspan="' + rowspan + '"';
        }

        if (page > 1) {
            result += (page - 1) * dataSource.pageSize;
        }
        return result + 1;
    }
});