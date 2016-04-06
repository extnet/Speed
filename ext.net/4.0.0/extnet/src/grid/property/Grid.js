Ext.grid.property.Store.override({
    setValue: function (prop, value, create) {
        var me = this,
            rec = me.getRec(prop);

        if (rec) {
            rec.set('value', value);
            me.source[prop] = value;
        } else if (create) {

            me.source[prop] = value;
            rec = new Ext.grid.property.Property({ name: prop, value: value });
            me.add(rec);
        }
    }
});

Ext.grid.property.Grid.override({
    editable: true,

    getDataField: function () {
        if (!this.dataField) {
            this.dataField = new Ext.form.Hidden({ name: this.id });

            this.on("beforedestroy", function () {
                this.dataField.destroy();
            }, this);
        }

        return this.dataField;
    },

    getChangeField: function () {
        if (!this.changeField) {
            this.changeField = new Ext.form.Hidden({ name: this.id + "_changeMap" });

            this.on("beforedestroy", function () {
                this.changeField.destroy();
            }, this);
        }

        return this.changeField;
    },

    initComponent: function () {
        this.changeMap = {};
        this.originalMap = {};
        this.callParent(arguments);

        this.propertyNames = this.propertyNames || [];

        if (!this.editable) {
            this.on("beforeedit", function () {
                return false;
            });
        }

        this.on("propertychange", this.onPropertyChangeHandler);
    },

    onPropertyChangeHandler: function (source, recordId, value, oldValue) {
        if (Ext.isDefined(this.changeMap[recordId])) {
            if (Ext.isDate(value) && Ext.isDate(this.originalMap[recordId])) {
                value = Ext.Date.clearTime(value, true);

                if (this.originalMap[recordId].getTime() === value.getTime()) {
                    delete this.changeMap[recordId];
                }
            }
            else if (this.originalMap[recordId] === value) {
                delete this.changeMap[recordId];
            }
        }
        else {
            if (Ext.isDate(value) && !Ext.isDate(oldValue)) {
                var editor = this.editingPlugin.editors.map[recordId];

                if (editor && editor.field) {
                    oldValue = Ext.Date.parse(oldValue, editor.field.format);
                }
            }

            this.originalMap[recordId] = oldValue;
            this.changeMap[recordId] = true;
        }

        this.saveSource(source);
    },

    afterRender: function () {
        this.callParent(arguments);
        if (this.hasId()) {
            this.getDataField().render(this.el.parent() || this.el);
            this.getChangeField().render(this.el.parent() || this.el);
        }
    },

    saveSource: function (source) {
        if (this.hasId()) {
            this.getDataField().setValue(Ext.encode(source || this.propStore.getSource()));
            this.getChangeField().setValue(Ext.encode(this.changeMap));
        }
    },

    setProperty: function (prop, value, create) {
        this.callParent(arguments);
        if (create) {
            this.saveSource();
        }
    },

    removeProperty: function (prop) {
        this.callParent(arguments);
        this.saveSource();
    }
});