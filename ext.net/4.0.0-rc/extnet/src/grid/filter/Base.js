
// @source src/grid/filter/Base.js

Ext.grid.filters.filter.Base.override({
    // It has been overridden to provide required information - the filter's  type - to be sent to the server in the case of remote filtering.
    // In the case with a DateFilter, a filter is configured with a submitFormat to be used to format a date before sending to the server.
    // See the utils/Filter.js file. There is an override of the serialize method to take the type and submiFormat into account.
    getFilterConfig: function(config, key) {
        var config = this.callParent(arguments);

        config.type = this.type;

        if (this.type === "date") {
            config.submitFormat = this.submitFormat;
        }

        return config;
    }
});