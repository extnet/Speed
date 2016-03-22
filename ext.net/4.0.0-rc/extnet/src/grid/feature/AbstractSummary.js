
// @source grid/feature/AbstractSummary.js

Ext.override(Ext.grid.feature.AbstractSummary, {
    getSummary: function (store, type, field, group) {
        var isGrouped = !!group,
            item = isGrouped ? group : store;

        if (type) {
            if (Ext.isFunction(type)) {
                if (isGrouped) {
                    return item.aggregate(field, type);
                } else {
                    return item.aggregate(type, null, false, [field]);
                }
            }

            switch (type) {
                case 'count':
                    return item.count(isGrouped); // #692
                case 'min':
                    return item.min(field);
                case 'max':
                    return item.max(field);
                case 'sum':
                    return item.sum(field);
                case 'average':
                    return item.average(field);
                default:
                    return '';
            }
        }
    }
});

Ext.grid.feature.Grouping.override({
    getSummary: Ext.grid.feature.AbstractSummary.prototype.getSummary // #692
});
