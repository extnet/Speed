
// @source tree/plugin/TreeViewDragDrop.js

Ext.tree.ViewDropZone.override({
    getPosition: function (e, node) {
        var view = this.view,
            record = view.getRecord(node),
            y = e.getY(),
            noAppend = record.isLeaf() && view.allowLeafDrop !== true,
            noBelow = false,
            region = Ext.fly(node).getRegion(),
            fragment;

        // If we are dragging on top of the root node of the tree, we always want to append.
        if (record.isRoot()) {
            return 'append';
        }

        // Return 'append' if the node we are dragging on top of is not a leaf else return false.
        if (this.appendOnly) {
            return noAppend ? false : 'append';
        }

        if (!this.allowParentInserts) {
            noBelow = record.hasChildNodes() && record.isExpanded();
        }

        fragment = (region.bottom - region.top) / (noAppend ? 2 : 3);
        if (y >= region.top && y < (region.top + fragment)) {
            return 'before';
        }
        else if (!noBelow && (noAppend || (y >= (region.bottom - fragment) && y <= region.bottom))) {
            return 'after';
        }
        else {
            return 'append';
        }
    }
});

Ext.tree.plugin.TreeViewDragDrop.override({
    init : function (view) {
        //this.callParent(arguments);

        Ext.applyIf(view, {
            copy: this.copy,
            allowCopy: this.allowCopy
        });

        view.on("afterrender", this.onViewRender, this, { single: true }); // TODO: The github issue #178. Review after Sencha fix.

        view.panel.ddPlugin = this;
        view.ddPlugin = this;
        view.allowLeafDrop = this.allowLeafDrop;

        if (this.allowLeafDrop) {
            view.on("drop", function (node, data, overRecord, currentPosition) {
                if (currentPosition == "append" && overRecord.isLeaf()) {
                    overRecord.set("leaf", false);
                    overRecord.set("loaded", true);
                }
            });
        }
    }
});