
Ext.define('Ext.ux.DataView.Animated', {
    alias: 'plugin.ux-animated-dataview',

    
    defaults: {
        duration: 750,
        idProperty: 'id'
    },

    
    constructor: function(config) {
        Ext.apply(this, config || {}, this.defaults);
    },

    
    init: function(dataview) {
        var me = this,
            store = dataview.store,
            items = dataview.all,
            task = {
                interval: 20
            },
            duration = me.duration;

        
        me.dataview = dataview;

        dataview.blockRefresh = true;
        dataview.updateIndexes = Ext.Function.createSequence(dataview.updateIndexes, function() {
            this.getTargetEl().select(this.itemSelector).each(function(element, composite, index) {
                element.dom.id = Ext.util.Format.format(
                    "{0}-{1}", dataview.id, store.getAt(index).internalId
                );
            }, this);
        }, dataview);

        
        me.dataviewID = dataview.id;

        
        me.cachedStoreData = {};

        // catch the store data with the snapshot immediately
        me.cacheStoreData(store.data || store.snapshot);

        dataview.on('resize', function() {
            var store = dataview.store;

            if (store.getCount() > 0) {
                // reDraw.call(this, store);
            }
        }, this);

        // Buffer listenher so that rapid calls, for example a filter followed by a sort
        // Only produce one redraw.
        dataview.store.on({
            datachanged: reDraw,
            scope: this,
            buffer: 50
        });

        function reDraw() {
            var parentEl = dataview.getTargetEl(),
                parentElY = parentEl.getY(),
                parentElPaddingTop = parentEl.getPadding('t'),
                added = me.getAdded(store),
                removed = me.getRemoved(store),
                remaining = me.getRemaining(store),
                itemArray,
                i, id,
                itemFly = new Ext.dom.Fly(),
                rtl = me.dataview.getInherited().rtl,
                oldPos, newPos,
                styleSide = rtl ? 'right' : 'left',
                newStyle = {},
                oldPositions, newPositions, doAnimate;

            // Not yet rendered
            if (!parentEl) {
                return;
            }

            // Collect nodes that will be removed in the forthcoming refresh so
            // that we can put them back in order to fade them out
            Ext.iterate(removed, function(recId, item) {
                id = me.dataviewID + '-' + recId;

                // Stop any animations for removed items and ensure th.
                Ext.fx.Manager.stopAnimation(id);

                item.dom = Ext.getDom(id);

                if (!item.dom) {
                    delete removed[recId];
                }
            });

            me.cacheStoreData(store);

            // stores the current top and left values for each element (discovered below)
            oldPositions = {};
            newPositions = {};

            // Find current positions of elements which are to remain after the refresh.
            Ext.iterate(remaining, function(id, item) {
                if (itemFly.attach(Ext.getDom(me.dataviewID + '-' + id))) {
                    oldPos = oldPositions[id] = {
                        top: itemFly.getY() - parentElY - itemFly.getMargin('t') -
                             parentElPaddingTop
                    };
                    oldPos[styleSide] = me.getItemX(itemFly);
                }
                else {
                    delete remaining[id];
                }
            });

            // The view MUST refresh, creating items in the natural flow, and collecting the items
            // so that its item collection is consistent.
            dataview.refresh();

            // Replace removed nodes so that they can be faded out, THEN removed
            Ext.iterate(removed, function(id, item) {
                parentEl.dom.appendChild(item.dom);
                itemFly.attach(item.dom).animate({
                    duration: duration,
                    opacity: 0,
                    callback: function(anim) {
                        var el = Ext.get(anim.target.id);

                        if (el) {
                            el.destroy();
                        }
                    }
                });

                delete item.dom;
            });

            // We have taken care of any removals.
            // If the store is empty, we are done.
            if (!store.getCount()) {
                return;
            }

            // Collect the correct new positions after the refresh
            itemArray = items.slice();

            // Reverse order so that moving to absolute position does not affect the position of
            // the next one we're looking at.
            for (i = itemArray.length - 1; i >= 0; i--) {
                id = store.getAt(i).internalId;
                itemFly.attach(itemArray[i]);

                newPositions[id] = {
                    dom: itemFly.dom,
                    top: itemFly.getY() - parentElY - itemFly.getMargin('t') - parentElPaddingTop
                };
                newPositions[id][styleSide] = me.getItemX(itemFly);

                // We're going to absolutely position each item.
                // If it is a "remaining" one from last refesh, shunt it back to
                // its old position from where it will be animated.
                newPos = oldPositions[id] || newPositions[id];

                // set absolute positioning on all DataView items. We need to set position, left and
                // top at the same time to avoid any flickering
                newStyle.position = 'absolute';
                newStyle.top = newPos.top + "px";
                newStyle[styleSide] = newPos.left + "px";
                itemFly.applyStyles(newStyle);
            }

            // This is the function which moves remaining items to their new position
            doAnimate = function() {
                var elapsed = new Date() - task.taskStartTime,
                    fraction = elapsed / duration,
                    oldPos, newPos, oldTop, newTop, oldLeft, newLeft,
                    diffTop, diffLeft, midTop, midLeft;

                if (fraction >= 1) {
                    // At end, return all items to natural flow.
                    newStyle.position = newStyle.top = newStyle[styleSide] = '';

                    for (id in newPositions) {
                        itemFly.attach(newPositions[id].dom).applyStyles(newStyle);
                    }

                    Ext.TaskManager.stop(task);
                }
                else {
                    // In frame, move each "remaining" item according to time elapsed
                    for (id in remaining) {
                        oldPos = oldPositions[id];
                        newPos = newPositions[id];
                        oldTop = oldPos.top;
                        newTop = newPos.top;
                        oldLeft = oldPos[styleSide];
                        newLeft = newPos[styleSide];
                        diffTop = fraction * Math.abs(oldTop - newTop);
                        diffLeft = fraction * Math.abs(oldLeft - newLeft);
                        midTop = oldTop > newTop ? oldTop - diffTop : oldTop + diffTop;
                        midLeft = oldLeft > newLeft ? oldLeft - diffLeft : oldLeft + diffLeft;

                        newStyle.top = midTop + "px";
                        newStyle[styleSide] = midLeft + "px";
                        itemFly.attach(newPos.dom).applyStyles(newStyle);
                    }
                }
            };

            // Fade in new items
            Ext.iterate(added, function(id, item) {
                if (itemFly.attach(Ext.getDom(me.dataviewID + '-' + id))) {
                    itemFly.setOpacity(0);
                    itemFly.animate({
                        duration: duration,
                        opacity: 1
                    });
                }
            });

            // Stop any previous animations
            Ext.TaskManager.stop(task);
            task.run = doAnimate;
            Ext.TaskManager.start(task);

            me.cacheStoreData(store);
        }
    },

    getItemX: function(el) {
        var rtl = this.dataview.getInherited().rtl,
            parentEl = el.up('');

        if (rtl) {
            return parentEl.getViewRegion().right - el.getRegion().right + el.getMargin('r');
        }
        else {
            return el.getX() - parentEl.getX() - el.getMargin('l') - parentEl.getPadding('l');
        }
    },

    
    cacheStoreData: function(store) {
        var cachedStoreData = this.cachedStoreData = {};

        store.each(function(record) {
            cachedStoreData[record.internalId] = record;
        });
    },

    
    getExisting: function() {
        return this.cachedStoreData;
    },

    
    getExistingCount: function() {
        var count = 0,
            items = this.getExisting(),
            k; // eslint-disable-line no-unused-vars

        for (k in items) {
            count++;
        }

        return count;
    },

    
    getAdded: function(store) {
        var cachedStoreData = this.cachedStoreData,
            added = {};

        store.each(function(record) {
            if (cachedStoreData[record.internalId] == null) {
                added[record.internalId] = record;
            }
        });

        return added;
    },

    
    getRemoved: function(store) {
        var cachedStoreData = this.cachedStoreData,
            removed = {},
            id;

        for (id in cachedStoreData) {
            // eslint-disable-next-line brace-style, semi
            if (store.findBy(function(record) { return record.internalId === id }) === -1) {
                removed[id] = cachedStoreData[id];
            }
        }

        return removed;
    },

    
    getRemaining: function(store) {
        var cachedStoreData = this.cachedStoreData,
            remaining = {};

        store.each(function(record) {
            if (cachedStoreData[record.internalId] != null) {
                remaining[record.internalId] = record;
            }
        });

        return remaining;
    }
});

