// Overridden because of #928 only
Ext.plugin.Viewport.override({
    statics: {
        decorate: function (target) {
            this.callParent(arguments);

            Ext.override(target, {
                afterLayout: function (layout) {
                    if (Ext.supports.Touch) {
                        if (document.documentElement) { // #928
                            document.documentElement.scrollTop = 0;
                        }

                        if (document.body) { // #928
                            document.body.scrollTop = 0;
                        }
                    }

                    this.callSuper([layout]); // #928: replaced callParent with callSuper
                }
            });
        }
    }
});

Ext.define('Ext.net.plugin.Viewport', {
    extend: 'Ext.plugin.Viewport',
    alias: 'plugin.netviewport',

    statics: {
        setupViewport: function () {
            var me = this,
                body = Ext.getBody();

            el = me.el = Ext.get(me.renderTo || Ext.net.ResourceMgr.getAspForm() || body);

            Ext.fly(document.documentElement).addCls(me.viewportCls);
            el.setHeight = el.setWidth = Ext.emptyFn;
            body.setHeight = body.setWidth = Ext.emptyFn;
            el.dom.scroll = 'no';
            body.dom.scroll = 'no';
            me.allowDomMove = false;
            me.renderTo = me.el;

            if (me.rtl) {
                body.addCls(Ext.baseCSSPrefix + "rtl");
            }

            body.applyStyles({
                overflow: "hidden",
                margin: "0",
                padding: "0",
                border: "0px none",
                height: "100%"
            });

            if (Ext.supports.Touch) {
                me.addMeta("apple-mobile-web-app-capable", "yes");
            }

            Ext.on("resize", me.handleViewportResize, me);

            // Get the DOM disruption over with before the Viewport renders and begins a layout
            Ext.getScrollbarSize();

            // Clear any dimensions, we will size later on
            me.width = me.height = undefined;

            // ... but take the measurements now because doing that in onRender
            // will cause a costly reflow which we just forced with getScrollbarSize()
            me.initialViewportHeight = Ext.Element.getViewportHeight();
            me.initialViewportWidth  = Ext.Element.getViewportWidth();
        }
    }
}, function () {
    this.prototype.apply = function (target) {
        Ext.plugin.Viewport.apply(target);
        (target.prototype || target).setupViewport = Ext.net.plugin.Viewport.setupViewport;
    };
});

Ext.define('Ext.net.Viewport', {
    extend: 'Ext.container.Container',

    requires: [
        'Ext.net.plugin.Viewport'
    ],

    alias: 'widget.netviewport'
},
function () {
    Ext.plugin.Viewport.decorate(this);
    this.prototype.setupViewport = Ext.net.plugin.Viewport.setupViewport;
});