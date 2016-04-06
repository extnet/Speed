// @source core/tip/ToolTip.js

Ext.ToolTip.override({
    // Overridden because of #671 and #857
    setTarget: function (target) {
        this.target = Ext.net.getEl(this.target); // #671
        target = Ext.net.getEl(target); // #671

        var me = this,
            t = Ext.get(target),
            tg;

        if (me.target) {
            tg = Ext.get(me.target);

            if (Ext.supports.Touch) {
                me.mun(tg, 'tap', me.onTargetOver, me);
            }

            // #857 it was inside "if (Ext.supports.Touch) {} else { here }"
            me.mun(tg, {
                mouseover: me.onTargetOver,
                mouseout: me.onTargetOut,
                mousemove: me.onMouseMove,
                scope: me
            });
        }

        me.target = t;

        if (t) {
            if (Ext.supports.Touch) {
                me.mon(t, {
                    tap: me.onTargetOver,
                    scope: me
                });
            }

            // #857, it was inside "if (Ext.supports.Touch) { } else { here }"
            me.mon(t, {
                mouseover: me.onTargetOver,
                mouseout: me.onTargetOut,
                mousemove: me.onMouseMove,
                scope: me
            });
        }

        if (me.anchor) {
            me.anchorTarget = me.target;
        }
    }
});