// @source: dataview/overrides/Animated.js

// Unfortunately we have to replace the whole init() method, and this means
// about 60% of the whole plug in code. Unfortunately the way the plugin
// has been implemented requires this in order to make even the smallest change
// to the init() method.
Ext.define('gh1632', {
    override: 'Ext.ux.DataView.Animated',
    init: function (dataview) {
        var me = this,
            store = dataview.store,
            items = dataview.all,
            task = {
                interval: 20
            },
            duration = me.duration;


        me.dataview = dataview;

        dataview.blockRefresh = true;
        dataview.updateIndexes = Ext.Function.createSequence(dataview.updateIndexes, function () {
            this.getTargetEl().select(this.itemSelector).each(function (element, composite, index) {
                element.dom.id = Ext.util.Format.format(
                    "{0}-{1}", dataview.id, store.getAt(index).internalId
                );
            }, this);
        }, dataview);


        me.dataviewID = dataview.id;


        me.cachedStoreData = {};

        // catch the store data with the snapshot immediately
        me.cacheStoreData(store.data || store.snapshot);

        dataview.on('resize', function () {
            var store = dataview.store;

            if (store.getCount() > 0) {
                // reDraw.call(this, store);
            }
        }, this);

        // Buffer listenher so that rapid calls, for example a filter followed by a sort
        // Only produce one redraw.
        dataview.store.on({
            datachanged: reDraw,
            scope: this,
            buffer: 50
        });

        function reDraw() {
            var parentEl = dataview.getTargetEl(),
                parentElY = parentEl.getY(),
                parentElPaddingTop = parentEl.getPadding('t'),
                added = me.getAdded(store),
                removed = me.getRemoved(store),
                remaining = me.getRemaining(store),
                itemArray,
                i, id,
                itemFly = new Ext.dom.Fly(),
                rtl = me.dataview.getInherited().rtl,
                oldPos, newPos,
                styleSide = rtl ? 'right' : 'left',
                newStyle = {},
                oldPositions, newPositions, doAnimate;

            // Not yet rendered
            if (!parentEl) {
                return;
            }

            // Collect nodes that will be removed in the forthcoming refresh so
            // that we can put them back in order to fade them out
            Ext.iterate(removed, function (recId, item) {
                id = me.dataviewID + '-' + recId;

                // Stop any animations for removed items and ensure th.
                Ext.fx.Manager.stopAnimation(id);

                item.dom = Ext.getDom(id);

                if (!item.dom) {
                    delete removed[recId];
                }
            });

            me.cacheStoreData(store);

            // stores the current top and left values for each element (discovered below)
            oldPositions = {};
            newPositions = {};

            // Find current positions of elements which are to remain after the refresh.
            Ext.iterate(remaining, function (id, item) {
                if (itemFly.attach(Ext.getDom(me.dataviewID + '-' + id))) {
                    oldPos = oldPositions[id] = {
                        top: itemFly.getY() - parentElY - itemFly.getMargin('t') -
                            parentElPaddingTop
                    };
                    oldPos[styleSide] = me.getItemX(itemFly);
                }
                else {
                    delete remaining[id];
                }
            });

            // The view MUST refresh, creating items in the natural flow, and collecting the items
            // so that its item collection is consistent.
            dataview.refresh();

            // Replace removed nodes so that they can be faded out, THEN removed
            Ext.iterate(removed, function (id, item) {
                parentEl.dom.appendChild(item.dom);
                itemFly.attach(item.dom).animate({
                    duration: duration,
                    opacity: 0,
                    callback: function (anim) {
                        // #1632: the line below is the -only- change needed.
                        var target = anim.target.target;

                        if (target) {
                            target.destroy();
                        }
                    }
                });

                delete item.dom;
            });

            // We have taken care of any removals.
            // If the store is empty, we are done.
            if (!store.getCount()) {
                return;
            }

            // Collect the correct new positions after the refresh
            itemArray = items.slice();

            // Reverse order so that moving to absolute position does not affect the position of
            // the next one we're looking at.
            for (i = itemArray.length - 1; i >= 0; i--) {
                id = store.getAt(i).internalId;
                itemFly.attach(itemArray[i]);

                newPositions[id] = {
                    dom: itemFly.dom,
                    top: itemFly.getY() - parentElY - itemFly.getMargin('t') - parentElPaddingTop
                };
                newPositions[id][styleSide] = me.getItemX(itemFly);

                // We're going to absolutely position each item.
                // If it is a "remaining" one from last refesh, shunt it back to
                // its old position from where it will be animated.
                newPos = oldPositions[id] || newPositions[id];

                // set absolute positioning on all DataView items. We need to set position, left and
                // top at the same time to avoid any flickering
                newStyle.position = 'absolute';
                newStyle.top = newPos.top + "px";
                newStyle[styleSide] = newPos.left + "px";
                itemFly.applyStyles(newStyle);
            }

            // This is the function which moves remaining items to their new position
            doAnimate = function () {
                var elapsed = new Date() - task.taskStartTime,
                    fraction = elapsed / duration,
                    oldPos, newPos, oldTop, newTop, oldLeft, newLeft,
                    diffTop, diffLeft, midTop, midLeft;

                if (fraction >= 1) {
                    // At end, return all items to natural flow.
                    newStyle.position = newStyle.top = newStyle[styleSide] = '';

                    for (id in newPositions) {
                        itemFly.attach(newPositions[id].dom).applyStyles(newStyle);
                    }

                    Ext.TaskManager.stop(task);
                }
                else {
                    // In frame, move each "remaining" item according to time elapsed
                    for (id in remaining) {
                        oldPos = oldPositions[id];
                        newPos = newPositions[id];
                        oldTop = oldPos.top;
                        newTop = newPos.top;
                        oldLeft = oldPos[styleSide];
                        newLeft = newPos[styleSide];
                        diffTop = fraction * Math.abs(oldTop - newTop);
                        diffLeft = fraction * Math.abs(oldLeft - newLeft);
                        midTop = oldTop > newTop ? oldTop - diffTop : oldTop + diffTop;
                        midLeft = oldLeft > newLeft ? oldLeft - diffLeft : oldLeft + diffLeft;

                        newStyle.top = midTop + "px";
                        newStyle[styleSide] = midLeft + "px";
                        itemFly.attach(newPos.dom).applyStyles(newStyle);
                    }
                }
            };

            // Fade in new items
            Ext.iterate(added, function (id, item) {
                if (itemFly.attach(Ext.getDom(me.dataviewID + '-' + id))) {
                    itemFly.setOpacity(0);
                    itemFly.animate({
                        duration: duration,
                        opacity: 1
                    });
                }
            });

            // Stop any previous animations
            Ext.TaskManager.stop(task);
            task.run = doAnimate;
            Ext.TaskManager.start(task);

            me.cacheStoreData(store);
        }
    }
});
