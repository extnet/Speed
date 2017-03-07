Ext.util.Filter.override({
    // This has been overridden for GridFilters with remote filtering to send the filter's type and serialize a date with the submitFormat.
    serialize: function () {
        var result = this.getState(),
            serializer = this.getSerializer(),
            serialized;

        if (this.type) {
            result.type = this.type; // Added
        }

        delete result.id;
        delete result.serializer;
        
        if ((this.type === "date") && this.submitFormat) {
            result.value = Ext.Date.format(new Date(result.value), this.submitFormat); // Added
        } else {
            if (serializer) {
                serialized = serializer.call(this, result);
                if (serialized) {
                    result = serialized;
                }
            }
        }

        return result;
    },

    statics: {
        createFilterFn: function (filters) {
            if (!filters) {
                return Ext.returnTrue;
            }

            return function (candidate, scope) {
                var items = filters.isCollection ? filters.items : filters,
                    length = items.length,
                    match = true,
                    i, filter;

                for (i = 0; match && i < length; i++) {
                    filter = items[i];

                    if (Ext.isFunction(filter)) {
                        match = filter.call(scope, candidate);
                    }
                    else if (!filter.getDisabled()) {
                        match = filter.filter(candidate);
                    }
                }

                return match;
            };
        }
    }
});