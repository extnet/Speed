
Ext.define('Ext.ux.DataView.Draggable', {
    requires: 'Ext.dd.DragZone',

    
    ghostCls: 'x-dataview-draggable-ghost',

    
    ghostTpl: [
        '<tpl for=".">',
            '{title}', // eslint-disable-line indent
        '</tpl>'
    ],

    

    

    init: function(dataview, config) {
        
        this.dataview = dataview;

        dataview.on('render', this.onRender, this);

        Ext.apply(this, {
            itemSelector: dataview.itemSelector,
            ghostConfig: {}
        }, config || {});

        Ext.applyIf(this.ghostConfig, {
            itemSelector: 'img',
            cls: this.ghostCls,
            tpl: this.ghostTpl
        });
    },

    
    onRender: function() {
        var me = this,
            config = Ext.apply({}, me.ddConfig || {}, {
                dvDraggable: me,
                dataview: me.dataview,
                getDragData: me.getDragData,
                getTreeNode: me.getTreeNode,
                afterRepair: me.afterRepair,
                getRepairXY: me.getRepairXY
            });

        
        me.dragZone = Ext.create('Ext.dd.DragZone', me.dataview.getEl(), config);

        // This is for https://www.w3.org/TR/pointerevents/ platforms.
        // On these platforms, the pointerdown event (single touchstart) is reserved for
        // initiating a scroll gesture. Setting the items draggable defeats that and
        // enables the touchstart event to trigger a drag.
        //
        // Two finger dragging will still scroll on these platforms.
        me.dataview.setItemsDraggable(true);
    },

    getDragData: function(e) {
        var draggable = this.dvDraggable,
            dataview = this.dataview,
            selModel = dataview.getSelectionModel(),
            target = e.getTarget(draggable.itemSelector),
            selected, dragData;

        if (target) {
            // preventDefault is needed here to avoid the browser dragging the image
            // instead of dragging the container like it's supposed to
            e.preventDefault();

            if (!dataview.isSelected(target)) {
                selModel.select(dataview.getRecord(target));
            }

            selected = dataview.getSelectedNodes();
            dragData = {
                copy: true,
                nodes: selected,
                records: selModel.getSelection(),
                item: true
            };

            if (selected.length === 1) {
                dragData.single = true;
                dragData.ddel = target;
            }
            else {
                dragData.multi = true;
                dragData.ddel = draggable.prepareGhost(selModel.getSelection());
            }

            return dragData;
        }

        return false;
    },

    getTreeNode: function() {
        // console.log('test');
    },

    afterRepair: function() {
        var nodes = this.dragData.nodes,
            length = nodes.length,
            i;

        this.dragging = false;

        // FIXME: Ext.fly does not work here for some reason, only frames the last node
        for (i = 0; i < length; i++) {
            Ext.get(nodes[i]).frame('#8db2e3', 1);
        }
    },

    
    getRepairXY: function(e) {
        var repairEl, repairXY;

        if (this.dragData.multi) {
            return false;
        }
        else {
            repairEl = Ext.get(this.dragData.ddel);
            repairXY = repairEl.getXY();

            // take the item's margins and padding into account to make the repair animation
            // line up perfectly
            repairXY[0] += repairEl.getPadding('t') + repairEl.getMargin('t');
            repairXY[1] += repairEl.getPadding('l') + repairEl.getMargin('l');

            return repairXY;
        }
    },

    
    prepareGhost: function(records) {
        return this.createGhost(records).getEl().dom;
    },

    
    createGhost: function(records) {
        var me = this,
            store;

        if (me.ghost) {
            (store = me.ghost.store).loadRecords(records);
        }
        else {
            store = Ext.create('Ext.data.Store', {
                model: records[0].self
            });

            store.loadRecords(records);

            me.ghost = Ext.create('Ext.view.View', Ext.apply({
                renderTo: document.createElement('div'),
                store: store
            }, me.ghostConfig));

            me.ghost.container.skipGarbageCollection = me.ghost.el.skipGarbageCollection = true;
        }

        store.clearData();

        return me.ghost;
    },

    destroy: function() {
        var ghost = this.ghost;

        if (ghost) {
            ghost.container.destroy();
            ghost.destroy();
        }

        this.callParent();
    }
});

// @source: dataview/overrides/Draggable.js
Ext.define('Ext.ux.DataView.Draggable', {
    override: 'Ext.ux.DataView.Draggable',

    constructor: function (config) {
        Ext.apply(this, config);
        this.callParent(arguments);
    }
});
