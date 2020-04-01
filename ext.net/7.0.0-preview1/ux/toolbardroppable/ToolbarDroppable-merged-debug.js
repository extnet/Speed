
Ext.define('Ext.ux.ToolbarDroppable', {

    
    constructor: function(config) {
        Ext.apply(this, config);
    },

    
    init: function(toolbar) {
        
        this.toolbar = toolbar;

        this.toolbar.on({
            scope: this,
            render: this.createDropTarget
        });
    },

    
    createDropTarget: function() {
        
        this.dropTarget = Ext.create('Ext.dd.DropTarget', this.toolbar.getEl(), {
            notifyOver: this.notifyOver.bind(this),
            notifyDrop: this.notifyDrop.bind(this)
        });
    },

    
    addDDGroup: function(ddGroup) {
        this.dropTarget.addToGroup(ddGroup);
    },

    
    calculateEntryIndex: function(e) {
        var entryIndex = 0,
            toolbar = this.toolbar,
            items = toolbar.items.items,
            count = items.length,
            xHover = e.getXY()[0],
            index = 0,
            el, xTotal, width, midpoint;

        for (; index < count; index++) {
            el = items[index].getEl();
            xTotal = el.getXY()[0];
            width = el.getWidth();
            midpoint = xTotal + width / 2;

            if (xHover < midpoint) {
                entryIndex = index;
                break;
            }
            else {
                entryIndex = index + 1;
            }
        }

        return entryIndex;
    },

    
    canDrop: function(data) {
        return true;
    },

    
    notifyOver: function(dragSource, event, data) {
        return this.canDrop.apply(this, arguments)
            ? this.dropTarget.dropAllowed
            : this.dropTarget.dropNotAllowed;
    },

    
    notifyDrop: function(dragSource, event, data) {
        var canAdd = this.canDrop(dragSource, event, data),
            tbar = this.toolbar,
            entryIndex;

        if (canAdd) {
            entryIndex = this.calculateEntryIndex(event);

            tbar.insert(entryIndex, this.createItem(data));

            this.afterLayout();
        }

        return canAdd;
    },

    
    createItem: function(data) {
        //<debug>
        Ext.raise("The createItem method must be implemented in the ToolbarDroppable plugin");
        //</debug>
    },

    
    afterLayout: Ext.emptyFn
});

// @source: toolbardroppable/ToolbarDroppable-overrides.js
Ext.define('Ext.ux.ToolbarDroppable', {
    override: 'Ext.ux.ToolbarDroppable',

    mixins: ['Ext.mixin.Observable'],

    constructor: function (config) {
        var me = this
        canDrop = undefined;

        // Method argument passed as config option does not work as
        // it tries to override the instance in place. To overcome
        // this, we leave it out of the constructor config parameters
        // and then replace the method when it has been instantiated.
        if (config.canDrop) {
            canDrop = config.canDrop;
            delete config.canDrop;
        }

        me.callParent(arguments);

        // Observable mixin cannot apply the createItem function. So let
        // it run the default constructor to replace it, then remove the
        // reference to createItem from the constructor's config before
        // calling the Observable constructor.
        if (config.createItem) {
            delete config.createItem;
        };
        me.mixins.observable.constructor.call(me, config);

        // If canDrop was saved above, then replace whatever is set as
        // canDrop method in the instance.
        if (canDrop !== undefined) {
            me.canDrop = canDrop;
        }
    },

    notifyDrop: function (dragSource, event, data) {
        var me = this,
            canAdd = me.canDrop(dragSource, event, data),
            tbar = me.toolbar,
            retVal;

        if (canAdd) {
            if (me.remote) {
                var entryIndex = me.calculateEntryIndex(event),
                    remoteOptions = { index: entryIndex },
                    dc = me.directEventConfig || {},
                    loadingItem;

                if (me.fireEvent("beforeremotecreate", me, data, remoteOptions, dragSource, event) === false) {
                    return false;
                }

                loadingItem = new Ext.toolbar.TextItem({
                    text: "<div class='x-loading-indicator' style='width:16px;'>&nbsp;</div>"
                });
                tbar.insert(entryIndex, loadingItem);

                dc.userSuccess = Ext.Function.bind(me.remoteCreateSuccess, me);
                dc.userFailure = Ext.Function.bind(me.remoteCreateFailure, me);
                dc.extraParams = remoteOptions;
                dc.control = me;
                dc.entryIndex = entryIndex;
                dc._data = data;
                dc.loadingItem = loadingItem;
                dc.eventType = "postback";
                dc.action = "create";

                Ext.net.DirectEvent.request(dc);

                me.afterLayout();
            }
            else {
                retVal = me.callParent(arguments);
            }
        }

        return retVal || canAdd;
    },

    remoteCreateSuccess: function (response, result, context, type, action, extraParams, o) {
        this.toolbar.remove(o.loadingItem);

        var rParams,
            entryIndex,
            item;

        try {
            rParams = result.extraParamsResponse || {};
            var responseObj = result.serviceResponse;
            result = { success: responseObj.success, msg: responseObj.message };
        } catch (ex) {
            result.success = false;
            result.msg = ex.message;
        }

        this.fireEvent("remotecreate", this, !!result.success, result.msg, response, o);

        entryIndex = Ext.isDefined(rParams.ra_index) ? rParams.ra_index : o.entryIndex;
        item = Ext.decode(rParams.ra_item);
        this.toolbar.insert(entryIndex, item);
        this.fireEvent("drop", this, item, entryIndex, o._data);

        this.toolbar.updateLayout();
        this.afterLayout();
    },

    remoteCreateFailure: function (response, result, context, type, action, extraParams, o) {
        this.toolbar.remove(o.loadingItem);
        this.fireEvent("remotecreate", this, false, response.responseText, response, o);

        this.toolbar.updateLayout();
        this.afterLayout();
    }
});
