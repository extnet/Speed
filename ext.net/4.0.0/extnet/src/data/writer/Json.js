Ext.data.writer.Json.override({
    constructor: function () {
        this.callParent(arguments);
        Ext.net.reconfigure(this, this.initialConfig, {
            allowSingle: false,
            expandData: true
        });
    }
});