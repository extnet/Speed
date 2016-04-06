
// @source data/ServerProxy.js

Ext.data.proxy.Server.override({
    appendAction: true,

    afterRequest: function (request, success) {
        this.fireEvent("afterrequest", this, request, success);
    },

    getUrl: function (request) {
        var url,
            api = this.getApi(),
            action = request.getAction();
        if (request) {
            url = request.getUrl() || api[action] || (action != "read" ? api["sync"] : "");
        }
        return url ? url : this.callParent();
    },

    buildRequest: function (operation) {
        this.fireEvent("beforerequest", this, operation);

        var me = this,
            initialParams = Ext.apply({}, operation.getParams()),
            // Clone params right now so that they can be mutated at any point further down the call stack
            params = Ext.applyIf(initialParams, me.getExtraParams() || {}),
            request,
            operationId,
            idParam,
            method;

        //copy any sorters, filters etc into the params so they can be sent over the wire
        Ext.applyIf(params, me.getParams(operation));

        // Set up the entity id parameter according to the configured name.
        // This defaults to "id". But TreeStore has a "nodeParam" configuration which
        // specifies the id parameter name of the node being loaded.
        operationId = operation.getId();
        idParam = me.getIdParam();
        if (operationId !== undefined && params[idParam] === undefined) {
            params[idParam] = operationId;
        }

        request = new Ext.data.Request({
            params: params,
            action: operation.getAction(),
            records: operation.getRecords(),
            url: operation.getUrl(),
            operation: operation,

            // this is needed by JsonSimlet in order to properly construct responses for
            // requests from this proxy
            proxy: me
        });

        if (me.getMethod) {
            method = me.getMethod(request);
        }
        else if (request.getMethod) {
            method = request.getMethod();
        }

        if (this.json) {
            request.setJsonData(request.getParams());
            if (method.toUpperCase() !== "GET") {
                request.setParams(undefined);
            }
        }
        else if (this.xml) {
            request.setXmlData(request.getParams());
            if (method.toUpperCase() !== "GET") {
                request.setParams(undefined);
            }
        }

        request.setUrl(me.buildUrl(request));

        if (this.appendAction && operation.allowWrite()) {
            request.setUrl(Ext.urlAppend(request.getUrl(), "action=" + operation.action));
        }

        operation.setRequest(request);

        return request;
    }
});