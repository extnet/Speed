
// @source core/dd/DragDropManager.js

Ext.override(Ext.dd.DragDropManager, {
    startDrag: function (x, y) {
        var me = this,
            current = me.dragCurrent,
            dragEl;

        clearTimeout(me.clickTimeout);

        if (current) {
            current.b4StartDrag(x, y);
            current.startDrag(x, y);
            dragEl = Ext.fly(current.getDragEl());

            if (dragEl && dragEl.dom.className && dragEl.dom.className.replace) { // Fix for http://forums.ext.net/showthread.php?27690
                dragEl.addCls(me.dragCls);
            }
        }

        me.dragThreshMet = true;
    }
});