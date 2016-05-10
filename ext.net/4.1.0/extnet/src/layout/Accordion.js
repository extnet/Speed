
// @source core/layout/Accordion.js

Ext.layout.container.Accordion.override({
    updatePanelClasses: function (ownerContext) {
        this.callParent(arguments);

        for (var i = 0; i < ownerContext.visibleItems.length; i++) {
            if (this.originalHeader) {
                ownerContext.visibleItems[i].header.removeCls(Ext.baseCSSPrefix + 'accordion-hd');
            }
        }
    },

    beforeRenderItems: function (items) {
        var i, len;

        for (i = 0, len = items.length; i < len; i++) {
            if (!(items[i] instanceof Ext.panel.Panel)) {
                throw Ext.String.format("The container {0} with AccordionLayout cannot have non-Panel items: {1}", this.owner.id, items[i].id);
            }
        }

        this.callParent(arguments);
    }
});