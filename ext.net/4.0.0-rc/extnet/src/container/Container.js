// @source core/container/Container.js

Ext.Container.override({
    initComponent: function () {
        this.callParent(arguments);

        if (this.autoUpdateLayout === true) {
            this.on("afterrender", this.updateLayout, this, { delay: 10, single: true });
        }
    },

    getBody: function (focus) {
        if (this.iframe) {
            var self = this.getWin();

            if (focus !== false) {
                try {
                    self.focus();
                } catch (e) { }
            }

            return self;
        }

        return Ext.get(this.id + "_Content") || this.layout.getRenderTarget() || this.getTargetEl();
    },

    reload: function (disableCaching) {
        var loader = this.getLoader();
        loader.load(Ext.applyIf({ disableCaching: disableCaching }, loader.lastOptions || {}));
    },

    load: function (config) {
        this.getLoader().load(config);
    },

    clearContent: function () {
        if (this.iframe && this.iframe.dom) {
            var me = this,
                doc,
                prop;

            this.iframe.un("load", this.getLoader().afterIFrameLoad, this);

            try {
                doc = me.getDoc();

                if (doc) {
                    try {
                        if (me._docListeners) {
                            Ext.get(doc).un(this._docListeners);
                        }
                    } catch (e) { }

                    for (prop in doc) {
                        if (doc.hasOwnProperty && doc.hasOwnProperty(prop)) {
                            delete doc[prop];
                        }
                    }
                }
            } catch (e) { }

            try {
                this.iframe.dom.src = Ext.SSL_SECURE_URL;
                delete this.iframe;
                this.removeAll(true);
            } catch (e) { }

            this.getLoader().removeMask();

        } else if (this.rendered) {
            this.update("");
        }
    },

    beforeDestroy: function () {
        if (this.iframe && this.iframe.dom) {
            try {
                this.clearContent();
            } catch (e) { }
        }
        this.destroyContentWidgets(true);
        this.destroyContentWidgets = Ext.emptyFn;
        this.callParent(arguments);
    },

    onRender: function () {
        this.callParent(arguments);
        this.mon(this.el, Ext.supports.SpecialKeyDownRepeat ? 'keydown' : 'keypress', this.fireKey, this);
    },

    fireKey: function (e) {
        if (e.getKey() === e.ENTER) {
            var tagRe = /textarea/i,
                target = e.target;

            contentEditable = target.contentEditable;
            if (tagRe.test(target.tagName) || (contentEditable === '' || contentEditable === 'true')) {
                return;
            }

            var btn,
                index,
                fbar = this.child("[ui='footer']"),
                dbtn = this.defaultButton;

            if (!dbtn) {
                if (!(this instanceof Ext.form.Panel) || !fbar || !fbar.items || !(fbar.items.last() instanceof Ext.button.Button) || Ext.fly(target).hasCls(Ext.button.Button.prototype.baseCls)) {
                    return;
                }

                btn = fbar.items.last();
                this.clickButton(btn, e);

                return;
            }

            if (Ext.isNumeric(dbtn)) {
                index = parseInt(dbtn, 10);

                if (!fbar || !fbar.items || !(fbar.items.getAt(index) instanceof Ext.button.Button)) {
                    return;
                }

                btn = fbar.items.getAt(index);
                this.clickButton(btn, e);
            } else {
                btn = Ext.getCmp(dbtn);

                if (!btn) {
                    btn = this.down(dbtn);
                }

                if (btn) {
                    this.clickButton(btn, e);
                }
            }
        }
    },

    clickButton: function (btn, e) {
        if (this.defaultButtonStopEvent !== false) {
            e.stopEvent();
        }
        if (btn.onClick) {
            e.button = 0;
            btn.onClick(e);
        } else {
            btn.fireEvent("click", btn, e);
        }
    },

    beforeWindowUnload: function () {
        var me = this,
            doc, prop;

        if (me.rendered) {
            try {
                doc = me.getDoc();
                if (doc) {
                    try {
                        Ext.get(doc).un(this._docListeners);
                    } catch (e) { }
                }
            } catch (e) { }
        }
    },

    onIFrameLoad: function () {
        return;

        var me = this,
            doc = me.getDoc(),
            fn = me.onIFrameRelayedEvent;

        if (doc) {
            try {
                Ext.get(doc).on(
                    me._docListeners = {
                        mousedown: fn, // menu dismisal (MenuManager) and Window onMouseDown (toFront)
                        mousemove: fn, // window resize drag detection
                        mouseup: fn,   // window resize termination
                        click: fn,     // not sure, but just to be safe
                        dblclick: fn,  // not sure again
                        scope: me
                    }
                );
            } catch (e) {
            }

            Ext.get(this.getWin()).on('beforeunload', me.beforeWindowUnload, me);
        }
    },

    onIFrameRelayedEvent: function (event) {
        if (!this.iframe) {
            return;
        }

        // relay event from the iframe's document to the document that owns the iframe...

        var iframeEl = this.iframe,

            // Get the left-based iframe position
            iframeXY = iframeEl.getTrueXY(),
            originalEventXY = event.getXY(),

            // Get the left-based XY position.
            // This is because the consumer of the injected event will
            // perform its own RTL normalization.
            eventXY = event.getTrueXY();

        // the event from the inner document has XY relative to that document's origin,
        // so adjust it to use the origin of the iframe in the outer document:
        event.xy = [iframeXY[0] + eventXY[0], iframeXY[1] + eventXY[1]];

        event.injectEvent(iframeEl); // blame the iframe for the event...

        event.xy = originalEventXY; // restore the original XY (just for safety)
    },

    getFrameBody: function () {
        var doc = this.getDoc();
        return doc.body || doc.documentElement;
    },

    getDoc: function () {
        try {
            return this.getWin().document;
        } catch (ex) {
            return null;
        }
    },

    getWin: function () {
        var me = this,
            name = me.id + "_IFrame",
            win = Ext.isIE
                ? me.iframe.dom.contentWindow
                : window.frames[name];
        return win;
    },

    getFrame: function () {
        var me = this;
        return me.iframe.dom;
    }
});