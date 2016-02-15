Ext.data.reader.Reader.override({
    $configStrict: false,

    constructor: function () {
        this.callParent(arguments);
        Ext.net.reconfigure(this, this.initialConfig, {
            messageProperty: "message"
        });
    }
});