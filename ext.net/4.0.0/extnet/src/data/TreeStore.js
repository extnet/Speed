Ext.data.TreeStore.override({
    proxy: "page",

    constructor: function () {
        this.callParent(arguments);

        this.on("beforeload", this.addDataPath, this);
    },

    addDataPath : function (store, operation) {
        var node = operation.node || this.getById(operation.id);

        if (node && node.data.dataPath) {
            operation.setParams(Ext.apply(operation.getParams() || {}, {dataPath : node.data.dataPath}));
        }
    },

    reload: function (options) {
        var o = Ext.apply({}, options, this.lastOptions),
            node = o.node || this.getRoot();

        if (node && this.getClearOnLoad()) {
            this.unregisterNode(node, true);
        }

        this.load(o);
    }
});

Ext.data.NodeInterface.decorate = Ext.Function.createSequence(Ext.data.NodeInterface.decorate, function (modelClass) {
    var model = Ext.data.schema.Schema.lookupEntity(modelClass);

    model.addFields([        
        { name: 'dataPath', type: 'string',  defaultValue: null, persist: false},
        { name: 'selected', type: 'bool',  defaultValue: false, persist: false}
    ]);

    model.override({
        copy: function (newId, deep) {
            var me = this,
                result = me.callSuper([newId]),
                len = me.childNodes ? me.childNodes.length : 0,
                i;


            if (deep) {
                for (i = 0; i < len; i++) {
                    result.appendChild(me.childNodes[i].copy(undefined, true));
                }
            }
            return result;
        },

        reload: function (options) {
            var me = this;

            options = options || {};
            treeStore = me.getTreeStore(); // #934

            if (treeStore) {
                options = Ext.apply({
                    node: me,
                    callback: function (records, operation, success) {
                        if (success) {
                            me.expand();
                        }
                    }
                }, options);

                if (treeStore.getClearOnLoad()) {
                    treeStore.unregisterNode(me, true);
                }

                treeStore.load(options);
            } 
        }
    });
});