Ext.define('Ext.view.BoundListKeyNavSelectBox', {
    extend: 'Ext.view.BoundListKeyNav',
    alias: 'view.navigation.boundlistselectbox',

    onKeyEnd: function (keyEvent) {
        this.view.pickerField.selectLast();
    },

    onKeyHome: function (keyEvent) {
        this.view.pickerField.selectFirst();
    },

    onKeyPageDown: function (keyEvent) {
        this.view.pickerField.selectNextPage();
    },

    onKeyPageUp: function (keyEvent) {
        this.view.pickerField.selectPrevPage();
    }
});

Ext.define('Ext.ux.SelectBox', {
    extend: "Ext.form.field.ComboBox",
    alias: "widget.selectbox",

    constructor: function (config) {
        this.searchResetDelay = 1000;
        config = Ext.merge(config || {}, {
            editable: false,
            forceSelection: true,
            rowHeight: false,
            lastSearchTerm: "",
            triggerAction: "all",
            queryMode: "local",
            listConfig: {
                navigationModel: "boundlistselectbox",
                listeners: {
                    refresh: {
                        fn: this.calcRowsPerPage,
                        scope: this,
                        delay: 100
                    },
                    afterRender: function () {
                        this.listEl.unselectable();
                    },
                    itemmouseenter: {
                        fn: function (view, record, node, index) {
                            this.lastSelectedIndex = index + 1;
                            this.cshTask.delay(this.searchResetDelay);
                        },
                        scope: this
                    }
                }
            }
        });

        this.callParent([config]);
        this.lastSelectedIndex = this.selectedIndex || 0;
        this.on("select", function (combo, records) {
            this.lastSelectedIndex = this.getStore().indexOf(records[0]) + 1;
        });

        if (Ext.isChrome) {
            this.on("expand", function () { this.focus(); }); // for some reason, it doesn't happen automatically in Chrome
        }
    },

    initEvents: function () {
        this.callParent(arguments);
        // you need to use keypress to capture upper/lower case and shift+key, but it doesn"t work in IE
        this.mon(this.inputEl, "keypress", this.keySearch, this);
        this.cshTask = new Ext.util.DelayedTask(this.clearSearchHistory, this);
    },

    keySearch: function (e, target, options) {
        var key;

        if (!this.store.getCount() ||
            // skip special keys other than the shift key
            ((e.hasModifier() && !e.shiftKey) || e.isNavKeyPress() || e.isSpecialKey())) {

            return;
        }

        key = String.fromCharCode(e.getKey());
        this.search(this.displayField, key.toLocaleLowerCase ? key.toLocaleLowerCase() : key.toLowerCase(), this.lastSelectedIndex, false, false, false);
        this.cshTask.delay(this.searchResetDelay);
        e.preventDefault();

        return false;
    },

    afterRender: function () {
        this.callParent(arguments);

        if (Ext.isWebKit) {
            this.inputEl.swallowEvent("mousedown", true);
        }

        this.inputEl.unselectable();
    },

    clearSearchHistory: function () {
        this.lastSearchTerm = "";
    },

    selectFirst: function () {
        this.focusAndSelect(this.store.data.first());
    },

    selectLast: function () {
        this.focusAndSelect(this.store.data.last());
    },

    selectPrevPage: function () {
        var index;

        if (!this.rowHeight) {
            return;
        }

        index = Math.max((this.store.indexOf(this.getSelectedRecord()) || 0) - this.rowsPerPage, 0);

        this.focusAndSelect(this.store.getAt(index));
    },

    selectNextPage: function () {
        var index;

        if (!this.rowHeight) {
            return;
        }

        index = Math.min((this.store.indexOf(this.getSelectedRecord()) || 0) + this.rowsPerPage, this.store.getCount() - 1);
        this.focusAndSelect(this.store.getAt(index));
    },

    search: function (field, value, startIndex, anyMatch, caseSensitive, exactMatch) {
        var index;

        if (this.lastSearchTerm !== "" && this.lastSearchTerm !== value) {
            value = this.lastSearchTerm + value;
        }

        index = this.store.find.apply(this.store, arguments);

        if (index === -1) {
            startIndex = 0;
            index = this.store.find.apply(this.store, arguments);
        }

        if (index !== -1) {
            this.lastSearchTerm = arguments[1];
            this.focusAndSelect(index);
        } else {
            this.lastSearchTerm = "";
        }
    },

    focusAndSelect: function (record) {
        var picker = this.getPicker();

        record = Ext.isNumber(record) ? this.store.getAt(record) : record;
        this.ignoreSelection++;
        picker.clearHighlight();
        picker.select(record);
        picker.getNavigationModel().setPosition(record);
        this.ignoreSelection--;

        if (this.getValue() !== record.data[this.valueField]) {
            this.setValue([record], false);
            this.fireEvent('select', this, [record]);
        }

        this.inputEl.focus();
    },

    calcRowsPerPage: function () {
        if (this.store.getCount()) {
            this.rowHeight = Ext.fly(this.picker.getNode(0)).getHeight();
            this.rowsPerPage = Math.floor(this.getPicker().listWrap.getHeight() / this.rowHeight);
        } else {
            this.rowHeight = false;
        }
    }
});