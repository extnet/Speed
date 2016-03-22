Ext.data.reader.Json.override({
    buildExtractors: function () {
        var me = this,
            _root;

        me.callParent(arguments);

        _root = me.getRoot;

        me.getRoot = function (root) {
            var data = _root(root);
            return Ext.isString(data) ? Ext.decode(data) : data;
        };
    }
});