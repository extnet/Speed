
// @source core/ajax/Connection.js

Ext.data.Connection.override({
    // Do not replace with .callParent()
    setOptions: Ext.Function.createInterceptor(Ext.data.Connection.prototype.setOptions, function (options, scope) {
        if (options.json) {
            options.jsonData = options.params;
        }
        
        if (options.xml) {
            options.xmlData = options.params;
        }
    }),

    // Do not replace with .callParent()
    setupHeaders : Ext.Function.createInterceptor(Ext.data.Connection.prototype.setupHeaders, function (xhr, options, data, params) {
        if (options.json) {
            options.jsonData = options.params;
        }
        
        if (options.xml) {
            options.xmlData = options.params;
        }
    })
});