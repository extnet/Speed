// @source core/tab/Panel.js

Ext.tab.Panel.override({
    applyTabBar: function (tabBar) {
        if (this.tabBarItems) {
            tabBar = Ext.apply({}, tabBar, {
                items: this.tabBarItems
            });
        }

        return this.callParent([tabBar]);
    },

    initComponent: function () {
        this.callParent(arguments);

        this.on("beforetabchange", function (el, newTab) {
            newTab = newTab || {};
            var field = this.getActiveTabField();

            if (field) {
                field.setValue(this.getTabId(newTab) + ':' + el.items.indexOf(newTab));
            }
        }, this);

        this.on("render", function () {
            var field = this.getActiveTabField();

            if (field && this.hasId()) {
                field.render(this.el.parent() || this.el);
            }
        }, this, { single: true });
    },

    getTabId: function (tab) {
        return tab.id;
    },

    getActiveTabField: function () {
        if (!this.activeTabField && this.hasId()) {
            this.activeTabField = new Ext.form.field.Hidden({
                name: this.id,
                value: this.id + ":" + (this.activeTab || 0)
            });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.activeTabField);
        }

        return this.activeTabField;
    },

    closeTab: function (item, closeAction) {
        item = this.getComponent(item);

        if (Ext.isEmpty(item)) {
            return false;
        }

        var eventName = closeAction || item.closeAction || "close",
            destroy = eventName == "close" || eventName == "destroy";

        if (eventName == "destroy") {
            eventName = "close";
        }

        if (eventName != "close") {
            if (this.fireEvent("beforetabclose", this, item) === false) {
                return false;
            }

            if (item.fireEvent("beforeclose", item) === false) {
                return false;
            }
        }

        if (this.fireEvent("beforetab" + eventName, this, item) === false) {
            return false;
        }

        if (item.fireEvent("before" + eventName, item) === false) {
            return false;
        }

        if (destroy) {
            item.fireEvent("close", item);
        }

        this.fireEvent("tabclose", this, item);

        this.remove(item, destroy);

        if (!destroy) {
            item.fireEvent("close", item);
        }

        return item;
    },

    addTab: function (tab, index, activate) {
        if (tab.id && this.getComponent(tab.id)) {
            return;
        }

        var config = {};

        if (!Ext.isEmpty(index)) {
            if (typeof index == "object") {
                config = index;
            } else if (typeof index == "number") {
                config.index = index;
            } else {
                config.activate = index;
            }
        }

        if (!Ext.isEmpty(activate)) {
            config.activate = activate;
        }

        if (this.items.getCount() === 0) {
            this.activeTab = null;
        }

        if (tab.hidden && Ext.isFunction(tab.show)) {
            tab.show();
        }

        if (!Ext.isEmpty(config.index) && config.index >= 0) {
            tab = this.insert(config.index, tab);
        } else {
            tab = this.add(tab);
        }

        if (config.activate !== false) {
            this.setActiveTab(tab);
        }
    },

    setLastTabAsActive: function () {
        this.setActiveTab(this.items.getCount() - 1);
    },

    setPreviousTabAsActive: function () {
        this.setActiveTab(Math.max(0, this.items.indexOf(this.getActiveTab()) - 1));
    },

    setNextTabAsActive: function () {
        this.setActiveTab(Math.min(this.items.getCount() - 1, this.items.indexOf(this.getActiveTab()) + 1));
    }
});