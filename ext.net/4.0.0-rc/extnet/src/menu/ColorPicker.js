
// @source core/menu/ColorPicker.js

Ext.menu.ColorPicker.override({
    initComponent : function () {
        var me = this,
            cfg = Ext.apply({}, me.pickerConfig || me.initialConfig);

        // Ensure we don't get duplicate listeners
        delete cfg.listeners;
        Ext.apply(me, {
            plain: true,
            showSeparator: false,
            bodyPadding: 0,
            items: Ext.applyIf({
                cls: Ext.baseCSSPrefix + 'menu-color-item',
                margin: 0,
                id: me.pickerId,
                xtype: 'colorpicker'
            }, cfg)
        });

        Ext.menu.ColorPicker.superclass.initComponent.call(this, arguments);

        me.picker = me.down('colorpicker');
        me.relayEvents(me.picker, ['select']);

        if (me.hideOnClick) {
            me.on('select', me.hidePickerOnSelect, me);
        }
    }
});