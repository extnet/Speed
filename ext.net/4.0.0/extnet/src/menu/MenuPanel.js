// @source core/menu/MenuPanel.js

Ext.define("Ext.net.MenuPanel", {
    extend: "Ext.panel.Panel",
    alias: "widget.netmenupanel",
    saveSelection: true,
    selectedIndex: -1,
    layout: "fit",

    initComponent: function () {
        this.menu = Ext.apply(this.menu, {
            floating: false,
            border: false
        });

        this.items = [this.menu];

        this.callParent(arguments);

        this.menu = this.items.get(0);
        this.menu.layout = {
            type: 'vbox',
            align: 'stretch',
            autoSize: false,
            overflowHandler: 'Scroller'
        };

        if (this.selectedIndex > -1) {
            var item = this.menu.items.get(this.selectedIndex),
                fn = function () {
                    this.onFocus();
                    this.onFocusLeaveOriginal = this.onFocusLeave;
                    this.onFocusLeave = Ext.emptyFn;
                };

            if (item.rendered) {
                fn.call(item);
            } else {
                item.on("afterrender", fn, item, { single: true });
            }

            this.getSelIndexField().setValue(this.selectedIndex);
        }

        this.menu.on("click", this.setSelection, this);
    },

    setSelectedIndex: function (index) {
        this.setSelection(this.menu, this.menu.getComponent(index));
    },

    getSelIndexField: function () {
        if (!this.selIndexField) {
            this.selIndexField = new Ext.form.Hidden({ id: this.id + "_SelIndex", name: this.id + "_SelIndex" });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.selIndexField, { single: true });
        }

        return this.selIndexField;
    },

    setSelection: function (menu, item, e) {
        var selectedItem;

        if (this.saveSelection) {
            if (arguments.length === 1) {
                item = menu;
            }

            selectedItem = this.menu.getComponent(this.selectedIndex);

            if (selectedItem && selectedItem.onFocusLeaveOriginal) {
                selectedItem.onFocusLeave = selectedItem.onFocusLeaveOriginal;
            }

            if (item) {
                this.clearSelection();
                this.selectedIndex = this.menu.items.indexOf(item);
                this.getSelIndexField().setValue(this.selectedIndex);
                item.onFocus();
                item.onFocusLeaveOriginal = item.onFocusLeave;
                item.onFocusLeave = Ext.emptyFn;
            }
        }
    },

    clearSelection: function () {
        var selectedCmp;

        if (this.selectedIndex > -1) {
            selectedCmp = this.menu.getComponent(this.selectedIndex);

            if (selectedCmp) {
                selectedCmp.onFocusLeave();
            }
        }

        this.selectedIndex = -1;
        this.getSelIndexField().setValue(null);
    },

    afterRender: function () {
        this.callParent(arguments);

        if (this.hasId()) {
            this.getSelIndexField().render(this.el.parent() || this.el);
        }
    }
});
