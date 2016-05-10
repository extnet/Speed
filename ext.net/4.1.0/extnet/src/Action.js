Ext.Action.override({
    constructor: function () {
        this.callParent(arguments);
        this.proxyId = this.initialConfig.id;
        delete this.initialConfig.id;
        Ext.net.ComponentManager.registerId(this);
    },

    destroy: function () {
        Ext.net.ComponentManager.unregisterId(this);
    }
});