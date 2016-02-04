// @source core/tab/Bar.js

Ext.tab.Bar.override({
    initComponent: function () {
        this.callParent(arguments);

        if (this.tabPanel && this.tabPanel.tabAlign == "right") {
            this.layout.pack = "end";
        }
    },

    closeTab: function (tab) {
        var me = this,
            card = tab.card,
            tabPanel = this.tabPanel,
            toActivate;

        toActivate = me.findNextActivatable(tab);
        Ext.suspendLayouts();

        if (tabPanel && card) {
            if (!tabPanel.closeTab(card)) {
                Ext.resumeLayouts(true);
                return false;
            }
        }

        me.remove(tab);
        delete tab.ownerCt;

        if (toActivate) {
            if (tabPanel) {
                tabPanel.setActiveTab(toActivate.card);
            } else {
                me.setActiveTab(toActivate);
            }
            toActivate.focus();
        }
        Ext.resumeLayouts(true);
    },

    privates: {
        beforeFocusableChildFocus: function (child, e) {
            if (!child.isPanel) {
                return;
            }

            this.callParent(arguments);
        }
    }
});
