
// @source core/ComponentLoader.js

Ext.ComponentLoader.Renderer.Data = function (loader, response, active) {
    var success = true;

    try {
        loader.getTarget().update((Ext.isObject(response.responseText) || Ext.isArray(response.responseText)) ? response.responseText : Ext.decode(response.responseText));
    } catch (e) {
        success = false;
    }

    return success;
};

Ext.ComponentLoader.Renderer.Component = function (loader, response, active) {
    var success = true,
        target = loader.getTarget(),
        items = [];

    //<debug>
    if (!target.isContainer) {
        Ext.raise({
            target: target,
            msg: 'Components can only be loaded into a container'
        });
    }
    //</debug>

    try {
        items = (Ext.isObject(response.responseText) || Ext.isArray(response.responseText)) ? response.responseText : Ext.decode(response.responseText);
    } catch (e) {
        success = false;
    }

    if (success) {
        if (items && items['x.res']) {
            if (items['x.res'].ns) {
                Ext.ns.apply(Ext, items['x.res'].ns);
            }

            if (items.config) {
                response.responseText = items.config;
            }

            if (items['x.res'].res) {
                Ext.net.ResourceMgr.load(items['x.res'].res, Ext.Function.bind(Ext.ComponentLoader.Renderer.Component, this, [loader, response, active]));
                return;
            }
        } else {
            target.suspendLayouts();
            if (active.removeAll) {
                target.removeAll();
            }
            target.add(items);
            target.resumeLayouts(true);
        }
    }

    return success;
}

Ext.ComponentLoader.Renderer.Script = function (loader, response, active) {
    var success = true;

    try {
        if (window.execScript) {
            window.execScript(response.responseText);
        } else {
            window.eval.call(window, response.responseText);
        }
    } catch (e) {
        success = false;
    }

    return success;
};

