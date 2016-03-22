Ext.define("Ext.net.GroupPaging", {
    alias: "plugin.grouppaging",

    constructor: function (config) {
        if (config) {
            Ext.apply(this, config);
        }
    },

    init: function (toolbar) {
        this.toolbar = toolbar;
        this.store = toolbar.store;

        if (this.store.applyPaging) {
            this.store.applyPaging = Ext.Function.bind(this.applyPaging, this);
        }
        this.store.getTotalCount = this.getTotalCount;
        this.store.pageSize = 1;

        if (this.store.proxy instanceof Ext.data.proxy.Memory) {
            this.store.proxy.enablePaging = false;
        }
    },

    getGroups: function (records) {
        var length = records.length,
            groups = [],
            pointers = {},
            record,
            groupStr,
            group,
            children,
            groupField = this.store.groupField,
            i;

        for (i = 0; i < length; i++) {
            record = records[i];
            groupStr = record.get(groupField);
            group = pointers[groupStr];

            if (group === undefined) {
                group = {
                    name: groupStr,
                    children: []
                };

                groups.push(group);
                pointers[groupStr] = group;
            }

            group.children.push(record);
        }

        return groups;
    },

    applyPaging: function (notify, native) {
        var store = this.store,
            allData = store.allData.items,
            groups = this.getGroups(allData),
            items;

        store.copyAllData(groups[store.currentPage - 1].children, native);
        store.totalCount = groups.length;

        if (notify === true) {
            store.fireEvent("refresh", store);
        }

        store.fireEvent("paging", store);
    },

    getTotalCount: function () {
        return this.totalCount;
    }
});