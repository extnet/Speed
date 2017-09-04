
Ext.define('Ext.ux.DataView.DragSelector', {
    requires: ['Ext.dd.DragTracker', 'Ext.util.Region'],
    alias: 'plugin.dataviewdragselector',

    
    init: function(dataview) {
        var scroller = dataview.getScrollable();

        // If the client dataview is scrollable, and this is a PointerEvents device
        // we cannot intercept the pointer to inplement dragselect.
        if (scroller && (scroller.getX() || scroller.getY()) && (Ext.supports.PointerEvents || Ext.supports.MSPointerEvents)) {
            //<debug>
            Ext.log.warn('DragSelector not available on PointerEvent devices')
            //</debug>
            return;
        }
        
        this.dataview = dataview;
        dataview.mon(dataview, {
            beforecontainerclick: this.cancelClick,
            scope: this,
            render: {
                fn: this.onRender,
                scope: this,
                single: true
            }
        });
    },

    
    onRender: function() {
        
        this.tracker = Ext.create('Ext.dd.DragTracker', {
            dataview: this.dataview,
            el: this.dataview.el,
            onBeforeStart: this.onBeforeStart,
            onStart: this.onStart.bind(this),
            onDrag : this.onDrag.bind(this),
            onEnd  : Ext.Function.createDelayed(this.onEnd, 100, this)
        });

        
        this.dragRegion = Ext.create('Ext.util.Region');
    },

    
    onBeforeStart: function(e) {
        return e.target === this.dataview.getEl().dom;
    },

    
    onStart: function(e) {
        var dataview = this.dataview;

        // Flag which controls whether the cancelClick method vetoes the processing of the DataView's containerclick event.
        // On IE (where else), this needs to remain set for a millisecond after mouseup because even though the mouse has
        // moved, the mouseup will still trigger a click event.
        this.dragging = true;

        //here we reset and show the selection proxy element and cache the regions each item in the dataview take up
        this.fillRegions();
        this.getProxy().show();
        dataview.getSelectionModel().deselectAll();
    },

    
    cancelClick: function() {
        return !this.dragging;
    },

    
    onDrag: function(e) {
        var selModel     = this.dataview.getSelectionModel(),
            dragRegion   = this.dragRegion,
            bodyRegion   = this.bodyRegion,
            proxy        = this.getProxy(),
            regions      = this.regions,
            length       = regions.length,

            startXY   = this.tracker.startXY,
            currentXY = this.tracker.getXY(),
            minX      = Math.min(startXY[0], currentXY[0]),
            minY      = Math.min(startXY[1], currentXY[1]),
            width     = Math.abs(startXY[0] - currentXY[0]),
            height    = Math.abs(startXY[1] - currentXY[1]),
            region, selected, i;

        Ext.apply(dragRegion, {
            top: minY,
            left: minX,
            right: minX + width,
            bottom: minY + height
        });

        dragRegion.constrainTo(bodyRegion);
        proxy.setBox(dragRegion);

        for (i = 0; i < length; i++) {
            region = regions[i];
            selected = dragRegion.intersect(region);

            if (selected) {
                selModel.select(i, true);
            } else {
                selModel.deselect(i);
            }
        }
    },

    
    onEnd: function(e) {
        var dataview = this.dataview,
            selModel = dataview.getSelectionModel();

        this.dragging = false;
        this.getProxy().hide();
    },

    
    getProxy: function() {
        if (!this.proxy) {
            this.proxy = this.dataview.getEl().createChild({
                tag: 'div',
                cls: 'x-view-selector'
            });
        }
        return this.proxy;
    },

    
    fillRegions: function() {
        var dataview = this.dataview,
            regions  = this.regions = [];

        dataview.all.each(function(node) {
            regions.push(node.getRegion());
        });
        this.bodyRegion = dataview.getEl().getRegion();
    }
});

// @source: dataview/overrides/DragSelector.js
Ext.define('Ext.ux.DataView.DragSelector', {
    override: 'Ext.ux.DataView.DragSelector',

    // Respects the browsers that implement PointerEvents if the data view is
    // scrollable (not enabling the drag selector at all in that case).
    // This is per this w3c recommendation: http://www.w3.org/TR/pointerevents/
    // And this option lets the user choose whether to obey it or not.
    respectPointerEvents: true,

    constructor: function (config) {
        var me = this;
        Ext.apply(me, config);
        me.callParent(arguments);
    },

    init: function (dataview) {
        var me = this,
            scroller = dataview.getScrollable();

        // Call original constructor
        me.callParent(arguments);

        // If the condition here is true, it should mean the original
        // constructor has returned earlier on PointerEvents devices,
        // not enabling the DragSelector functionality at all.
        if (scroller && (scroller.getX() || scroller.getY()) && (Ext.supports.PointerEvents || Ext.supports.MSPointerEvents)) {
            // Do not return if we are not respecting pointerEvents-capable browsers
            if (me.respectPointerEvents) {
                //<debug>
                Ext.log.warn('DragSelector not available on PointerEvent devices')
                //</debug>
                return;
            }
        }

        // This will run when either:
        // - DataView is not scrollable
        // - DataView is scrollable and browser is not PointerEvents-driven.
        this.dataview = dataview;
        dataview.mon(dataview, {
            beforecontainerclick: this.cancelClick,
            scope: this,
            render: {
                fn: this.onRender,
                scope: this,
                single: true
            }
        });
    }
});
