Ext.view.BoundList.override({
    initComponent : function () {
        this.callParent(arguments);

        var cfg = this.initialConfig;
        if (cfg) {
            if (cfg.itemCls) {
                this.itemCls = cfg.itemCls;
            }

            if (cfg.selectedItemCls) {
                this.selectedItemCls = cfg.selectedItemCls;
            }

            if (cfg.overItemCls) {
                this.overItemCls = cfg.overItemCls;
            }

            if (cfg.itemSelector) {
                this.itemSelector = cfg.itemSelector;
            }
        }
    }
});