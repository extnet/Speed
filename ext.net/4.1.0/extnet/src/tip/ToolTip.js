// @source core/tip/ToolTip.js

Ext.tip.ToolTip.override({
    setTarget: function (target) {
        // Fix for issue #671 - ensure target is a dom element
        if (typeof (target) === "string") {
            target = Ext.net.getEl(target);
        }

        this.callParent(arguments);
    }
});