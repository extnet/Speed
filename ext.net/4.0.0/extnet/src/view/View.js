Ext.view.View.override({
    initComponent : function () {
         this.plugins = this.plugins || [];
         this.plugins.push(Ext.create('Ext.view.plugin.SelectionSubmit', {}));

         this.callParent(arguments);
    },

    getRowsValues : function (config) {
        if (Ext.isBoolean(config)) {
            config = {selectedOnly: config};
        }
        
        config = config || {};

        var records = (config.selectedOnly === true ? this.getSelectionModel().getSelection() : this.store.getRange()) || [],
            record,
            values = [],
            dataR,
            idProp,
            i;

        for (i = 0; i < records.length; i++) {
            record = records[i];
            if (Ext.isEmpty(records[i])) {
                continue;
            }

            idProp = record.self.idField.name;
            
            dataR = Ext.apply({}, record.data);

            if (idProp && dataR.hasOwnProperty(idProp)) {
                dataR[idProp] = record.getId();
            }
            
            dataR = this.store.prepareRecord(dataR, record, config);

            if (!Ext.isEmptyObj(dataR)) {
                values.push(dataR);
            }
        }

        return values;
    },

    submitData : function (config) {
        this.store._submit(this.getRowsValues(config));
    },

    handleEvent: function (e) {
        var me = this,
            item = e.getTarget();

        if (me.destroyed || ((Ext.fly(item).parent("." + me.baseCls) == me.el) && (!me.body || me.body.contains(item)))) { // #826
            return this.callParent(arguments);
        }
    },

    handleMouseOver: function (e) {
        var me = this,
            item = e.getTarget();

        if (me.destroyed || ((Ext.fly(item).parent("." + me.baseCls) == me.el) && (!me.body || me.body.contains(item)))) { // #826
            return this.callParent(arguments);
        }
    }
});