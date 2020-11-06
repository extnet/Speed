
Ext.define('Ext.ux.Spotlight', {
    
    baseCls: 'x-spotlight',

    
    animate: true,

    
    duration: 250,

    
    easing: null,

    
    active: false,

    constructor: function(config) {
        Ext.apply(this, config);
    },

    
    createElements: function() {
        var me = this,
            baseCls = me.baseCls,
            body = Ext.getBody();

        me.right = body.createChild({
            cls: baseCls
        });
        me.left = body.createChild({
            cls: baseCls
        });
        me.top = body.createChild({
            cls: baseCls
        });
        me.bottom = body.createChild({
            cls: baseCls
        });

        me.all = Ext.create('Ext.CompositeElement', [me.right, me.left, me.top, me.bottom]);
    },

    
    show: function(el, callback, scope) {
        var me = this;

        // get the target element
        me.el = Ext.get(el);

        // create the elements if they don't already exist
        if (!me.right) {
            me.createElements();
        }

        if (!me.active) {
            // if the spotlight is not active, show it
            me.all.setDisplayed('');
            me.active = true;
            Ext.on('resize', me.syncSize, me);
            me.applyBounds(me.animate, false);
        }
        else {
            // if the spotlight is currently active, just move it
            me.applyBounds(false, false);
        }
    },

    
    hide: function(callback, scope) {
        var me = this;

        Ext.un('resize', me.syncSize, me);

        me.applyBounds(me.animate, true);
    },

    
    syncSize: function() {
        this.applyBounds(false, false);
    },

    
    applyBounds: function(animate, reverse) {
        var me = this,
            box = me.el.getBox(),
            // get the current view width and height
            viewWidth = Ext.Element.getViewportWidth(),
            viewHeight = Ext.Element.getViewportHeight(),
            from, to, clone;

        // where the element should start (if animation)
        from = {
            right: {
                x: box.right,
                y: viewHeight,
                width: (viewWidth - box.right),
                height: 0
            },
            left: {
                x: 0,
                y: 0,
                width: box.x,
                height: 0
            },
            top: {
                x: viewWidth,
                y: 0,
                width: 0,
                height: box.y
            },
            bottom: {
                x: 0,
                y: (box.y + box.height),
                width: 0,
                height: (viewHeight - (box.y + box.height)) + 'px'
            }
        };

        // where the element needs to finish
        to = {
            right: {
                x: box.right,
                y: box.y,
                width: (viewWidth - box.right) + 'px',
                height: (viewHeight - box.y) + 'px'
            },
            left: {
                x: 0,
                y: 0,
                width: box.x + 'px',
                height: (box.y + box.height) + 'px'
            },
            top: {
                x: box.x,
                y: 0,
                width: (viewWidth - box.x) + 'px',
                height: box.y + 'px'
            },
            bottom: {
                x: 0,
                y: (box.y + box.height),
                width: (box.x + box.width) + 'px',
                height: (viewHeight - (box.y + box.height)) + 'px'
            }
        };

        // reverse the objects
        if (reverse) {
            clone = Ext.clone(from);
            from = to;
            to = clone;
        }

        if (animate) {
            Ext.Array.forEach(['right', 'left', 'top', 'bottom'], function(side) {
                me[side].setBox(from[side]);
                me[side].animate({
                    duration: me.duration,
                    easing: me.easing,
                    to: to[side]
                });
            }, this);
        }
        else {
            Ext.Array.forEach(['right', 'left', 'top', 'bottom'], function(side) {
                me[side].setBox(Ext.apply(from[side], to[side]));
                me[side].repaint();
            }, this);
        }
    },

    
    destroy: function() {
        var me = this;

        Ext.destroy(me.right, me.left, me.top, me.bottom);
        delete me.el;
        delete me.all;
        me.callParent();
    }
});

// @source: spotlight/Spotlight-overrides.js
Ext.define('Ext.ux.Spotlight', {
    override: 'Ext.ux.Spotlight',
    show: function (el, callback, scope) {
        var me = this,
            wasActive = me.active,
            retVal;

        // If 'el' is neither a string nor an Ext.dom.Element, then try to pull its
        // '.el' property. Throw an error if then it does not have it.
        if (!(Ext.isString(el) || el instanceof Ext.dom.Element)) {
            if (el.el && el.el instanceof Ext.dom.Element) {
                el = el.el;
            } else {
                Ext.raise("Unable to extract the Ext.dom.Element component of the to-be-shown component.");
            }
        }

        retVal = me.callParent([el, callback, scope]);

        if (callback) {
            var scope = scope ? scope : me;
            if (!wasActive && me.active && me.animate) {
                // We have no means to get the actual animation here,
                // so lets just delay the callback for the duration
                // the animation has
                Ext.defer(callback, me.duration, scope);
            } else {
                callback.apply(scope);
            }
        }

        return retVal;
    },

    hide: function (callback, scope) {
        var me = this,
            retVal;

        // This test will ensure the spotlight is only attempted to be
        // made hidden if it was previously shown.
        if (me.active) {
            retVal = me.callParent(arguments);

            if (callback) {
                var scope = scope ? scope : me;
                if (me.animate) {
                    // We have no means to get the actual animation here,
                    // so lets just delay the callback for the duration
                    // the animation has
                    Ext.defer(callback, me.duration, scope);
                } else {
                    callback.apply(scope);
                }
            };

            // mark it as inactive, so the animation (if any) will be
            // triggered next time the spotlight gets activated.
            me.active = false;
        }

        return retVal;
    }
});
