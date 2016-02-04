
// @source src/grid/filter/Date.js

Ext.grid.filters.filter.Date.override({
    submitFormat : "Y-m-d\\TH:i:s",

    // The constructor has been overridden to support the beforeText, afterText and onText config options.
    constructor: function(config) {
        var cfg = {
            fields: {}
        };

        if (Ext.isDefined(config.beforeText)) {
            cfg.fields.lt = { text: config.beforeText };
            delete config.beforeText;
        }

        if (Ext.isDefined(config.afterText)) {
            cfg.fields.gt = { text: config.afterText };
            delete config.afterText;
        }

        if (Ext.isDefined(config.onText)) {
            cfg.fields.eq = { text: config.onText };
            delete config.onText;
        }

        Ext.merge(config, cfg);
        this.callParent(arguments);
    }
});