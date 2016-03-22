
// @source core/Panel.js

Ext.panel.Panel.override({
    initComponent : function () {
        if (this.tbar && (this.tbar.xtype == "paging") && !Ext.isDefined(this.tbar.store) && this.store) {
            this.tbar.store = this.store;
        }
    
        if (this.bbar && (this.bbar.xtype == "paging") && !Ext.isDefined(this.bbar.store) && this.store) {
            this.bbar.store = this.store;
        }

        this.callParent(arguments);

        this.on("collapse", function(){
            var f = this.getCollapsedField();
        
            if (f) {
                f.el.dom.value = "true";
            }
        }, this);

        this.on("expand", function(){
            var f = this.getCollapsedField();
        
            if (f) {
                f.el.dom.value = "false";
            }
        }, this);
    },
    
    getCollapsedField : function () {
        if (!this.collapsedField && this.hasId()) {
            this.collapsedField = new Ext.form.Hidden({
                id    : this.id + "_Collapsed",
                name  : this.id + "_Collapsed",
                value : this.collapsed || false
            });
			
			this.on("beforedestroy", function () {
                this.destroy();
            }, this.collapsedField);	

            if (this.hasId()) {
                this.collapsedField.render(this.el.parent() || this.el);
            }
        }

        return this.collapsedField;
    },

    setIconCls : function (cls) {
        this.callParent([cls && cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls]);
    },

    setIcon : function (icon) {
        if (this.getIconCls() && icon) {
            this.setIconCls("");
        }

        this.callParent([icon && icon.indexOf('#') === 0 ? X.net.RM.getIconUrl(icon.substring(1)) : icon]);
    },

    // #1231: disables ExtJS Panel's defaultButton functionality in favor of native Ext.NET Container's defaultButton
    onBoxReady: function() { 
        var defaultButton = this.defaultButton;

        delete this.defaultButton;
        this.callParent(arguments);
        this.defaultButton = defaultButton;
    }
});

Ext.panel.Header.override({
    setIconCls : function (cls) {
        this.callParent([cls && cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls]);
    },

    setIcon : function (icon) {
        if (this.getIconCls() && icon) {
            this.setIconCls("");
        }

        this.callParent([icon && icon.indexOf('#') === 0 ? X.net.RM.getIconUrl(icon.substring(1)) : icon]);
    }
});