// @source data/PagingMemory.js

Ext.data.proxy.Memory.override({
    getRecords: function () {
        return this.getReader().read(this.getData()).getRecords();
    }
});

Ext.define("Ext.data.proxy.PagingMemory", {
    extend: "Ext.data.proxy.Memory",
    alias: "proxy.pagingmemory",
    isMemoryProxy: true,

    read: function (operation) {
        var me = this,
            resultSet = me.getReader().read(me.getData()),
            records = resultSet.getRecords(),
            sorters = operation.getSorters(),
            grouper = operation.getGrouper(),
            filters = operation.getFilters(),
            start = operation.getStart(),
            limit = operation.getLimit();

        // Apply filters, sorters, and start/limit options
        if (operation.process(resultSet, null, null, false) !== false) {
            if (operation.gridfilters !== undefined) {
                var r = [];
                for (var i = 0, len = records.length; i < len; i++) {
                    if (operation.gridfilters.call(this, records[i])) {
                        r.push(records[i]);
                    }
                }
                records = r;
                result.setRecords(r);
                result.setTotal(records.length);
            }

            // Filter the resulting array of records
            if (filters && filters.length) {
                // Total will be updated by setting records
                resultSet.setRecords(records = Ext.Array.filter(records, Ext.util.Filter.createFilterFn(filters, operation.getInternalScope())));
                resultSet.setTotal(records.length);
            }

            // Remotely, grouper just mean top priority sorters
            if (grouper) {
                // Must concat so as not to mutate passed sorters array which could be the items property of the sorters collection
                sorters = sorters ? sorters.concat(grouper) : sorters;
            }

            // Sort by the specified grouper and sorters
            if (sorters && sorters.length) {
                resultSet.setRecords(records = Ext.Array.sort(records, Ext.util.Sortable.createComparator(sorters)));
            }

            // Reader reads the whole passed data object.
            // If successful and we were given a start and limit, slice the result.
            if (me.getEnablePaging() && start !== undefined && limit !== undefined && operation.isPagingStore !== true) {

                // Attempt to read past end of memory dataset - convert to failure
                if (start >= resultSet.getTotal()) {
                    resultSet.setConfig({
                        success: false,
                        records: [],
                        total: 0
                    });
                }
                    // Range is valid, slice it up.
                else {
                    resultSet.setRecords(Ext.Array.slice(records, start, start + limit));
                }
            }
            operation.setCompleted();
        }
    }
});