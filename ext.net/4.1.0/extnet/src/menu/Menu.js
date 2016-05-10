
// @source core/menu/Menu.js

Ext.override(Ext.menu.Menu, {
    // Defined in Ext.NET
    lastTargetIn: function (cmp) {
        return Ext.fly(cmp.getEl ? cmp.getEl() : cmp).contains(this.contextEvent.t);
    },

    privates: {
        doAutoRender: function () {
            var me = this;
            if (!me.rendered) {
                var form = Ext.net.ResourceMgr.getAspForm(),
                    ct = ((this.renderToForm !== true || !form) ? (me.renderTo || document.body) : form);
                if (me.floating) {
                    me.render(ct);
                } else {
                    me.render(Ext.isBoolean(me.autoRender) ? ct : me.autoRender);
                }
            }
        }
    }
});

Ext.override(Ext.menu.Item, {
    setIconCls: function (cls) {
        this.callParent([cls && cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls]);
    },

    setIcon: function (icon) {
        if (this.getIconCls() && icon) {
            this.setIconCls("");
        }

        this.callParent([icon && icon.indexOf('#') === 0 ? X.net.RM.getIconUrl(icon.substring(1)) : icon]);
    }
});