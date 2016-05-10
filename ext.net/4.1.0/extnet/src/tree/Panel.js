
// @source core/tree/TreePanel.js

Ext.tree.Panel.override({
    mode: "local",
    selectionSubmit: false,

    constructor: function (config) {
        if (config && config.autoLoad) {
            delete config.autoLoad;
        }

        this.callParent(arguments);
    },

    initSelectionSubmit: function () {
        this.plugins = this.plugins || [];
        this.plugins.push(Ext.create('Ext.grid.plugin.SelectionSubmit', {}));
    },

    doSelection: function () {
        this.getSelectionSubmit().doSelection();
    },

    initSelectionData: function () {
        this.getSelectionSubmit().initSelectionData();
    },

    initComponent: function () {

        this.initSelectionSubmit();

        this.callParent(arguments);

        this.relayEvents(this.getView(), ["nodedragover"]);

        if ((Ext.isEmpty(this.selectionSubmitConfig) || this.selectionSubmitConfig.disableAutomaticSubmit !== true) && this.hasId()) {
            this.getSelectionModel().on("selectionchange", this.updateSelection, this);
            this.on("checkchange", this.updateCheckSelection, this);
            this.on("load", this.updateCheckSelection, this);
            this.on("itemappend", this.updateCheckSelection, this);
            this.on("iteminsert", this.updateCheckSelection, this);
            this.on("afterrender", this.updateCheckSelection, this, { single: true });
        }

        if (this.noLeafIcon) {
            this.addCls("x-noleaf-icon");
        }

        if (this.mode === "remote") {
            this.mode = "local";
            this.on("afterrender", function () {
                this.setMode("remote");
            }, this, { single: true });
        }
    },

    expandAll: function (callback, scope) {
        if (Ext.isBoolean(callback)) {
            var _oldTree = this.enableAnimations,
                _oldView = this.getView().animate;

            this.getView().animate = callback;
            this.enableAnimations = callback;
            this.callParent();
            this.enableAnimations = _oldTree;
            this.getView().animate = _oldView;
        } else {
            this.callParent(arguments);
        }
    },

    collapseAll: function (callback, scope) {
        if (Ext.isBoolean(callback)) {
            var _oldTree = this.enableAnimations,
                _oldView = this.getView().animate;

            this.getView().animate = callback;
            this.enableAnimations = callback;
            this.callParent();
            this.enableAnimations = _oldTree;
            this.getView().animate = _oldView;
        } else {
            this.callParent(arguments);
        }
    },

    filterBy: function (fn, config) {
        config = config || {};

        if (config.autoClear) {
            this.store.clearFilter();
        }

        var f = function (n) {
            var m = fn.call(config.scope || n, n),
                child;

            if (!m) {
                //child = n.findChildBy(fn, config.scope || n, true);
                child = n.findChild("visible", true, true);

                if (!child) {
                    return false;
                }
            } 

            return true;
        };

        this.store.filterBy(f, this);

        if (config.expandNodes !== false) {
            this.expandAll();
        }
    },

    clearFilter: function (collapse) {
        if (collapse) {
            this.collapseAll();
        }

        this.store.clearFilter();
    },

    // cfg : (required)ids, (optional)value, (optional)keepExisting, (optional)silent
    setChecked: function (cfg) {
        cfg = cfg || {};

        var originFn = this.updateCheckSelection;
        this.updateCheckSelection = Ext.emptyFn;

        if (cfg.silent) {
            this.suspendEvents();
        }

        if (cfg.keepExisting !== true) {
            this.clearChecked();
        }

        cfg.value = Ext.isDefined(cfg.value) ? cfg.value : true;

        if (cfg.ids) {
            for (var i = 0, l = cfg.ids.length; i < l; i++) {
                var node = this.store.getNodeById(cfg.ids[i]);

                node.set('checked', cfg.value);
                this.fireEvent('checkchange', node, cfg.value);
            }
        }

        if (cfg.nodes) {
            for (var i = 0, l = cfg.nodes.length; i < l; i++) {
                var node = cfg.nodes[i];

                node.set('checked', cfg.value);
                this.fireEvent('checkchange', node, cfg.value);
            }
        }

        this.updateCheckSelection = originFn;
        this.updateCheckSelection();
        if (cfg.silent) {
            this.resumeEvents();
        }
    },

    toggleChecked: function (startNode, value) {
        startNode = startNode || this.getRootNode();

        var f = function (node) {
            var oldValue = node.get("checked");

            if (Ext.isBoolean(oldValue) && oldValue !== value) {
                node.set('checked', value);
                this.fireEvent('checkchange', node, value);
            }
        };

        var originFn = this.updateCheckSelection;
        this.updateCheckSelection = Ext.emptyFn;

        startNode.cascadeBy(f, this);

        this.updateCheckSelection = originFn;
        this.updateCheckSelection();
    },

    clearChecked: function (startNode) {
        this.toggleChecked(startNode, false);
    },

    setAllChecked: function (startNode) {
        this.toggleChecked(startNode, true);
    },

    afterRender: function () {
        this.callParent(arguments);

        if ((Ext.isEmpty(this.selectionSubmitConfig) || this.selectionSubmitConfig.disableAutomaticSubmit !== true) && this.hasId()) {
            this.getSelectionModelField().render(this.el.parent() || this.el);
            this.getCheckNodesField().render(this.el.parent() || this.el);
        }
    },

    getSelectionModelField: function () {
        if (!this.selectionModelField) {
            this.selectionModelField = new Ext.form.field.Hidden({ name: this.selectedHiddenName || (this.id + "_SM") });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.selectionModelField);
        }

        return this.selectionModelField;
    },

    getCheckNodesField: function () {
        if (!this.checkNodesField) {
            this.checkNodesField = new Ext.form.field.Hidden({ name: this.checkedHiddenName || (this.id + "_CheckNodes") });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.checkNodesField);
        }

        return this.checkNodesField;
    },

    excludeAttributes: [
        "parentId",
        "index",
        "leaf",
        "depth",
        "expanded",
        "expandable",
        "cls",
        "icon",
        "iconCls",
        "root",
        "isLast",
        "isFirst",
        "allowDrag",
        "allowDrop",
        "loaded",
        "loading",
        "href",
        "hrefTarget",
        "qtip",
        "qtitle",
        "qshowDelay",
        "children",
        "dataPath",
        "selected",
        "visible"
    ],

    defaultAttributeFilter: function (attrName, attrValue) {
        return typeof attrValue != "function" && Ext.Array.indexOf(this.excludeAttributes, attrName) == -1;
    },

    defaultNodeFilter: function (node) {
        return true;
    },

    serializeTree: function (config) {
        config = config || {};

        if (Ext.isEmpty(config.withChildren)) {
            config.withChildren = true;
        }

        return Ext.encode(this.convertToSubmitNode(this.getRootNode(), config));
    },

    convertToSubmitNode: function (node, config) {
        config = config || {};

        if (!config.prepared) {
            config.attributeFilter = config.attributeFilter || Ext.Function.bind(this.defaultAttributeFilter, this);
            config.nodeFilter = config.nodeFilter || Ext.Function.bind(this.defaultNodeFilter, this);
            config.prepared = true;
        }

        if (!config.nodeFilter(node)) {
            return;
        }

        var sNode = {},
            path = node.getPath(config.pathAttribute),
            deleteAttrs = true;

        if (config.attributeFilter(node.idProperty, node.getId())) {
            sNode.nodeID = node.getId();
        }

        if (config.attributeFilter(node.clientIdProperty, node.internalId)) {
            sNode.clientID = node.internalId;
        }

        if (config.attributeFilter(this.displayField, node.data[this.displayField])) {
            sNode.text = config.encode ? Ext.util.Format.htmlEncode(node.data[this.displayField]) : node.data[this.displayField];
        }

        if (config.attributeFilter("path", path)) {
            sNode.path = path;
        }

        sNode.attributes = {};

        for (var attr in node.data) {
            if (attr == node.idProperty || attr == this.displayField) {
                continue;
            }

            var attrValue = node.data[attr];

            if (config.attributeFilter(attr, attrValue)) {
                sNode.attributes[attr] = attrValue;
                deleteAttrs = false;
            }
        }

        if (deleteAttrs) {
            delete sNode.attributes;
        }

        if (config.withChildren) {
            var children = node.childNodes;

            if (children.length !== 0) {
                sNode.children = [];

                for (var i = 0; i < children.length; i++) {
                    var cNode = this.convertToSubmitNode(children[i], config);

                    if (!Ext.isEmpty(cNode)) {
                        sNode.children.push(cNode);
                    }
                }

                if (sNode.children.length === 0) {
                    delete sNode.children;
                }
            }
        }

        return sNode;
    },

    getSelectedNodes: function (config) {
        var selection = this.getSelectionModel().getSelection(),
            selNodes = [];

        if (!selection || selection.length == 0) {
            return [];
        }

        Ext.each(selection, function (node) {
            selNodes.push(this.convertToSubmitNode(node, config));
        }, this);

        return selNodes;
    },

    // Fix for a locking tree, see github issue #250
    // Remove after Sencha fix
    getChecked: function () {
        var view = this.getView();

        if (view.lockedView) {
            view = view.lockedView;
        }

        return view.getChecked();
    },

    getCheckedNodes: function (config) {
        var checkedNodes = this.getChecked();

        if (Ext.isEmpty(checkedNodes)) {
            return [];
        }

        var nodes = [];

        Ext.each(checkedNodes, function (node) {
            nodes.push(this.convertToSubmitNode(node, config));
        }, this);

        return nodes;
    },

    updateSelection: function () {
        this.selectionSubmitConfig = this.selectionSubmitConfig || {};

        if (Ext.isEmpty(this.selectionSubmitConfig.withChildren)) {
            this.selectionSubmitConfig.withChildren = false;
        }

        var selection = this.getSelectedNodes(this.selectionSubmitConfig);

        if (!Ext.isEmpty(selection)) {
            this.getSelectionModelField().setValue(Ext.encode(selection));
        } else {
            this.getSelectionModelField().setValue("");
        }
    },

    updateCheckSelection: function () {
        this.selectionSubmitConfig = this.selectionSubmitConfig || {};

        if (Ext.isEmpty(this.selectionSubmitConfig.withChildren)) {
            this.selectionSubmitConfig.withChildren = false;
        }

        var selection = this.getCheckedNodes(this.selectionSubmitConfig);

        if (!Ext.isEmpty(selection)) {
            this.getCheckNodesField().setValue(Ext.encode(selection));
        } else {
            this.getCheckNodesField().setValue("");
        }
    },

    submitNodes: function (config) {
        var nodes = this.serializeTree(config),
            ac = Ext.apply(this.directEventConfig || {}, config);

        if (ac.params) {
            ac.extraParams = ac.params;
            delete ac.params;
        }

        if (ac.callback) {
            ac.userCallback = ac.callback;
            delete ac.callback;
        }

        if (ac.scope) {
            ac.userScope = ac.scope;
            delete ac.scope;
        }

        if (this.submitUrl && !ac.url) {
            ac.url = this.submitUrl;
        }

        Ext.apply(ac, {
            control: this,
            eventType: "postback",
            action: "submit",
            serviceParams: nodes,
            userSuccess: this.submitSuccess,
            userFailure: this.submitFailure
        });

        if (ac.cleanRequest || ac.url) {
            ac.extraParams = ac.extraParams || {};
            ac.extraParams.data = ac.serviceParams;
            delete ac.serviceParams;
        }

        Ext.net.DirectEvent.request(ac);
    },

    submitFailure: function (response, result, context, type, action, extraParams, o) {
        var msg = { message: result.errorMessage || response.statusText };

        if (o && o.userCallback) {
            o.userCallback.call(o.userScope || context, o, false, response);
        }

        if (!context.hasListener("submitexception")) {
            if (o.showWarningOnFailure !== false && o.cancelFailureWarning !== true) {
                Ext.net.DirectEvent.showFailure(response, msg.message);
            }
        }

        context.fireEvent("submitexception", context, o, response, msg);
    },

    submitSuccess: function (response, result, context, type, action, extraParams, o) {
        try {
            var responseObj = result.serviceResponse || result;
            result = { success: responseObj.success, msg: responseObj.message };
        } catch (e) {
            if (o && o.userCallback) {
                o.userCallback.call(o.userScope || context, o, false, response);
            }

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage": e.message }, null, null, null, null, o) !== false) {
                if (!context.hasListener("submitexception")) {
                    if (o.showWarningOnFailure !== false) {
                        Ext.net.DirectEvent.showFailure(response, e.message);
                    }
                }
            }

            context.fireEvent("submitexception", context, o, response, e);

            return;
        }

        if (result.success === false) {
            if (o && o.userCallback) {
                o.userCallback.call(o.userScope || context, o, false, response);
            }

            if (Ext.net.DirectEvent.fireEvent("ajaxrequestexception", {}, { "errorMessage": result.msg }, null, null, null, null, o) !== false) {
                if (!context.hasListener("submitexception")) {
                    if (o.showWarningOnFailure !== false) {
                        Ext.net.DirectEvent.showFailure(response, result.msg);
                    }
                }
            }

            context.fireEvent("submitexception", context, o, response, { message: result.msg });

            return;
        }

        if (o && o.userCallback) {
            o.userCallback.call(o.userScope || context, o, true, response);
        }

        context.fireEvent("submit", context, o);
    },

    //---remote mode section------

    setMode: function (mode) {
        if (mode === "remote" && this.mode === "local") {
            this.localActions = this.localActions || [];

            if (this.isEditable) {
                this.on("edit", this.onRemoteNodeEditComplete, this);
                this.on("canceledit", this.onRemoteNodeCancelEdit, this);
            }

            if (this.ddPlugin) {
                this.getView().on("beforedrop", this.onRemoteBeforeNodeDrop, this);
            }
        } else if (mode === "local" && this.mode === "remote") {
            if (this.editors) {
                Ext.each(this.editors, function (editor) {
                    editor.un("complete", this.onRemoteNodeEditComplete, this);
                    editor.un("canceledit", this.onRemoteNodeCancelEdit, this);
                }, this);
            }

            if (this.enableDD) {
                this.un("beforenodedrop", this.onRemoteBeforeNodeDrop, this);
            }
        }

        this.mode = mode;
    },

    remoteOptions: function (action, node) {
        var dc = Ext.apply({}, this.directEventConfig || {}),
		    options = { action: action, node: node, params: {} };

        if (this.fireEvent("beforeremoteaction", this, node, options, action) !== false) {
            dc.userSuccess = Ext.Function.bind(this.remoteActionSuccess, this);
            dc.userFailure = Ext.Function.bind(this.remoteActionFailure, this);
            dc.extraParams = options.params;
            dc.node = node;
            dc.control = this;
            dc.eventType = "postback";
            dc.action = action;

            if (!Ext.isEmpty(this[action + "Url"], false)) {
                dc.url = this[action + "Url"];
                dc.cleanRequest = true;
            }

            return dc;
        }

        return false;
    },

    remoteActionSuccess: function (response, result, context, type, action, extraParams, o) {
        if (o.node) {
            o.node.set("loading", false);
        }

        var rParams;

        try {
            rParams = result.extraParamsResponse || result.response || (result.d ? result.d.response : {}) || {};
            var responseObj = result.serviceResponse || result.d || result;
            result = {
                success: Ext.isDefined(responseObj.actionSuccess) ? responseObj.actionSuccess : responseObj.success,
                msg: responseObj.message,
                attributes: rParams.ra_applyObject || rParams.attributes
            };
        } catch (ex) {
            this.fireEvent("remoteactionexception", this, response, ex, o);

            if (o.cancelWarningFailure !== true &&
		        (this.directEventConfig || {}).showWarningFailure !== false &&
		        !this.hasListener("remoteactionexception")) {
                Ext.net.DirectEvent.showFailure(response, result.msg);
            }

            return;
        }

        if (result.success !== true) {
            this.fireEvent("remoteactionrefusal", this, response, { message: result.msg }, o);

            if (o.action === "raAppend" || o.action === "reInsert") {
                o.node.parentNode.removeChild(o.node);
            }
            else if (o.action === "raMove") {
                o.e.dropHandlers.cancelDrop();
            }
            else {
                o.node.reject();
            }

            return;
        }

        if (Ext.isObject(result.attributes)) {
            o.node.set(result.attributes);
        }

        if (o.action != "raEdit" && Ext.isDefined(rParams.value)) {
            o.node.set("text", rParams.value);
        }

        var id = rParams.ra_id || rParams.id;
        if (id) {
            o.node.setId(id);
        }

        switch (o.action) {
            case "raEdit":
                if (o.isRowEditing) {
                    if (Ext.isDefined(rParams.ra_newValues) || Ext.isDefined(rParams.value) || !o.fromEditor) {
                        o.node.set(rParams.ra_newValues || rParams.value || o.raConfig.newValues);
                    }
                }
                else if (Ext.isDefined(rParams.ra_newValue) || Ext.isDefined(rParams.value) || !o.fromEditor) {
                    o.node.set(o.raConfig.field, rParams.ra_newValue || rParams.value || o.raConfig.newValue);
                }
                break;
            case "raRemove":
                o.node.parentNode.removeChild(o.node);
                break;
            case "raMove":
                if (o.e.currentPosition === "append") {
                    o.e.overNode.expand();

                    if (o.e.overNode.data.loaded || o.e.overNode.isLeaf()) {
                        o.e.dropHandlers.processDrop();
                    } else {
                        o.e.dropHandlers.cancelDrop();

                        var parentNode = o.node.parentNode,
                            index = parentNode.indexOf(o.node);

                        o.node.remove();

                        o.e.overNode.on("load", function () {
                            var index = this.newParent.indexOfId(this.id),
                                node;
                            if (index >= 0) {
                                node = this.newParent.getChildAt(index);
                                node.fireEvent("move", node, this.oldParent, this.newParent, this.index);
                            }
                        }, {
                            tree: this,
                            oldParent: parentNode,
                            newParent: o.e.overNode,
                            id: o.node.getId(),
                            index: index
                        }, { single: true });
                    }
                }
                else {
                    o.e.dropHandlers.processDrop();
                }

                break;
            case "raAppend":
            case "raInsert":
                this.getSelectionModel().select(o.node);
                break;
        }

        o.node.commit();

        this.fireEvent("remote" + action.toLowerCase().substr(2) + "success", this, o.node, action, o);
        this.fireEvent("remoteactionsuccess", this, o.node, action, o);
    },

    remoteActionFailure: function (response, result, context, type, action, extraParams, o) {
        if (o.node) {
            o.node.set('loading', false);
        }

        if (o.action === "raAppend" || o.action === "reInsert") {
            o.node.parentNode.removeChild(o.node);
        }
        else if (o.action === "raMove") {
            o.e.dropHandlers.cancelDrop();
        }
        else {
            o.node.reject();
        }

        this.fireEvent("remoteactionexception", this, response, { message: response.statusText }, o);

        if (o.cancelWarningFailure !== true &&
            (this.directEventConfig || {}).showWarningFailure !== false &&
	        !this.hasListener("remoteactionexception")) {
            Ext.net.DirectEvent.showFailure(response, response.responseText);
        }
    },

    onRemoteNodeEditComplete: function (editor, e) {
        if (e.record.isNew) {
            var insert = e.record.insertAction;

            delete e.record.isNew;
            delete e.record.insertAction;

            this.appendChildRequest(e.record, insert);

            return;
        }

        this.editNode(e.record, e.field, e.value, e);
        return false;
    },

    onRemoteNodeCancelEdit: function (editor, e) {
        if (e.record.isNew) {
            e.record.parentNode.removeChild(editor.record);
        }
    },

    performRemoteAction: function (config) {
        if (config.cleanRequest) {
            if (this.remoteJson) {
                config.json = true;
                config.method = "POST";
            }

            config.extraParams = Ext.apply(config.extraParams, config.raConfig);
            config.type = "load";
        } else {
            config.serviceParams = Ext.encode(config.raConfig);
        }

        config.node.set('loading', true);
        Ext.net.DirectEvent.request(config);
    },

    appendChildRequest: function (node, insert) {
        if (this.mode === "local" || Ext.Array.indexOf(this.localActions, insert ? "insert" : "append") !== -1) {
            return;
        }

        var dc = this.remoteOptions("ra" + (insert ? "Insert" : "Append"), node);

        if (dc !== false && this.fireEvent("beforeremote" + (insert ? "insert" : "append"), this, node, dc.extraParams, insert) !== false) {
            dc.raConfig = {
                id: node.getId(),
                parentId: node.parentNode.getId(),
                text: this.convertText(node.data.text),
                index: node.parentNode.indexOf(node)
            };

            this.performRemoteAction(dc);
        }
    },

    editNode: function (node, field, value, e) {
        field = field || "text";
        if (this.mode === "local" || Ext.Array.indexOf(this.localActions, "edit") !== -1) {
            if (!e) {
                node.set(field, value);
            }
            return;
        }

        var dc = this.remoteOptions("raEdit", node);

        if (dc !== false && this.fireEvent("beforeremoteedit", this, node, dc.extraParams) !== false) {
            dc.raConfig = {
                id: node.getId(),
                field: field,
                newValue: this.convertText(value),
                oldValue: this.convertText(e ? e.originalValue : node.get(field))
            };

            if (e && e.newValues) {
                dc.raConfig.newValues = e.newValues;
                dc.raConfig.oldValues = e.originalValues;
                dc.raConfig.isRow = true;
                delete dc.raConfig.field;
                delete dc.raConfig.newValue;
                delete dc.raConfig.oldValue;

                dc.isRowEditing = true;
            }

            dc.fromEditor = !!e;

            this.performRemoteAction(dc);
        }
    },

    convertText: function (text) {
        if (!Ext.isString(text)) {
            return text;
        }

        if (text == "&#160;") {
            return "";
        }

        return Ext.util.Format.htmlEncode(text);
    },

    onRemoteBeforeNodeDrop: function (node, data, overRecord, currentPosition, dropHandlers) {
        if (this.mode === "local" || Ext.Array.indexOf(this.localActions, "move") !== -1) {
            return true;
        }

        this.moveNodeRequest(node, data, overRecord, currentPosition, dropHandlers);
        dropHandlers.wait = true;
        return false;
    },

    moveNodeRequest: function (node, data, overNode, currentPosition, dropHandlers) {
        if (this.mode === "local" || Ext.Array.indexOf(this.localActions, "move") !== -1) {
            return;
        }

        var dc = this.remoteOptions("raMove", data.records[0]);

        if (dc !== false && this.fireEvent("beforeremotemove", this, data.records, overNode, {
            node: node,
            data: data,
            overNode: overNode,
            currentPosition: currentPosition,
            dropHandlers: dropHandlers
        }, dc.extraParams) !== false) {

            dc.e = {
                dropHandlers: dropHandlers,
                data: data,
                overNode: overNode,
                currentPosition: currentPosition
            };

            var ids = [],
                parentIds = [];
            Ext.each(data.records, function (r) {
                ids.push(r.getId());
                parentIds.push(r.parentNode.getId());
            });

            dc.raConfig = {
                ids: ids,
                targetId: overNode.getId(),
                parentIds: parentIds,
                point: currentPosition
            };

            dropHandlers.wait = true;

            this.performRemoteAction(dc);
        }
    },

    removeNode: function (node) {
        if (node.isRoot()) {
            return;
        }

        if (this.mode === "local" || Ext.Array.indexOf(this.localActions, "remove") !== -1) {
            node.parentNode.removeChild(node);
            return;
        }

        var dc = this.remoteOptions("raRemove", node);

        if (dc !== false && this.fireEvent("beforeremoteremove", this, node, dc.extraParams) !== false) {
            dc.raConfig = {
                id: node.getId(),
                parentId: node.parentNode.getId()
            };

            this.performRemoteAction(dc);
        }
    },

    appendChild: function (parentNode, defaultText, insert, index) {
        var node = parentNode,
		    nodeAttr = {},
		    child;

        if (node.isLeaf()) {
            //node.set("leaf", false);
            //node.set("loaded", true);
            node.data.leaf = false;
            node.data.loaded = true;
            this.store.fireEvent('update', this, node, Ext.data.Model.EDIT, null);
        }

        this.getView().animate = false;
        node.expand(false);
        this.getView().animate = this.enableAnimations;

        if (Ext.isString(defaultText)) {
            nodeAttr = { text: defaultText || "", loaded: true, leaf: true };
        } else {
            nodeAttr = Ext.applyIf(defaultText, { text: "", loaded: true });
        }

        if (insert) {
            var beforeNode = index ? node.childNodes[index] : node.firstChild;
            child = node.insertBefore(nodeAttr, beforeNode);
        } else {
            child = node.appendChild(nodeAttr);
        }

        child.isNew = true;
        child.insertAction = insert;

        this.startEdit(child, this.headerCt.items.items[0]);
    },

    insertBefore: function (node, defaultText) {
        var nodeAttr = {},
		    child;

        if (Ext.isString(defaultText)) {
            nodeAttr = { text: defaultText || "", loaded: true, leaf: true };
        } else {
            nodeAttr = Ext.applyIf(defaultText, { text: "", loaded: true });
        }

        child = node.parentNode.insertBefore(nodeAttr, node);

        child.isNew = true;
        child.insertAction = true;

        this.startEdit(child, this.headerCt.items.items[0]);
    },

    startEdit: function (node, columnHeader) {
        if (typeof node === "string") {
            node = this.store.getNodeById(node);
        }

        this.getSelectionModel().select(node);

        if (this.editingPlugin) {
            this.editingPlugin.startEdit(node, columnHeader);
        }
    },

    completeEdit: function () {
        if (this.editingPlugin) {
            this.editingPlugin.completeEdit();
        }
    },

    cancelEdit: function () {
        if (this.editingPlugin) {
            this.editingPlugin.cancelEdit();
        }
    }
});