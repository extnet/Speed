
// @source core/menu/DatePicker.js

Ext.menu.DatePicker.override({
    initComponent : function () {
        var me = this,
            cfg = Ext.apply({}, me.pickerConfig || me.initialConfig);

        // Ensure we clear any listeners so they aren't duplicated
        delete cfg.listeners;

        Ext.apply(me, {
            showSeparator: false,
            plain: true,
            bodyPadding: 0, // remove the body padding from the datepicker menu item so it looks like 3.3
            items: Ext.applyIf({
                cls: Ext.baseCSSPrefix + 'menu-date-item',
                margin: 0,
                border: false,
                id: me.pickerId,
                xtype: 'datepicker'
            }, cfg)
        });

        Ext.menu.DatePicker.superclass.initComponent.call(this, arguments);

        me.picker = me.down('datepicker');
        me.relayEvents(me.picker, ['select']);

        if (me.hideOnClick) {
            me.on('select', me.hidePickerOnSelect, me);
        }
    }
});