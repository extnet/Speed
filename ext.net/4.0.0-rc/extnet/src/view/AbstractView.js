Ext.view.AbstractView.override({
    onUpdate: function (store, record) {
        var me = this,
            index;

        if (store.indexOf) {
            index = store.indexOf(record);
        } else if (record.parentNode) {
            index = record.parentNode.indexOf(record);
        }

        me.fireEvent('beforeitemupdate', me, record, index);

        me.callParent(arguments);
    },

    onRemove: function (ds, records, index) {
        var i;

        for (i = records.length - 1; i >= 0; --i) {
            this.fireEvent('beforeitemremove', this, records[i], index + i);
        }

        this.callParent(arguments);
    }
});