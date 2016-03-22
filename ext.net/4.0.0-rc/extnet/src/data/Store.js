// @source data/data/Store.js
Ext.data.StoreManager.getArrayStore = function (fieldsCount) {
    var fields = ['field1'],
        i;

    fieldsCount = fieldsCount || 1;

    for (i = 2; i <= fieldsCount; ++i) {
        fields.push('field' + i);
    }

    return new Ext.data.ArrayStore({
        data: [],
        fields: fields,
        autoDestroy: true,
        autoCreated: true,
        expanded: false
    });
};

Ext.data.AbstractStore.override({
    autoDestroy: true,

    constructor: function (config) {
        var me = this;

        if (config && config.storeId) {
            var store = Ext.data.StoreManager.lookup(config.storeId);
            if (store) {
                store.destroy();
            }
        }

        me.callParent(arguments);

        if (this.proxy && this.proxy.isRemote) {
            me.proxy.on("exception", me.onProxyException, me);
            me.proxy.on("beforerequest", me.buildRequestParams, me);
        }
    },

    onProxyException: function (proxy, response, operation) {
        var error = operation.getError() || "Unknown error",
            message = Ext.isString(error) ? error : ("(" + error.status + ")" + error.statusText);

        this.fireEvent("exception", proxy, response, operation);

        if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", response, { "errorMessage": message }, null, null, null, null, operation) !== false) {
            if (this.showWarningOnFailure !== false) {
                Ext.net.DirectEvent.showFailure(response, response ? response.responseText : message);
            }
        }
    },

    buildRequestParams: function (proxy, operation) {
        operation._store = this;

        if (operation.allowWrite() && this.writeParameters) {
            this.buildWriteParams(operation);
        } else if (this.readParameters) {
            this.buildReadParams(operation);
        }
    },

    buildWriteParams: function (operation) {
        var prms = this.writeParameters(operation),
            action = operation.getAction(),
            params;

        params = operation.getParams() || {};

        if (prms.apply) {
            if (prms.apply["all"]) {
                Ext.apply(params, prms.apply["all"]);
            }

            if (prms.apply[action]) {
                Ext.apply(params, prms.apply[action]);
            }
        }

        if (prms.applyIf) {
            if (prms.applyIf["all"]) {
                Ext.applyIf(params, prms.applyIf["all"]);
            }

            if (prms.applyIf[action]) {
                Ext.applyIf(params, prms.applyIf[action]);
            }
        }

        operation.setParams(params);
    },

    buildReadParams: function (operation) {
        var prms = this.readParameters(operation),
            params;

        params = operation.getParams() || {};

        if (prms.apply) {
            Ext.apply(params, prms.apply);
        }

        if (prms.applyIf) {
            Ext.applyIf(params, prms.applyIf);
        }

        operation.setParams(params);
    },

    createTempProxy: function (callback, proxyConfig, sync) {
        var oldProxy = this.proxy,
            proxyId = Ext.id(),
            proxy = this.serverProxy ? Ext.createByAlias('proxy.' + this.serverProxy.type, Ext.apply({
                model: this.model,
                reader: {
                    type: oldProxy && oldProxy.reader && oldProxy.reader.type ? oldProxy.reader.type : "json",
                    rootProperty: oldProxy && oldProxy.reader ? "data." + oldProxy.reader.getRootProperty() : "data"
                },
                writer: oldProxy.writer
            }, proxyConfig || {}, this.serverProxy)) : Ext.createByAlias('proxy.page', Ext.applyIf({
                type: 'page',
                model: this.model,
                reader: {
                    type: oldProxy && oldProxy.reader && oldProxy.reader.type ? oldProxy.reader.type : "json",
                    rootProperty: oldProxy && oldProxy.reader ? "data." + oldProxy.reader.getRootProperty() : "data"
                },
                writer: oldProxy.writer
            }, proxyConfig || {})),
            scope;

        this.proxy = proxy;
        this[proxyId] = proxy;
        this._oldProxy = oldProxy;

        this.proxy.on("exception", this.onProxyException, this);
        this.proxy.on("beforerequest", this.buildRequestParams, this);

        this.proxy.on("beforerequest", function () {
            this.proxy = oldProxy;
        }, this, { single: true });

        scope = {
            proxyId: proxyId,
            callback: callback,
            proxy: this.proxy,
            oldProxy: oldProxy,
            store: this
        };

        if (callback) {
            if (sync) {
                this.proxy.onBatchComplete = Ext.Function.createInterceptor(
                    this.proxy.onBatchComplete,
                    function (batchOptions, batch) {
                        this.callback.call(this, null, !batch.hasException);
                    },
                    scope
                );
            }
            else {
                this.proxy.on(
                    "afterrequest",
                    function (proxy, request, success) {
                        this.callback.call(this, request, success);
                    },
                    scope);
            }
        }

        this.proxy.on(
            "endprocessresponse",
            function (proxy, response, operation) {
                this.proxy.destroy();
                this.proxy.clearListeners();
                delete this.store[this.proxyId];
                delete this.store._oldProxy;
            },
            scope
        );
    },

    reload: function (options) {
        return this.load(Ext.apply({}, options, this.lastOptions));
    },

    getChangedData: function (options) {
        options = options || {};

        var json = {},
            me = this,
            obj,
            newRecords = this.getNewRecords(),
            updatedRecords = this.getUpdatedRecords(),
            removedRecords = this.getRemovedRecords(),

            handleRecords = function (array) {
                var i,
                    len,
                    obj,
                    list,
                    buffer = [],
                    mappings = options.mappings !== false && this.saveMappings !== false,
                    idProp,
                    idMap;

                for (i = 0, len = array.length; i < len; i++) {
                    obj = {};
                    record = array[i];
                    idProp = record.self.idField.name;
                    idMap = record.self.idField.mapping;
                    idName = mappings ? (idMap || idProp) : idProp;
                    list = Ext.apply(obj, record.data);

                    if (list.hasOwnProperty(idProp)) {
                        if (record.phantom) {
                            if (record.clientIdProperty) {
                                list[record.clientIdProperty] = record.internalId;
                            }
                        } else {
                            list[idProp] = record.getId();
                        }
                    }

                    list = this.prepareRecord(list, record, options, record.phantom);

                    if (record.phantom && (options.skipIdForPhantomRecords !== false) && (list && list.hasOwnProperty(idName))) {
                        delete list[idName];
                        //delete list[record.clientIdProperty];
                    }

                    if (!Ext.isEmptyObj(list)) {
                        buffer.push(list);
                    }
                }

                return buffer;
            };

        if (removedRecords.length > 0) {
            obj = handleRecords.call(this, removedRecords);

            if (obj.length > 0) {
                json.Deleted = obj;
            }
        }

        if (updatedRecords.length > 0) {
            obj = handleRecords.call(this, updatedRecords);

            if (obj.length > 0) {
                json.Updated = obj;
            }
        }

        if (newRecords.length > 0) {
            obj = handleRecords.call(this, newRecords);

            if (obj.length > 0) {
                json.Created = obj;
            }
        }

        return options.encode ? Ext.util.Format.htmlEncode(json) : json;
    },

    prepareRecord: function (data, record, options, isNew) {
        var newData = {},
            field,
            idProp = record.self.idField.name,
            idMap = record.self.idField.mapping,
            m,                
            mappings,
            map = record.getFieldsMap();

        if (options.filterRecord && options.filterRecord(record) === false) {
            return;
        }

        if (options.visibleOnly && options.grid) {
            var columns = options.grid.headerCt.getVisibleGridColumns(),
                i, len;

            for (i = 0, len = columns.length; i < len; i++) {
                newData[columns[i].dataIndex] = data[columns[i].dataIndex];
            }

            data = newData;
        }

        if (options.dirtyRowsOnly && !isNew) {
            if (!record.dirty) {
                return;
            }
        }

        if (options.dirtyCellsOnly === true && !isNew) {
            newData = {};

            for (var j in data) {
                if (record.isModified(j)) {
                    newData[j] = data[j];
                }
            }

            data = newData;
        }

        if (options.filterField) {
            for (var k in data) {
                if (options.filterField(record, k, data[k]) === false) {
                    delete data[k];
                }
            }
        }

        mappings = {};
        Ext.iterate(data, function (prop, value) {
            m = map[prop];

            if (m) {
                mappings[prop] = value;
            }
        });
        data = mappings;

        if (options.mappings !== false && this.saveMappings !== false) {
            mappings = {};

            Ext.iterate(data, function (prop, value) {
                m = map[prop];

                if (m) {
                    mappings[m.mapping ? m.mapping : m.name] = value;
                }
            });

            if (options.excludeId !== true) {
                if (record.phantom) {
                    if (record.clientIdProperty) {
                        mappings[record.clientIdProperty] = record.internalId;
                    }
                } else {
                    mappings[idMap || idProp] = record.getId();
                }
            }
            else if (!(isNew && (options.skipIdForPhantomRecords === false))) {
                if (record.phantom) {
                    if (record.clientIdProperty) {
                        delete mappings[record.clientIdProperty];
                    }
                } else {
                    delete mappings[idMap || idProp];
                }
            }

            data = mappings;
        }
        else if (options.excludeId === true && !(isNew && (options.skipIdForPhantomRecords === false))) {
            if (record.phantom) {
                if (record.clientIdProperty) {
                    delete data[record.clientIdProperty];
                }
            } else {
                delete data[idProp];
            }
        }

        if (!options.ignoreSubmitEmptyValue) {
            for (var k in data) {
                field = this.getFieldByName(k);

                if (Ext.isEmpty(data[k], false) && this.isSimpleField(k, field)) {
                    switch (field.submitEmptyValue) {
                        case "null":
                            data[k] = null;
                            break;
                        case "emptystring":
                            data[k] = "";
                            break;
                        default:
                            delete data[k];
                            break;
                    }
                }
            }
        }

        if (options.prepare) {
            options.prepare(data, record);
        }

        return data;
    },

    getFieldByName: function (name) {
        var fields = this.model.getFields();
        for (var i = 0; i < fields.length ; i++) {
            var field = fields[i];

            if (name === (field.mapping || field.name)) {
                return field;
            }
        }
    },

    isSimpleField: function (name, field) {
        var f = field || this.getFieldByName(name),
            type = f ? f.getType() : "";

        return type === "int" || type === "float" || type === "boolean" || type === "date";
    },

    // Overridden only because of #853
    onFilterEndUpdate: function () {
        var me = this,
            suppressNext = me.suppressNextFilter;

        if (me.getRemoteFilter()) {
            me.getFilters().each(function (filter) {
                if (filter.getInitialConfig().filterFn) {
                    Ext.raise('Unable to use a filtering function in conjunction with remote filtering.');
                }
            });

            me.currentPage = 1;

            if (!suppressNext && !(!me.isLoaded() && !me.getAutoLoad())) { // #853: added the condifition after "!suppressNext"
                me.load();
            }
        } else if (!suppressNext) {
            me.fireEvent('datachanged', me);
            me.fireEvent('refresh', me);
        }

        if (me.trackStateChanges) {
            me.saveStatefulFilters = true;
        }

        me.fireEvent('filterchange', me, me.getFilters().getRange());
    }
});

