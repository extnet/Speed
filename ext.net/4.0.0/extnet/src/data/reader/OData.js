Ext.define("Ext.data.reader.OData",{
    extend: "Ext.data.reader.Json",    
    alias: "reader.odata",

    constructor: function () {
        this.callParent(arguments);
        Ext.net.reconfigure(this, this.initialConfig, {
            rootProperty: "value",
            totalProperty: "odata_count"
        });
    },

    read: function (response, readOptions) {
        if (response && response.responseText == "") {
            return this.nullResultSet;
        }

        var data;

        if (response) {
            data = response.responseText ? this.getResponseData(response) : this.readRecords(response, readOptions);
        }

        return this.callParent([ data || this.nullResultSet, readOptions ]);
    },

    getData: function (response) {
        if(!Ext.isDefined(response[this.getRootProperty()]) && !Ext.isDefined(response["odata.count"])){
            var obj = {};
            obj[this.getRootProperty()] = Ext.isArray(response) ? response : [response];
            response = obj;
        }

        if(response && Ext.isDefined(response["odata.count"]))
        {
            response["odata_count"] = response["odata.count"];
        }

        return response;
    }
});