
// @source core/net/ResourceMgr.js

Ext.net.ResourceMgr = function () {
    return {
        id    : "",
        url   : "",
        theme : "blue",
        quickTips       : true,
        cssClasses      : {},
        cssIcons        : {},
        submitDisabled  : true,
        BLANK_IMAGE_URL : "",
        aspInputs       : [],
        ns : "App",
        
        initAspInputs : function (inputs) {
            if (this.inputsInit || this.isMVC) {
                return;
            }

            if (!Ext.get("__EVENTTARGET")) {
                inputs = Ext.applyIf(inputs, {
                    "__EVENTTARGET": ""
                });
            }

            if (!Ext.get("__EVENTARGUMENT")) {
                inputs = Ext.applyIf(inputs, {
                    "__EVENTARGUMENT": ""
                });
            }
            
            Ext.iterate(inputs, function (key, value) {
                this.aspInputs.push(Ext.core.DomHelper.append(this.getAspForm() || Ext.getBody(), {
                    tag : "input",
                    type : "hidden",
                    name : key,
                    value : value
                }));
            }, this);
            
            this.inputsInit = true;            
        },

        initGlyphFontFamily: function () {
            if (this.glyphFontFamily) {
                Ext.setGlyphFontFamily(this.glyphFontFamily);
            }
        },

        initAjaxTimeout: function () {
            var t = this.ajaxTimeout;

            if (Ext.isNumber(t)) {
                Ext.data.Connection.prototype.timeout = t;
                Ext.Ajax.setTimeout(t);
                Ext.net.DirectEvent.setTimeout(t);
                Ext.data.proxy.Server.prototype.timeout = t;
            }
        },

        initDirectEventDurationMessages: function() {
            if (Ext.isDefined(this.directEventForbidDurationMessages)) {
                Ext.net.DirectEvent.forbidDurationMessages = this.directEventForbidDurationMessages;
            }

            if (Ext.isDefined(this.directEventShowDurationMessages)) {
                Ext.net.DirectEvent.showDurationMessages = this.directEventShowDurationMessages;
            }

            if (Ext.isDefined(this.directEventDurationMessages)) {
                Ext.net.DirectEvent.durationMessages = this.directEventDurationMessages;
            }
        },

        resolveUrl : function (url) {
            if (url && Ext.net.StringUtils.startsWith(url, "~/")) {                
                return url.replace(/^~/, Ext.isEmpty(this.appName, false) ? "" : ("/"+this.appName))
            }

            return url;
        },

        initAriaSettings: function() {
            if (Ext.isDefined(this.enableAria)) {
                Ext.enableAria = this.enableAria;
            }

            if (Ext.isDefined(this.enableAriaButtons)) {
                Ext.enableAriaButtons = this.enableAriaButtons;
            }

            if (Ext.isDefined(this.enableAriaPanels)) {
                Ext.enableAriaPanels = this.enableAriaPanels;
            }
        },

        hasCssClass : function (id) {
            return !!this.cssClasses[id];
        },

        registerCssClass : function (id, cssClass, /*private*/registerId) {
            if (!this.hasCssClass(id)) {                
                if (!this.resourcesSheet) {
                    this.resourcesSheet = Ext.util.CSS.createStyleSheet("/* Ext.Net resources stylesheet */\n", "extnet-resources");
                }

                if (!Ext.isIE) {
					var removeComments = /\/\*.*?\*\//img,
                        csssplitregexp = /([^{}]+)\{([^{}]+)+\}/img,                        
                        match;

                    cssClass = cssClass.replace(removeComments, "");
                    match = csssplitregexp.exec(cssClass)

                    while (match != null) {	                    
                        this.resourcesSheet.insertRule(match[0], this.resourcesSheet.cssRules.length);
	                    match = csssplitregexp.exec(cssClass);
                    }                    
				} else {					
					document.styleSheets["extnet-resources"].cssText += cssClass;
				}

				if (!Ext.isIE8m) {
				    try {
				        Ext.util.CSS.refreshCache();
				    }
				    catch (e) {
				    }
                }

                if (registerId !== false) {
                    this.cssClasses[id] = true;
                }
            }
        },

        // private
        toCharacterSeparatedFileName : function (name, separator) {
            if (Ext.isEmpty(name, false)) {
                return;
            }

            var matches = name.match(/([A-Z]+)[a-z]*|\d{1,}[a-z]{0,}/g);

            var temp = "";

            for (var i = 0; i < matches.length; i++) {
                if (i !== 0) {
                    temp += separator;
                }

                temp += matches[i].toLowerCase();
            }

            return temp;
        },

        getIcon : function (icon) {
            this.registerIcon(icon);
            icon = icon.toLowerCase();

            return !Ext.net.StringUtils.startsWith(icon, "icon-") ? ("icon-" + icon) : icon;
        },

        getRenderTarget : function () {
            return Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
        },

        setIconCls : function (cmp, propertyName) {
            var val = cmp[propertyName];

            if (val && Ext.isString(val) && val.indexOf('#') === 0) {
                cmp[propertyName] = this.getIcon(val.substring(1));
            }
        },

        getIconUrl : function (icon) {
            var iconName = this.toCharacterSeparatedFileName(icon, "_"),                
                template = "/{0}icons/{1}-png/ext.axd",
                templateCdn = "{0}/icons/{1}.png",
                appName = Ext.isEmpty(this.appName, false) ? "" : (this.appName + "/"),
                path = this.cdnPath || this.resourcePath;

            return Ext.net.StringUtils.format(path ? templateCdn : template, path || appName, iconName);
        },

        registerIcon : function (name, init) {
            if (typeof name === 'string' && !!this.cssIcons[name]) {
                return;
            }

            var buffer = [],
                templateEmb = ".{0}{background-image:url(\"/{1}icons/{2}-png/ext.axd\") !important;background-repeat:no-repeat;}",
                templateCdn = ".{0}{background-image:url(\"{1}/icons/{2}.png\") !important;background-repeat:no-repeat;}",
                appName = Ext.isEmpty(this.appName, false) ? "" : (this.appName + "/");

            Ext.each(name, function (icon) {
                if (!!this.cssIcons[icon.name || icon]) {
                    return;
                }

                if (!Ext.isObject(icon)) {
                    icon = { name: icon };
                }                

                var iconName = this.toCharacterSeparatedFileName(icon.name, "_"),
                    iconRule = icon.name.toLowerCase(),
                    id = !Ext.net.StringUtils.startsWith(iconRule, "icon-") ? ("icon-" + iconRule) : iconRule,
                    path = this.cdnPath || this.resourcePath;

                if (!this.hasCssClass(id)) {
                    if (icon.url) {
                        buffer.push(Ext.net.StringUtils.format(".{0}{background-image:url(\"{1}\") !important;background-repeat:no-repeat;}", id, icon.url));
                    } else {                        
                        if (path) {
                            buffer.push(Ext.net.StringUtils.format(templateCdn, id, path, iconName));
                        } 
                        else {
                            buffer.push(Ext.net.StringUtils.format(templateEmb, id, appName, iconName));
                        }                        
                    }

                    this.cssClasses[id] = true;
                    this.cssIcons[icon.name] = true;
                }
            }, this);

            if (buffer.length > 0) {
                this.registerCssClass("", buffer.join(" "), false);
            }
        },
        
        getCmp : function (id) {
            var d = id.split("."),
                o = window[d[0]];

            Ext.each(d.slice(1), function (v) {
                if (!o) {
                   return null;
                }

                o = o[v];
            });
            
            return o ? Ext.getCmp(o.id) || o : null;
        },

        destroyCmp : function (id, contentOnly) {
            var obj = Ext.getCmp(id) || window[id];
            
            if (!Ext.isObject(obj) || (!obj.destroy && !obj.destroyStore)) {
                obj = Ext.net.ResourceMgr.getCmp(id);
            } 

            if (Ext.isObject(obj) && (obj.destroy || obj.destroyStore)) {
                try {
                    if (contentOnly) {
                        obj.clearContent && obj.clearContent();
                    }
                    else {                    
                        obj.destroyStore ?  obj.destroyStore() : obj.destroy();
                    }
                } catch (e) { }
            }
        },

        init : function (config) {
            window.X = window.Ext;
            window.X.net.RM = this;
            Ext.apply(this, config || {});

            if (this.quickTips !== false) {
                // Fix for github issue #268. Remove after Sencha fix.
                Ext.onReady(function () {
                    Ext.tip.QuickTipManager.init(); 
                });                
            }

            this.registerPageResources();

            if (this.theme) {
                if (Ext.isReady) {
                    Ext.fly(document.body.parentNode).addCls("x-theme-" + this.theme);
                }
                else {
                    Ext.onReady(function () {
                        Ext.fly(document.body.parentNode).addCls("x-theme-" + this.theme);
                    }, this);
                }
            }

            if (this.icons) {
                this.registerIcon(this.icons, true);
            }

            if (!Ext.isEmpty(this.ns)) {
                if (Ext.isArray(this.ns)) {
                    Ext.each(this.ns, function (ns) {
                        if (ns) {
                            Ext.ns(ns);
                        }
                    });
                } else {
                    Ext.ns(this.ns);
                }
            }            

            Ext.onReady(function () {
                if (this.aspForm && this.isMVC !== true && !window.theForm) {
                    window.theForm = document.forms[this.aspForm];
                    if (!window.theForm) {
                        window.theForm = document[this.aspForm];
                    }

                    window.__doPostBack = function (et, ea) {
                        var form = Ext.net.ResourceMgr.getAspForm(true);
    
                        if (form && (!form.onsubmit || (form.onsubmit() != false))) {
                            form.__EVENTTARGET.value = et;
                            form.__EVENTARGUMENT.value = ea;
                            form.submit();
                        }
                    };
                }         
                
                Ext.Function.defer(function () {
                    if (!this.inputsInit) {
                        this.initAspInputs({});
                    }    
                }, 10, this);                
            }, this);
            
            this.initGlyphFontFamily();
            this.initAjaxTimeout();
            this.initDirectEventDurationMessages();
            this.initAriaSettings();

            if (this.globalEvents) {
                Ext.on(this.globalEvents);
            }
        },

        registerPageResources : function () {
            Ext.select("script").each(function (el) {
                var url = el.dom.getAttribute("src");

                if (!Ext.isEmpty(url) && !this.queue.contains(url)) {
                    this.queue.buffer.push({
                        url: url,
                        loading: false
                    });
                }
            }, this);

            Ext.select('link[type="text/css"]').each(function (el) {
                var url = el.dom.getAttribute("href");

                if (!Ext.isEmpty(url) && !this.queue.contains(url)) {
                    this.queue.buffer.push({
                        url: url,
                        loading: false
                    });
                }
            }, this);
        },

        getAspForm : function (dom) {
            if (this.aspForm) {
                return Ext[dom ? "getDom" : "get"](this.aspForm);
            }
        },

        load : function (config, groupCallback) {
            this.queue.clear();

            if (groupCallback) {
                groupCallback = {
                    fn: groupCallback,
                    counter: config.length || 1,
                    config: config,
                    step : function () {
                        this.counter--;

                        if (this.counter === 0) {
                            this.fn.apply(window, [this.config]);
                        }
                    }
                };
            }

            Ext.each(Ext.isArray(config) ? config : [config], function (config) {
                if (Ext.isString(config)) {
                    var url = config;

                    config = { url: url };

                    if (url.substring(url.length - 4) === ".css") {
                        config.mode = "css";
                    }
                }

                config.options = Ext.applyIf(config.options || {}, {
                    mode: config.mode || "js"
                });

                if (config.callback) {
                    config.loadCallback = config.callback;
                    delete config.callback;
                }

                if (groupCallback) {
                    config.groupCallback = groupCallback;
                }

                if (!Ext.isEmpty(config.url)) {
                    this.queue.enqueue(config);
                }
            }, this);

            this.doLoad();
        },

        // private
        doLoad : function () {
            var config = this.queue.peek();

            if (config === undefined) {
                return;
            }

            var url = config.url,
                item,
                contains = this.queue.contains(url);

            if (config.force === true || contains !== true) {
                if (contains !== true) {
                    this.queue.buffer.push({
                        url: url,
                        loading: true
                    });
                }

                if (url && url.indexOf("://") >= 0) {
                    this.scriptTagRequest(url, config);
                }
                else {
                    Ext.Ajax.request(Ext.apply({
                        scope: this,
                        method: "GET",
                        callback: this.onResult,
                        disableCaching: false
                    }, config));
                }
            } else {
                item = this.queue.getItem(url);

                if (item && item.loading) {
                    this.queue.waitingList.push(config);
                    return;
                }

                if (config.loadCallback) {
                    config.loadCallback.apply(window, [config]);
                }

                if (config.groupCallback) {
                    config.groupCallback.step();
                }

                this.queue.dequeue(config);
                this.doLoad();
            }
        },

        scriptTagRequest : function (url, config) {
            var el,
                head = document['head'] || document.getElementsByTagName('head')[0];

            if (config.mode === "css") {
                el = document.createElement('link');
                el.type = 'text/css';
                el.rel = 'stylesheet';
                el.href = url;
            }
            else {
                el = document.createElement('script');
                el.type = 'text/javascript';
                el.src  = url;
            }

            el.onload = el.onreadystatechange = Ext.Function.bind(this.scriptTagOnResult, this, [config], 0);
            el.onerror = Ext.Function.bind(this.scriptTagOnError, this, [config], 0);
            el.async = false;
            el.defer = false;
            config.el = el;

            head.insertBefore(el, head.lastChild);
        },

        scriptTagOnError : function (options) {
            options.el.onload = options.el.onreadystatechange = options.el.onerror = null;

            Ext.net.DirectEvent.showFailure({
                status : "",
                statusText : "Failure"
            }, options.url + " is not loaded correctly");

            this.queue.dequeue(options);
            this.doLoad();
        },

        scriptTagOnResult : function (options, event) {
            event = event || window.event;

            if ((event && event.type == 'load') || (/loaded|complete/.test(options.el.readyState) && (!document.documentMode || document.documentMode < 9))) {            
                options.el.onload = options.el.onreadystatechange = options.el.onerror = null;
                
                var i = 0,
                    item = this.queue.getItem(options.url);

                if (item !== null) {
                    item.loading = false;
                }

                if (options.loadCallback) {
                    options.loadCallback.apply(window, [options]);
                }

                if (options.groupCallback) {
                    options.groupCallback.step();
                }

                while (this.queue.waitingList.length > i) {
                    item = this.queue.waitingList[i];

                    if (item.url === options.url) {
                        if (item.loadCallback) {
                            item.loadCallback.apply(window, [item]);
                        }

                        if (item.groupCallback) {
                            item.groupCallback.step();
                        }

                        Ext.Array.remove(this.queue.waitingList, item);
                    } else {
                        i++;
                    }
                }

                this.queue.dequeue(options);
                this.doLoad();
            }            
        },

        // private
        onResult : function (options, success, response) {
            if (success === true) {
                if (options.mode === "css") {
                    Ext.util.CSS.createStyleSheet(response.responseText);
                } else {
                    var head = document['head'] || document.getElementsByTagName('head')[0],
                        el = document.createElement("script");

                    el.setAttribute("type", "text/javascript");
                    el.text = response.responseText;

                    head.insertBefore(el, head.lastChild);
                }

                var i = 0,
                    item = this.queue.getItem(options.url);

                if (item !== null) {
                    item.loading = false;
                }

                if (options.loadCallback) {
                    options.loadCallback.apply(window, [options]);
                }

                if (options.groupCallback) {
                    options.groupCallback.step();
                }

                while (this.queue.waitingList.length > i) {
                    item = this.queue.waitingList[i];

                    if (item.url === options.url) {
                        if (item.loadCallback) {
                            item.loadCallback.apply(window, [item]);
                        }

                        if (item.groupCallback) {
                            item.groupCallback.step();
                        }

                        Ext.Array.remove(this.queue.waitingList, item);
                    } else {
                        i++;
                    }
                }
            }
            else {
               Ext.net.DirectEvent.showFailure(response, response.responseText);
            }

            this.queue.dequeue(options);

            this.doLoad();
        },

        // private
        queue : function () {
            // first-in-first-out
            return {
                // private
                js: [],

                // private
                css: [],

                // private
                buffer: [],

                waitingList: [],

                enqueue : function (item) {
                    this[item.options.mode].push(item);
                },

                dequeue : function (item) {
                    var mode = item.options.mode,
                        temp = this[mode][0];

                    this[mode] = this[mode].slice(1);

                    return temp;
                },

                clear : function () {
                    this.js = [];
                    this.css = [];
                },

                contains : function (url) {
                    // workaround, need more universal fix
                    url = url.replace("&amp;", "&");
                    for (var i = 0; i < this.buffer.length; i++) {
                        if (this.buffer[i].url.replace("&amp;", "&") === url) {
                            return true;
                        }
                    }

                    return false;
                },

                getItem : function (url) {
                    for (var i = 0; i < this.buffer.length; i++) {
                        if (this.buffer[i].url === url) {
                            return this.buffer[i];
                        }
                    }

                    return null;
                },

                peek : function () {
                    return this.css.length > 0 ? this.css[0] : this.js[0];
                }
            };
        } ()       
    };
} ();