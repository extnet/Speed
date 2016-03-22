// @source core/form/ComboBox.js

Ext.form.field.ComboBox.override({
    alwaysMergeItems: true,
    useHiddenField: true,
    simpleSubmit: false,
    checkChangeEvents: Ext.isIE ? ['change', 'propertychange', 'keyup'] : ['change', 'input', 'textInput', 'keyup', 'dragdrop'], // #648

    initComponent: function () {
        this.callParent(arguments);
        this.initMerge();
        this.includeHiddenStateToSubmitData = !this.simpleSubmit;

        if (!Ext.isEmpty(this.selectedItems) && this.store) {
            this.setInitValue(this.selectedItems);
        }
    },

    getHiddenStateName: function () {
        return this.valueHiddenName || ("_" + this.getName() + "_state");
    },

    getSubmitArray: function () {
        var state = [],
            value,
            record;

        if (!this.valueCollection || this.valueCollection.getCount() === 0) {
            value = this.getValue();
            if (!Ext.isEmpty(value)) {
                record = this.findRecordByValue(value);

                if (!record) {
                    this.mon(this.store, "load", this.syncHiddenState, this, { single: true });
                    return [{ value: value }];
                }

                return [{
                    value: record.get(this.valueField),
                    text: record.get(this.displayField),
                    index: this.store.indexOf(record)
                }];
            }

            return state;
        }

        this.valueCollection.each(function (model) {
            state.push({
                value: model.get(this.valueField),
                text: model.get(this.displayField),
                index: this.store.indexOf(model)
            });
        }, this);

        return state;
    },

    getHiddenState: function (value) {
        if (this.simpleSubmit) {
            return this.getValue();
        }

        var state = this.getSubmitArray();
        return state.length > 0 ? Ext.encode(state) : "";
    },

    onFieldMutation: function () {
        this.callParent(arguments);

        if (this.useHiddenField) {
            this.syncHiddenState();
        }
    },

    initMerge: function () {
        if (this.mergeItems) {
            if (this.store.getCount() > 0) {
                this.doMerge();
            }

            if (this.store.getCount() === 0 || this.alwaysMergeItems) {
                this.mon(this.store, "load", this.doMerge, this, { single: !this.alwaysMergeItems });
            }
        }
    },

    doMerge: function () {
        for (var mi = this.mergeItems.length - 1; mi > -1; mi--) {
            var f = this.store.model.prototype.fields, dv = {};

            for (var i = 0; i < f.length; i++) {
                dv[f.items[i].name] = f.items[i].defaultValue;
            }

            if (!Ext.isEmpty(this.displayField, false)) {
                dv[this.displayField] = this.mergeItems[mi][1];
            }

            if (!Ext.isEmpty(this.valueField, false) && this.displayField != this.valueField) {
                dv[this.valueField] = this.mergeItems[mi][0];
            }

            this.store.insert(0, new this.store.model(dv));
        }
    },

    addRecord: function (values) {
        var rowIndex = this.store.data.length,
            record = this.insertRecord(rowIndex, values);

        return { index: rowIndex, record: record };
    },

    addItem: function (text, value) {
        var rowIndex = this.store.data.length,
            record = this.insertItem(rowIndex, text, value);

        return { index: rowIndex, record: record };
    },

    insertRecord: function (rowIndex, values) {
        this.store.clearFilter(true);
        return this.store.insert(rowIndex, values || {})[0];
    },

    insertItem: function (rowIndex, text, value) {
        var dv = {};

        if (!Ext.isEmpty(this.displayField, false)) {
            dv[this.displayField] = text;
        }

        if (!Ext.isEmpty(this.valueField, false) && this.displayField != this.valueField) {
            dv[this.valueField] = value;
        }

        return this.store.insert(rowIndex, dv)[0];
    },

    removeByField: function (field, value) {
        var index = this.store.find(field, value);

        if (index < 0) {
            return;
        }

        this.store.remove(this.store.getAt(index));
    },

    removeByIndex: function (index) {
        if (index < 0 || index >= this.store.getCount()) {
            return;
        }

        this.store.remove(this.store.getAt(index));
    },

    removeByValue: function (value) {
        this.removeByField(this.valueField, value);
    },

    removeByText: function (text) {
        this.removeByField(this.displayField, text);
    },

    setValueAndFireSelect: function (v) {
        this.setValue(v);
        this.fireEvent("select", this, this.valueCollection ? this.valueCollection.items : []);
    },

    setInitValue: function (value) {
        var set = Ext.Function.bind(function (value) {
            this.setSelectedItems(value, this.fireChangeOnLoad);
            this.resetOriginalValue();
        }, this, [value]);

        if (this.store.getCount() > 0) {
            set();
        } else {
            this.mon(this.store, "load", set, this, { single: true });
            this.setInitValueSetFunction = set;
        }
    },

    onLoad: function(store, records, success) { // #660
        var me = this,
            collapse = me.collapse,
            // This flag is saying that the raw value needs updating because the displayField is
            // different from the valueFiueld, so we need a record to translate from one to the other
            // and there is no match in our valueCollewction
            value = me.valueCollection.byValue.get(me.value),
            needsValueUpdating = (me.displayField !== me.valueField && !value) || (me.picker && !me.picker.getNode(value));

        if (this.mode === "single") { // it was before #660
            this.mode = "local";
        }

        // If not returning from a query, and the value was set from a raw data value, unrelated to a record
        // because the displayField was not honoured when calculating the raw value, then we update
        // the raw value.
        if (success && needsValueUpdating && !(store.lastOptions && store.lastOptions.rawQuery)) {
            me.collapse = Ext.emptyFn;
            me.setValueOnData();
            me.collapse = collapse;
        }
    },

    createPicker: function () {
        var retval = this.callParent(arguments);

        if (this.mode == "single" && this.store.getCount() > 0) {
            this.mode = "local";
        }

        return retval;
    },

    setSelectedItems: function (items, fireChange) {
        var collapse = this.collapse;

        this.clearValue();

        if (items) {
            items = Ext.Array.from(items);

            var rec,
                values = [];

            Ext.each(items, function (item) {
                if (Ext.isDefined(item.value)) {
                    rec = this.findRecordByValue(item.value);

                    if (!rec && !isNaN(parseInt(item.value, 10)) && isFinite(item.value)) {
                        rec = this.findRecordByValue(parseInt(item.value, 10));
                    }

                    if (rec) {
                        values.push(rec);
                    }
                } else if (Ext.isDefined(item.text)) {
                    rec = this.findRecordByDisplay(item.text);
                    if (rec) {
                        values.push(rec);
                    }
                } else if (Ext.isDefined(item.index)) {
                    rec = this.store.getAt(item.index);
                    if (rec) {
                        values.push(rec);
                    }
                }
            }, this);

            this.collapse = Ext.emptyFn;

            if (fireChange !== false) {
                this.setValue(values);
            } else {
                this.suspendCheckChange++;
                this.setValue(values);
                this.suspendCheckChange--;
            }

            this.collapse = collapse;

            if (this.fireSelectOnLoad) {
                this.fireEvent("select", this, this.valueCollection ? this.valueCollection.items : []);
            }
        }
    },

    onUnbindStore: function () { // it has been overriden because of this issue: http://forums.ext.net/showthread.php?30491
        var me = this,
           picker = me.picker,
           filter = me.queryFilter;

        // The GitHub issue #515, three lines ahead.
        this.mun(this.store, "load", this.syncHiddenState, this);
        this.mun(this.store, "load", this.doMerge, this);
        this.mun(this.store, "load", this.setInitValueSetFunction, this);

        // If we'd added a local filter, remove it.
        // Listeners are unbound, so we don't need the changingFilters flag
        if (filter && !me.store.destroyed) {
            me.changingFilters = true;
            me.getStore().removeFilter(filter, true);
            me.changingFilters = false;
        }

        me.pickerSelectionModel.destroy();

        if (picker) {
            picker.bindStore(null);
        }
    },

    fireEvent: function() { // #716
        if (arguments[0] === "select") {
            arguments[2] = Ext.Array.from(arguments[2]);
        }

        return this.callParent(arguments); // #814
    }
});