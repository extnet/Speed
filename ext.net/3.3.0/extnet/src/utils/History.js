
// @source core/utils/History.js

Ext.History.initEx = function (config) {
    Ext.History.init();

    if (config.listeners) {
        Ext.History.addListener(config.listeners);
    }

    if (config.directEvents) {
        Ext.History.addListener(config.directEvents);
    }

    if (config.proxyId || config.id) {
        Ext.History.proxyId = config.proxyId || config.id;
    }
};