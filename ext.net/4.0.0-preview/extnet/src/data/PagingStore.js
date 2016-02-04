// @source data/PagingStore.js

var fnMaker = function (parent) {
    return function () {
        this.saveStoreData();
        this.copyAllData();

        var result = Ext.data.PagingStore.superclass[parent].apply(this, arguments);
        this.restoreStoreData();

        return result;
    };
};

Ext.define("Ext.data.PagingStore", {
    extend: "Ext.data.Store",
    alias: "store.paging",

    isPagingStore: true,

    constructor: function () {
        this.clearAllData();
        this.callParent(arguments);
        this.getFilters().on('beginupdate', this.onFilterBeginUpdate, this);
    },

    clearAllData: function () {
        this.allData = {
            items: []
        };
    },

    saveStoreData: function () {
        this._pageData = {
            items: this.data.items,
            map: this.data.map,
            indices: this.data.indices,
            filtered: this.data.filtered,
            source: this.data.getSource()
        };

        this.data.filtered = false;
        this.data._source = null;
    },

    restoreStoreData: function () {
        if (this._pageData) {
            this.data.items = this._pageData.items;
            this.data.length = this._pageData.items.length;
            this.data.map = this._pageData.map;
            this.data.indices = this._pageData.indices;
            this.data.filtered = this._pageData.filtered;
            this.data._source = this._pageData.source;

            delete this._pageData;
        }
    },

    clearAllDataMap: function () {
        delete this.allData.map;
        delete this.allData.indices;
    },

    destroy: function () {
        this.callParent(arguments);
        this.allData = null;
    },

    clearData: function (isLoad, data, skipAll) {
        this.clearAllData();
        this.callParent(arguments);
    },

    copyToAllData: function () {
        var me = this;
        me.allData.items = me.data.items;
        me.allData.map = me.data.map;
        me.allData.indices = me.data.indices;
    },

    copyAllData: function (allData, native) {
        var me = this,
            map = {},
            indices = {},
            i, item, items, key, length;

        items = allData || me.allData.items;
        
        me.data.items = items;
        me.data.length = length = items.length;

        if (allData || !me.allData.map) {
            me.data.map = map;
            me.data.indices = indices;

            for (i = 0; i < length; ++i) {
                key = me.data.getKey(item = items[i]);
                map[key] = item;
                indices[key] = i;
            }
        }
        else {
            me.data.map = me.allData.map;
            me.data.indices = me.allData.indices;
        }

        if (me.groupingDataSource && native) {            
            me.updateGroupField(me.groupField);
        }
    },

    removeAll: function (silent) {
        this._removeAllAction = true;
        this.callParent(arguments);
    },

    onCollectionRemove: function (collection, info) {
        var me = this,
            records = info.items,
            len = records.length,
            i, record;

        if (!me.ignoreCollectionRemove) {
            if (this._removeAllAction) {
                this.clearAllData();
            }
            else {
                for (i = 0; i < len; ++i) {
                    record = records[i];

                    Ext.Array.remove(this.allData.items, record);
                }
            }

            this.clearAllDataMap();
        }

        this.callParent(arguments);
    },

    onCollectionAdd: function (collection, info) {
        var me = this,
            records = info.items,
            len = records.length,
            ignoreAdd = me.ignoreCollectionAdd,
            index = info.at,
            i, record;

        if (!ignoreAdd) {
            index = (this.currentPage - 1) * this.pageSize + index;
            Ext.Array.insert(this.allData.items, index, records);
            this.clearAllDataMap();
        }
        this.callParent(arguments);
    },

    onBeforeCollectionSort: function () {
        this.copyAllData();
        this.callParent(arguments);
    },

    onSorterEndUpdate: function () {
        this.copyToAllData();
        this.applyPaging();
        this.callParent(arguments);
    },

    applyPaging: function (notify, native) {
        var start = (this.currentPage - 1) * this.pageSize,
            limit = this.pageSize,
            items;

        if (start >= this.allData.items.length) {
            start = this.start = 0;
        }

        items = Ext.Array.slice(this.allData.items, start, start + limit);

        this.copyAllData(items, native);

        if (notify === true) {
            this.fireEvent("refresh", this);
        }

        this.fireEvent("paging", this);
    },

    isPaging: function (options) {
        return options && options.isPagingRequest;
    },

    load: function (options) {
        var forceLocal = false;
        if (options === true) {
            forceLocal = true;
        }

        options = options || {};

        if (forceLocal || ((!Ext.isDefined(options.action) || options.action === "read") && this.isPaging(options))) {
            Ext.Function.defer(function () {
                var operation = this.getProxy().createOperation('read', options);
                this.fireEvent('beforeload', this, operation);

                this.ignoreCollectionAdd = true;
                this.callObservers('BeforeLoad');
                this.copyAllData();
                this.applyPaging(false, true);
                this.ignoreCollectionAdd = false;
                this.complete = true;

                this.fireEvent("datachanged", this, this.data.items);
                this.fireEvent("load", this, this.data.items, true);
                this.fireEvent("refresh", this);
                this.callObservers('AfterLoad');

                if (options.callback) {
                    options.callback.call(options.scope || this, this.data.items, options, true);
                }
            }, 1, this);

            return this;
        }

        options.isPagingStore = true;

        return this.callParent(arguments);
    },

    getTotalCount: function () {
        if (this.allData) {
            return this.allData.items.length;
        }
        return this.totalCount || 0;
    },

    loadPage: function (page, options) {
        var me = this,
            size = me.getPageSize();

        me.currentPage = page;

        options = Ext.apply({
            isPagingRequest: true,
            page: page,
            start: (page - 1) * size,
            limit: size,
            addRecords: !me.getClearOnPageLoad()
        }, options);

        me.read(options);
    },

    loadRecords: function (records, options) {
        var me = this,
            length = records.length,
            data = me.getData(),
            addRecords, autoSort, skipSort, i;

        if (options) {
            addRecords = options.addRecords;
        }

        skipSort = me.getRemoteSort() || !me.getSortOnLoad();
        if (skipSort) {
            autoSort = data.getAutoSort();
            data.setAutoSort(false);
        }

        if (!addRecords) {
            me.clearData(true);
        }

        // Clear the flag AFTER the stores collection has been cleared down so that
        // observers of that collection know that it was due to a load, and a refresh is imminent.
        me.loading = false; // #872

        me.ignoreCollectionAdd = true;
        me.callObservers('BeforeLoad');
        data.add(records);
        me.ignoreCollectionAdd = false;

        for (i = 0; i < length; i++) {
            records[i].join(me);
        }
        me.clearAllDataMap();
        me.allData.items = data.items;
        me.applyPaging(false, true);

        if (skipSort) {
            data.setAutoSort(autoSort);
        }
        ++me.loadCount;
        me.complete = true;
        me.fireEvent('datachanged', me);
        me.fireEvent('refresh', me);
        me.callObservers('AfterLoad');
    },

    onFilterBeginUpdate: function () {
        var me = this;

        if (!me.data.filtered) {
            me.copyAllData();
        }
    },

    onFilterEndUpdate: function () {
        if (!this.data.filtered) {
            this.data.setSource(null);
        }

        this.callParent(arguments);
    },

    onCollectionFilter: function () {
        this.copyToAllData();
        this.applyPaging();
        this.callParent(arguments);
    },

    findPage: function (record) {
        if ((typeof this.pageSize == "number")) {

            return Math.ceil((this.indexOfAll(record) + 1) / this.pageSize);
        }

        return -1;
    },

    privates: {
        onBeforeLoad: function() {
            var filters;

            this.callParent(arguments);

            if (this.data.filtered) {
                filters = Ext.clone(this.getFilters().getRange());
                this.clearFilter(true);
                this.on("load", function() {
                    this.setFilters(filters);
                }, this, { single: true });
            }
        }
    },

    indexOfIdAll: fnMaker("indexOfId"),
    indexOfAll: fnMaker("indexOf"),

    getAtAll: fnMaker("getAt"),
    find: fnMaker("find"),
    findBy: fnMaker("findBy"),
    findRecord: fnMaker("findRecord"),
    findExact: fnMaker("findExact"),
    contains: fnMaker("contains"),
    each: fnMaker("each"),
    getUnfiltered: fnMaker("getUnfiltered"),
    getRejectRecords: fnMaker("getRejectRecords"),
    getAllRange: fnMaker("getRange"),
    getById: fnMaker("getById"),
    getByInternalId: fnMaker("getByInternalId"),
    collect: fnMaker("collect"),
    queryBy: fnMaker("queryBy"),
    query: fnMaker("query"),
    sum: fnMaker("sum"),
    count: fnMaker("count"),
    min: fnMaker("min"),
    max: fnMaker("max"),
    average: fnMaker("average")
});