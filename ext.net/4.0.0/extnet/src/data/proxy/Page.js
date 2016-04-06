// @source data/PageProxy.js

Ext.define("Ext.data.proxy.Page", {
    extend: "Ext.data.proxy.Server",
    alias: 'proxy.page',
    isPageProxy: true,
    appendAction: false,

    extractResponseData: function (response) {
        return response.data;
    },

    buildUrl: function () {
        return '';
    },

    getMethod: function (request) {        
        return request.getMethod() || this.method;
    },

    doRequest: function (operation) {
        if (!this._initReader) {
            this._initReader = true;
            this.initReader(this.getReader());
        }

        var request = this.buildRequest(operation),
            writer = this.getWriter(),
            requestConfig = Ext.apply({}, this.requestConfig || {}),
            params = request.getParams(),
            action = operation.getAction(),
            api = this.getApi(),
            scope;

        if (writer && operation.allowWrite()) {
            writer.setEncode(true);
            writer.setRootProperty("serviceParams");
            writer.setAllowSingle(false);
            request = writer.write(request);
        }

        requestConfig.userSuccess = this.createSuccessCallback(request, operation);
        requestConfig.userFailure = this.createErrorCallback(request, operation);
        requestConfig.eventMask = Ext.applyIf(requestConfig.eventMask || {}, {
            showDurationMessages: false
        });

        if (params.serviceParams) {
            requestConfig.serviceParams = params.serviceParams;
            delete params.serviceParams;
        }

        requestConfig.extraParams = params;

        var directFn = this.directFn || api[action] || (action != "read" ? api["sync"] : null);
        if (directFn) {
            if (Ext.isString(directFn)) {
                directFn = Ext.decode(directFn);
            }

            var extraParams = requestConfig.extraParams,
                serviceParams = requestConfig.serviceParams;

            delete requestConfig.extraParams;
            delete requestConfig.serviceParams;

            requestConfig.successSeq = requestConfig.userSuccess;
            requestConfig.failureSeq = requestConfig.userFailure;

            delete requestConfig.userSuccess;
            delete requestConfig.userFailure;
            requestConfig.showFailureWarning = false;

            if (directFn.length === 1) {
                directFn(requestConfig);
            }
            else if (directFn.length === 2) {
                directFn(action || null, requestConfig);
            }
            else if (directFn.length === 3) {
                directFn(action || null, extraParams || null, requestConfig);
            }
            else {
                directFn(action || null, extraParams || null, serviceParams || null, requestConfig);
            }
        }
        else {
            scope = operation._store || operation.getInternalScope();

            if (!scope.isStore) {
                var records = request.getRecords();

                if (records.length > 0) {
                    scope = records[0].store;
                }
            }

            Ext.apply(requestConfig, {
                control: scope,
                eventType: "postback",
                action: action
            });

            Ext.net.DirectEvent.request(requestConfig);
        }

        return request;
    },

    createSuccessCallback: function (request, operation) {
        var me = this;

        return function (response, result, context, type, action, extraParams) {
            var res,
                api,
                action;

            try {
                api = me.getApi();
                action = operation.getAction();

                if (me.directFn || api[action] || (action != "read" ? api["sync"] : null)) {
                    res = Ext.isEmpty(result.result, true) ? (result.d || result) : result.result;

                    response.data = res;
                    res = { success: true };
                }
                else {
                    res = result.serviceResponse;
                    response.data = res.data ? res.data : {};

                    if (res.metaData) {
                        response.metaData = res.metaData;
                    }

                    request._data = response.data;
                    if ((res || result).success === false) {
                        throw new Error((res || result).message);
                    }
                }
            } catch (e) {
                operation.setException(e.message);
                me.setException = Ext.emptyFn;
                me.processResponse(false, operation, request, response);
                me.setException = Ext.data.proxy.Page.prototype.setException;
                return;
            }

            me.processResponse(res.success, operation, request, response);
        };
    },

    createErrorCallback: function (request, operation) {
        var me = this;

        return function (response, result, context, type, action, extraParams) {
            me.processResponse(false, operation, request, response);
        };
    },

    updateReader: function (reader) {
        this.callParent(arguments);
        this._initReader = false;
    },

    initReader: function (reader) {
        reader.setTotalProperty("total");
        if (!reader.getRootProperty()) {
            reader.setRootProperty("data");
        }
        reader.buildExtractors(true);

        return reader;
    }
});