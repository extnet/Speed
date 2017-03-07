// @source core/tab/Bar.js

Ext.tab.Bar.override({
    initComponent: function () {
        this.callParent(arguments);

        if (this.tabPanel && this.tabPanel.tabAlign == "right") {
            this.layout.pack = "end";
        }
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
