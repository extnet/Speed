
// @source core/buttons/CycleButton.js

Ext.button.Cycle.override({
    setActiveItem: function (item, suppressEvent) {
        this.callParent(arguments);

        if (!this.forceIcon && item.icon) {
            this.setIcon(item.icon);
        }
    },

    // #286
    toggleSelected: function() {
        var me = this,
            m = me.menu,
            checkItem;

        checkItem = me.activeItem.next(':not([disabled])[setChecked]') || m.items.getAt(0); // added "setChecked"
        checkItem.setChecked(true);
    } 
});