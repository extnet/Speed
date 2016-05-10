Ext.layout.container.Column.override({
    columnWidthFlexSizePolicy: {
        readsWidth: 0,
        readsHeight: 1,
        setsWidth: 1,
        setsHeight: 1
    },

    columnFlexSizePolicy: {
        setsWidth: 0,
        setsHeight: 1
    },

    isItemShrinkWrap: function (ownerContext) {
        return !ownerContext.flex;
    },

    getItemSizePolicy: function (item, ownerSizeModel) {
        if (item.columnWidth) {
            if (!ownerSizeModel) {
                ownerSizeModel = this.owner.getSizeModel();
            }

            if (!ownerSizeModel.width.shrinkWrap) {
                return item.flex ? this.columnWidthFlexSizePolicy : this.columnWidthSizePolicy;
            }
        }
        return item.flex ? this.columnFlexSizePolicy : this.autoSizePolicy;
    },

    calculateItems: function (ownerContext, containerSize) {
        var me = this,
            items = ownerContext.childItems,
            len = items.length,
            i, itemContext,
            ownerHeight = ownerContext.target.getHeight() - ownerContext.targetContext.getPaddingInfo().height;

        for (i = 0; i < len; ++i) {
            itemContext = items[i];

            if (itemContext.target.flex) {
                itemContext.setHeight(ownerHeight);
            }
        }

        return this.callParent(arguments);
    }
});