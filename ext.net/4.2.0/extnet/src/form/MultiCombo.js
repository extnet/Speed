// @source core/form/MultiCombo.js

Ext.define("Ext.net.MultiCombo", {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.netmulticombo",

    wrapBySquareBrackets: false,
    selectionMode: "checkbox",
    multiSelect: true,
    sortByDisplayField: false,
    sortByValueField: false,

    assertValue: function () {
        this.collapse();
    },

    getPicker: function () {
        if (!this.picker) {
            this.listConfig = this.listConfig || {};

            if (!this.listConfig.getInnerTpl) {
                this.listConfig.getInnerTpl = function (displayField) {
                    return '<div class="x-combo-list-item {[this.getItemClass(values)]}">' +
                          '<div class="x-mcombo-text">{' + displayField + '}</div></div>';
                };
            }

            this.picker = this.createPicker();

            this.mon(this.picker.getSelectionModel(), 'select', this.onListSelect, this);
            this.mon(this.picker.getSelectionModel(), 'deselect', this.onListDeselect, this);

            this.picker.tpl.getItemClass = Ext.Function.bind(function (values) {
                var record,
                    //fieldValue = this.getValue(),
                    searchValue,
                    selected;

                if (this.selectionMode === "selection") {
                    return "";
                }

                Ext.each(this.store.getRange(), function (r) {
                    // do not replace == by ===
                    if (r.get(this.valueField) == values[this.valueField]) {
                        record = r;
                        return false;
                    }
                }, this);

                selected = record ? this.picker.getSelectionModel().isSelected(record) : false;

                /*if (record && !selected && !this.picker.viewReady) {
                    searchValue = record.get(this.valueField);
                    Ext.each(fieldValue, function (v){
                        if (searchValue == v) {
                            selected = true;
                            return false;
                        }
                    });         
                }*/

                if (selected) {
                    return "x-mcombo-item-checked";
                }

                return "x-mcombo-item-unchecked";

            }, this, [], true);


            if (this.selectionMode !== "checkbox") {
                this.picker.on("render", function () {
                    this.picker.overItemCls = "x-multi-selected";
                }, this);
            }

            this.picker.on("viewready", this.onViewReady, this, { single: true });
        }

        return this.picker;
    },

    onViewReady: function () {
        this.valueCollection.each(function (r) {
            this.selectRecord(r);
        }, this);
    },

    onListSelect: function (model, record) {
        if (!this.ignoreSelection) {
            this.selectRecord(record);
        }
    },

    onListDeselect: function (model, record) {
        if (!this.ignoreSelection) {
            this.deselectRecord(record);
        }
    },

    initComponent: function () {
        this.editable = false;

        this.callParent(arguments);
    },

    getDisplayValue: function () {
        var value = this.displayTpl.apply(this.displayTplData);
        return this.wrapBySquareBrackets ? "[" + value + "]" : value;
    },

    isSelected: function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
                // do not replace == by ===
                if (r.get(this.valueField) == record) {
                    record = r;
                    return false;
                }
            }, this);
        }

        return this.valueCollection.indexOf(record) !== -1;
    },

    //private
    deselectRecord: function (record) {
        if (!this.picker) {
            return;
        }

        switch (this.selectionMode) {
            case "checkbox":
                this.picker.refreshNode(this.store.indexOf(record));
                break;
            case "selection":
                if (this.picker.getSelectionModel().isSelected(record)) {
                    this.picker.deselect(this.store.indexOf(record));
                }

                break;
            case "all":
                if (this.picker.getSelectionModel().isSelected(record)) {
                    this.picker.deselect(this.store.indexOf(record));
                }

                this.picker.refreshNode(this.store.indexOf(record));
                break;
        }
    },

    //private
    selectRecord: function (record) {
        if (!this.picker) {
            return;
        }

        switch (this.selectionMode) {
            case "checkbox":
                this.picker.refreshNode(this.store.indexOf(record));
                break;
            case "selection":
                if (!this.picker.getSelectionModel().isSelected(record)) {
                    this.picker.select(this.store.indexOf(record), true);
                }

                break;
            case "all":
                if (!this.picker.getSelectionModel().isSelected(record)) {
                    this.picker.select(this.store.indexOf(record), true);
                }

                this.picker.refreshNode(this.store.indexOf(record));
                break;
        }
    },

    selectAll: function () {
        this.setValue(this.store.getRange());
    },

    deselectItem: function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
                // do not replace == by ===
                if (r.get(this.valueField) == record) {
                    record = r;
                    return false;
                }
            }, this);
        }

        if (this.valueCollection.indexOf(record) !== -1) {
            this.setValue(this.valueCollection.remove(record));
            this.deselectRecord(record);
        }
    },

    selectItem: function (record) {
        if (Ext.isNumber(record)) {
            record = this.store.getAt(record);
        }

        if (Ext.isString(record)) {
            Ext.each(this.store.getRange(), function (r) {
                // do not replace == by ===
                if (r.get(this.valueField) == record) {
                    record = r;
                    return false;
                }
            }, this);
        }

        if (this.valueCollection.indexOf(record) === -1) {
            this.valueCollection.add(record);
            this.setValue(this.valueCollection.items);
        }
    },

    getSelectedRecords: function () {
        return this.valueCollection.items;
    },

    getSelectedIndexes: function () {
        var indexes = [];

        this.valueCollection.each(function (record) {
            indexes.push(this.store.indexOf(record));
        }, this);

        return indexes;
    },

    getSelectedValues: function () {
        var values = [];

        this.valueCollection.each(function (record) {
            values.push(record.get(this.valueField));
        }, this);

        return values;
    },

    getSelectedText: function () {
        var text = [];

        this.valueCollection.each(function (record) {
            text.push(record.get(this.displayField));
        }, this);

        return text;
    },

    getSelection: function () {
        var selection = [];

        this.valueCollection.each(function (record) {
            selection.push({
                text: record.get(this.displayField),
                value: record.get(this.valueField),
                index: this.store.indexOf(record)
            });
        }, this);

        return selection;
    },

    setValue: function (value, doSelect) {
        var me = this,
            matchedRecords,
            nonRecords,
            fieldToSortBy,
            record;

        if (Ext.isEmpty(value)) {
            value = null;
        }

        me.callParent(arguments);

        this.valueCollection.each(function (r) {
            this.selectRecord(r);
        }, this);
    },

    onValueCollectionEndUpdate: function() {
        if (this.sortByDisplayField || this.sortByValueField) {
            this.valueCollection.sort(this.sortByDisplayField ? this.displayField : this.valueField, "ASC");
        }

        this.callParent(arguments);
    },

    reset: function () {
        this.callParent(arguments);
        if (this.picker && this.picker.rendered) {
            this.picker.refresh();
        }
    },

    clearValue: function () {
        this.callParent(arguments);
        if (this.picker && this.picker.rendered) {
            this.picker.refresh();
        }
    }
});