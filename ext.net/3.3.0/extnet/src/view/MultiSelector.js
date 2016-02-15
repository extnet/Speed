Ext.view.MultiSelector.override({
    initComponent: function () {
        this.callParent(arguments);

        if (this.hasId()) {
            this.store.on("datachanged", function () {
                this.getValueField().setValue(Ext.encode(this.getValues()));
            }, this);
        }
    },

    getValues: function () {
        var records = this.store.getRange() || [],
            record,
            values = [];

        for (var i = 0; i < records.length; i++) {
            record = records[i];
            values.push({
                text: record.get(this.fieldName),
                id: record.getId()
            });
        }

        return values;
    },

    getValueField: function () {
        if (!this.valueField && this.hasId()) {
            this.valueField = new Ext.form.Hidden({
                name: this.id
            });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.valueField);

            if (this.hasId()) {
                this.valueField.render(this.el.parent() || this.el);
            }
        }

        return this.valueField;
    }
});

Ext.view.MultiSelectorSearch.override({
    makeItems: function () {
        if (this.items) {
            return this.items;
        }

        var items = this.callParent(arguments);

        if (this.searchGridConfig) {
            Ext.apply(items[0], this.searchGridConfig);
        }

        return items;
    },

    makeDockedItems: function () {
        if (this.dockedItems) {
            return this.dockedItems;
        }

        var items = this.callParent(arguments);

        if (this.searchFieldConfig) {
            Ext.apply(items[0], this.searchFieldConfig);
        }

        return items;
    }
});