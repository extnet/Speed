
// @source core/buttons/CycleButton.js

Ext.button.Cycle.prototype.setActiveItem = Ext.Function.createSequence(Ext.button.Cycle.prototype.setActiveItem, function (item, suppressEvent) {
    if (!this.forceIcon && item.icon) {
        this.setIcon(item.icon);
    }
});

// The fix for the GitHub issue #286
Ext.button.Cycle.override({
    toggleSelected: function() {
        var me = this,
            m = me.menu,
            checkItem;

        checkItem = me.activeItem.next(':not([disabled])[setChecked]') || m.items.getAt(0);
        checkItem.setChecked(true);
    }
});
// End of the fix for GitHub issue #286