Ext.define('Ext.net.ComponentLoader', {
    extend: 'Ext.ComponentLoader',
    autoLoad: true,
    removeD: false,

    constructor: function (config) {
        config = config || {};
        var autoLoad = config.autoLoad;
        config.autoLoad = false;

        Ext.net.ComponentLoader.superclass.constructor.call(this, config);

        if (autoLoad !== false) {
            this.autoLoad = true;
        }

        this.initLoader();
    },

    addMask: function (mask) {
        if (mask.showMask) {
            if (this.target.floating) {
                (this.target.body || this.target.el).mask(mask.msg || Ext.view.AbstractView.prototype.loadingText, mask.msgCls || "x-mask-loading");

                return;
            }

            this.callParent(arguments);
        }
    },

    removeMask: function () {
        if (this.target.floating) {
            (this.target.body || this.target.el).unmask();
            return;
        }

        this.callParent(arguments);
    },

    getLocation: function (href) {
        var l = document.createElement("a");
        l.href = href;
        return l;
    },

    isIFrame: function (cfg) {
        var frame = false;

        if (cfg.renderer == "frame") {
            return true;
        }

        if (typeof cfg == "string" && cfg.indexOf("://") >= 0 && this.getLocation(cfg).host != window.location.host) {
            frame = true;
        } else if (cfg.url && cfg.url.indexOf("://") >= 0 && this.getLocation(cfg.url).host != window.location.host) {
            frame = true;
        }

        return frame;
    },

    initLoader: function () {
        if (this.isIFrame(this)) {
            var target = this.getTarget();

            if (!target.isContainer) {
                throw 'IFrame can only be loader to a container';
            }

            target.layout = "fit";
            this.renderer = "frame";
        }

        var loadConfig = {
            delay: 10,
            single: true
        },
            triggerCmp,
            triggerControl = this.triggerControl || this.getTarget(),
            triggerEvent = this.triggerEvent,
            defaultTriggerEvent = triggerControl instanceof Ext.container.Container ? "afterlayout" : "afterrender"; // #938

        if (Ext.isFunction(triggerControl)) {
            triggerControl = triggerControl.call(window);
        } else if (Ext.isString(triggerControl)) {
            triggerCmp = Ext.net.ResourceMgr.getCmp(triggerControl);

            if (triggerCmp) {
                triggerControl = triggerCmp;
            } else {
                triggerControl = Ext.net.getEl(triggerControl);
            }
        }

        loadConfig.single = !(this.reloadOnEvent || false);

        if (this.autoLoad) {
            triggerControl.on(triggerEvent || defaultTriggerEvent, function () {
                this.load({});
            }, this, loadConfig);
        }
    },

    load: function (options) {
        if (Ext.isString(options)) {
            options = { url: options };
        } else {
            options = Ext.apply({}, options);
        }

        this.lastOptions = options;

        if (this.paramsFn) {
            this.params = this.paramsFn.call(this.paramsFnScope || this.getTarget());
        }

        if (options.paramsFn) {
            options.params = Ext.apply(options.params || {}, options.paramsFn.call(this.paramsFnScope || this.getTarget()));
        }

        if (!Ext.isDefined(options.passParentSize) && this.passParentSize) {
            options.params = options.params || {};
            options.params.width = (this.target.body || this.target.el).getWidth(true);
            options.params.height = (this.target.body || this.target.el).getHeight(true);
        }

        if (this.renderer == "frame") {
            this.loadFrame(options);
            return;
        }

        if (this.directMethod) {
            var me = this,
                mask = Ext.isDefined(options.loadMask) ? options.loadMask : me.loadMask,
                params = Ext.apply({}, options.params),
                callback = options.callback || me.callback,
                scope = options.scope || me.scope || me,
                method,
                dmCfg;

            Ext.applyIf(params, me.params);
            Ext.apply(params, me.baseParams);

            Ext.apply(options, {
                scope: me,
                params: params,
                callback: me.onComplete
            });

            if (me.fireEvent('beforeload', me, options) === false) {
                return;
            }

            if (mask) {
                me.addMask(mask);
            }

            method = Ext.decode(this.directMethod);

            dmCfg = {
                complete: function (success, result, response) {
                    me.onComplete(options, success, { responseText: result });
                }
            }

            if (method.length > 1) {
                method(Ext.encode(options.params), dmCfg);
            }
            else {
                method(dmCfg);
            }

            me.active = {
                options: options,
                mask: mask,
                scope: scope,
                callback: callback,
                success: options.success || me.success,
                failure: options.failure || me.failure,
                renderer: options.renderer || me.renderer,
                scripts: Ext.isDefined(options.scripts) ? options.scripts : me.scripts
            };

            me.setOptions(me.active, options);

            return;
        }

        Ext.net.ComponentLoader.superclass.load.apply(this, arguments);
    },

    loadFrame: function (options) {
        options = Ext.apply({}, options);

        var me = this,
            target = me.target,
            mask = Ext.isDefined(options.loadMask) ? options.loadMask : me.loadMask,
            monitorComplete = Ext.isDefined(options.monitorComplete) ? options.monitorComplete : me.monitorComplete,
            disableCaching = Ext.isDefined(options.disableCaching) ? options.disableCaching : me.disableCaching,
            disableCachingParam = options.disableCachingParam || "_dc",
            params = Ext.apply({}, options.params),
            callback = options.callback || me.callback,
            scope = options.scope || me.scope || me;

        Ext.applyIf(params, me.params);
        Ext.apply(params, me.baseParams);

        Ext.applyIf(options, {
            url: me.url
        });

        Ext.apply(options, {
            mask: mask,
            monitorComplete: monitorComplete,
            disableCaching: disableCaching,
            params: params,
            callback: callback,
            scope: scope
        });

        this.lastOptions = options;

        if (!options.url) {
            throw 'No URL specified';
        }

        if (me.fireEvent('beforeload', me, options) === false) {
            return;
        }

        var url = options.url;

        if (disableCaching !== false) {
            url = url + ((url.indexOf("?") > -1) ? "&" : "?") + disableCachingParam + "=" + new Date().getTime();
        }

        if (!Ext.Object.isEmpty(params)) {
            var p = {};

            for (var key in params) {
                var ov = params[key];

                if (typeof ov == "function") {
                    p[key] = ov.call(target);
                } else {
                    p[key] = ov;
                }
            }

            p = Ext.urlEncode(p);
            url = url + ((url.indexOf("?") > -1) ? "&" : "?") + p;
        }

        if (mask) {
            me.addMask(mask);
        }

        if (Ext.isEmpty(target.iframe)) {
            var iframeObj = {
                tag: "iframe",
                id: target.id + "_IFrame",
                name: target.id + "_IFrame",
                src: url,
                frameborder: 0
            },
            layout = target.getLayout();

            if (!target.layout || target.layout.type !== "fit") {
                target.setLayout(Ext.layout.Layout.create("fit"));
            }

            target.removeAll(true);

            var p = target,
                iframeCt = {
                    xtype: "component",
                    autoEl: iframeObj,
                    listeners: {
                        afterrender: function () {
                            var owner = this.ownerCt;
                            owner.iframe = this.el;

                            if (monitorComplete) {
                                owner.getLoader().startIframeMonitoring();
                            } else {
                                this.el.on("load", owner.getLoader().afterIFrameLoad, owner.getLoader());
                            }

                            owner.getLoader().beforeIFrameLoad(options);
                        }
                    }
                };

            if (Ext.platformTags.ios) { // #117
                target.getTargetEl().addCls("ios-iframe-scroll-fix");
            }

            target.add(iframeCt);
        } else {
            target.iframe.dom.src = Ext.String.format("java{0}", "script:false");

            try { // IE9 refresh iframe with pdf issue: http://forums.ext.net/showthread.php?24690
                window.frames[target.iframe.dom.name].location.replace(url);
            } catch (e) { }

            target.iframe.dom.src = url; // #936

            this.beforeIFrameLoad(options);
        }

        if (!this.destroyIframeOnUnload) {
            this.destroyIframeOnUnload = true;

            // Commented out because of the GitHub issue #617
            // Ext.getWin().on("beforeunload", this.target.destroy, this.target);
        }
    },

    iframeCompleteCheck: function () {
        if (this.target.iframe.dom.readyState == "complete") {
            this.stopIframeMonitoring();
            this.afterIFrameLoad();
        }
    },

    startIframeMonitoring: function () {
        if (this.iframeTask) {
            this.iframeTask.stopAll();
            this.iframeTask = null;
        }

        this.iframeTask = new Ext.util.TaskRunner();
        this.iframeTask.start({
            run: this.iframeCompleteCheck,
            interval: 200,
            scope: this
        });
    },

    stopIframeMonitoring: function () {
        if (this.iframeTask) {
            this.iframeTask.stopAll();
            this.iframeTask = null;
        }
    },

    beforeIFrameLoad: function () {
        if (Ext.isString(this.parentRef) && (this.parentRef.length > 0)) {
            try {
                this.target.iframe.dom.contentWindow[this.parentRef] = this.target;
            } catch (e) { }
        }
    },

    afterIFrameLoad: function () {
        var options = this.lastOptions,
            doc;
        if (options.mask) {
            this.removeMask();
        }

        if (Ext.isString(this.parentRef) && (this.parentRef.length > 0)) {
            try {
                this.target.iframe.dom.contentWindow[this.parentRef] = this.target;
            } catch (e) { }
        }

        if (options.callback) {
            Ext.callback(options.callback, options.scope, [this, true, null, options]);
        }

        if (options.success) {
            Ext.callback(options.success, options.scope, [this, true, null, options]);
        }

        this.target.onIFrameLoad();
        doc = this.target.getDoc();

        try {
            doc = this.getWin().document;

            if (doc) {
                this.fireEvent("load", this, null, options);
            }
            else if (options.url) {
                this.fireEvent('exception', this, null, options);
            }
        } catch (ex) {
            this.fireEvent("load", this, null, options);
        }
    },

    getRenderer: function (renderer) {
        if (Ext.isFunction(renderer)) {
            return renderer;
        }

        switch (renderer) {
            case 'component':
                return Ext.ComponentLoader.Renderer.Component;
            case 'data':
                return Ext.ComponentLoader.Renderer.Data;
            case 'script':
                return Ext.ComponentLoader.Renderer.Script;
            default:
                return Ext.ElementLoader.Renderer.Html;
        }
    },

    onComplete: function (options, success, response, decodedResp) {
        var me = this,
            text,
            cfg,
            resp,
            active = me.active,
            scope,
            renderer;

        if (active) {
            scope = active.scope;
            renderer = me.getRenderer(active.renderer);

            if (success && !decodedResp && (this.removeD || (active && active.options && active.options.url && active.options.url.indexOf(".asmx") > 0))) {
                try {
                    text = response.responseText.replace(/{"d":null}$/, "");
                    cfg = Ext.decode(text, true);

                    if (cfg && cfg.d) {
                        text = cfg.d;
                    }
                    else if (active.renderer === "component") {
                        text = cfg;
                    }
                } catch (e) {
                    success = false;
                }

                resp = { responseText: text };
            }
            else {
                resp = response;
            }

            if (success && !decodedResp && active.renderer === "component") {
                if (Ext.isObject(resp.responseText)) {
                    cfg = resp.responseText;
                }
                else if (Ext.isString(resp.responseText)) {
                    cfg = Ext.decode(resp.responseText);
                    resp.responseText = cfg;
                }
                else {
                    cfg = null;
                }

                if (cfg && cfg['x.res']) {
                    if (cfg['x.res'].ns) {
                        Ext.ns.apply(Ext, cfg['x.res'].ns);
                    }

                    if (cfg.config) {
                        resp.responseText = cfg.config;
                    }

                    if (cfg['x.res'].res) {
                        Ext.net.ResourceMgr.load(cfg['x.res'].res, Ext.Function.bind(this.onComplete, this, [options, success, response, resp]));
                        return;
                    }
                }
            }

            if (success) {
                success = renderer.call(me, me, decodedResp || resp, active) !== false;
            }

            if (success) {
                Ext.callback(active.success, scope, [me, response, options]);
                me.fireEvent('load', me, response, options);
            } else {
                Ext.callback(active.failure, scope, [me, response, options]);
                me.fireEvent('exception', me, response, options);

                if (this.showWarningOnFailure !== false && !this.hasListener("exception")) {
                    Ext.net.DirectEvent.showFailure(response, response.responseText);
                }
            }
            Ext.callback(active.callback, scope, [me, success, response, options]);

            if (active.mask) {
                me.removeMask();
            }
        }

        delete me.active;
    }
});