Ext.data.ProxyStore.override({
    dirtyWarningTitle: "Uncommitted Changes",
    dirtyWarningText: "You have uncommitted changes.  Are you sure you want to reload data?",

    sync: function (options, proxyConfig) {
        var me = this,
            operations = {},
            toCreate = me.getNewRecords(),
            toUpdate = me.getUpdatedRecords(),
            toDestroy = me.getRemovedRecords(),
            needsSync = false;

        //<debug>
        if (me.isSyncing) {
            Ext.log.warn('Sync called while a sync operation is in progress. Consider configuring autoSync as false.');
        }
        //</debug>

        me.needsSync = false;

        if (toCreate.length > 0) {
            operations.create = toCreate;
            needsSync = true;
        }

        if (toUpdate.length > 0) {
            operations.update = toUpdate;
            needsSync = true;
        }

        if (toDestroy.length > 0) {
            operations.destroy = toDestroy;
            needsSync = true;
        }

        if (needsSync && me.fireEvent('beforesync', operations) !== false) {
            me.isSyncing = true;

            options = options || {};

            if (me.proxy instanceof Ext.data.proxy.Memory) {
                me.createTempProxy(Ext.emptyFn, proxyConfig, true);
            }

            me.proxy.batch(Ext.apply(options, {
                operations: operations,
                listeners: me.getBatchListeners()
            }));
        }

        return me;
    },

    onBatchException: function (batch, operation) {
        this.callParent(arguments);
        this.onProxyException(this.proxy, operation.getResponse(), operation);
    },

    addField: function (field, index, rebuildMeta) {
        if (typeof field == "string") {
            field = { name: field };
        }

        this.model.addFields([field]);

        if (rebuildMeta && this.proxy && this.proxy.reader) {
            this.proxy.reader.buildExtractors(true);
        }
    },

    rebuildMeta: function () {
        if (this.proxy && this.proxy.reader) {
            this.proxy.reader.buildExtractors(true);
        }
    },

    removeFields: function () {
        this.model.removeFields(true);
        this.removeAll();
    },

    removeField: function (name) {
        this.model.removeFields([name]);

        this.each(function (r) {
            delete r.data[name];

            if (r.modified) {
                delete r.modified[name];
            }
        });
    },

    getRecordsValues: function (options) {
        options = options || {};

        var records = (options.records ? options.records : (options.currentPageOnly ? this.getRange() : this.getAllRange())) || [],
            values = [],
            i;

        for (i = 0; i < records.length; i++) {
            var obj = {},
                dataR,
                idProp = records[i].self.idField.name;

            dataR = Ext.apply(obj, records[i].data);
            if (idProp && dataR.hasOwnProperty(idProp)) {
                if (options.excludeId === true) {
                    delete obj[idProp];
                }
                else {
                    obj[idProp] = records[i].getId();
                }
            }
            dataR = this.prepareRecord(dataR, records[i], options);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    isDirty: function () {
        return this.getNewRecords().length > 0 || this.getUpdatedRecords().length > 0 || this.getRemovedRecords().length > 0;
    },

    _load: Ext.data.ProxyStore.prototype.load,

    load: function (options) {
        if (this.warningOnDirty && this.isDirty()) {
            Ext.Msg.confirm(
                this.dirtyWarningTitle,
                this.dirtyWarningText,
                function (btn, text) {
                    if (btn == "yes") {
                        this._load(options);
                    }
                },
                this
            );

            return this;
        }

        return this._load(options);
    },

    getAllRange: function (start, end) {
        return this.getRange(start, end);
    },

    _reload: Ext.data.ProxyStore.prototype.reload,

    reload: function (options, proxyConfig) {
        var memProxy = this.proxy instanceof Ext.data.proxy.Memory;
        if (memProxy) {
            this.createTempProxy(function (request, success) {
                if (success) {
                    if (this.store.isPagingStore && !this.store.allData) {
                        this.store.applyPaging();
                    }
                    this.oldProxy.data = request._data && request._data.data ? request._data.data : {};

                    if (this.oldProxy.reader) {
                        this.oldProxy.reader.rawData = this.oldProxy.data;
                    }
                }
            }, proxyConfig);
        }

        var result = this._reload(options);

        if (memProxy && !this.loading) {
            this.proxy.destroy();
            this.proxy.clearListeners();
            this.proxy = this._oldProxy;
            delete this.store[proxyId];
            delete this._oldProxy;
        }

        return result;
    },

    submitData: function (options, requestConfig) {
        this._submit(null, options, requestConfig);
    },

    _submit: function (data, options, requestConfig) {
        if (!data) {
            data = this.getRecordsValues(options);
        }

        if (!data || data.length === 0) {
            return false;
        }

        data = Ext.encode(data);

        if (options && options.encode) {
            data = Ext.util.Format.htmlEncode(data);
        }

        options = { params: (options && options.params) ? options.params : {} };

        if (Ext.isString(requestConfig)) {
            requestConfig = {
                url: requestConfig
            };
        }

        var config = {},
            ac = requestConfig || {},
            isClean = !!ac.url;

        ac.userSuccess = ac.success;
        ac.userFailure = ac.failure;
        delete ac.success;
        delete ac.failure;
        ac.extraParams = options.params;
        ac.enforceFailureWarning = !ac.userFailure;

        if (isClean) {
            ac.cleanRequest = true;
            ac.extraParams = ac.extraParams || {};
            ac.extraParams.data = data;
        }

        Ext.apply(config, ac, {
            control: this,
            eventType: "postback",
            action: "submit",
            serviceParams: data
        });

        Ext.net.DirectEvent.request(config);
    },

    getByInternalId: function (internalId) {
        return this.getData().get(internalId);
    }
});

Ext.data.Store.override({
    commitRemoving: function (id) {
        var recs = this.removed,
            len = recs.length,
            i;

        for (i = 0; i < len; i++) {
            if (recs[i].getId() === id) {
                Ext.Array.erase(this.removed, i, 1);
                return;
            }
        }
    },

    rejectRemoving: function (id) {
        var recs = this.removed,
            len = recs.length,
            i;

        for (i = 0; i < len; i++) {
            if (recs[i].getId() === id) {
                this.insert(0, recs[i]);
                recs[i].reject();
                Ext.Array.erase(this.removed, i, 1);
                return;
            }
        }
    }
});

Ext.StoreManager.lookup("ext-empty-store").autoDestroy = false;