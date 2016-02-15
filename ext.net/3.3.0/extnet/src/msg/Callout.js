Ext.define("Ext.net.Callout", {
    extend: "Ext.Component",
    alias: "widget.callout",
    baseCls: Ext.baseCSSPrefix + "callout",
    alignment: "right",
    hidden: true,
    constrainPosition: true,
    //click, hover, focus, manual
    trigger: "click",
    quickShowInterval: 250,
    dismissDelay: 0,
    hideDelay: 0,
    showDelay: 0,
    autoHide: true,
    //focus - hide on blur, click - hide on next click
    hideOnToggle: true,
    toolbarAlign: "tr-tr",
    toolbarOffset: [-5, 3],
    animation: true,
    closeAction: "hide",
    closeOnOutsideClick: false,

    hoverConfig: {
        hideDelay: 200,
        showDelay: 500
    },

    childEls: [
        "body",
        "header",
        "headerText",
        "arrow"
    ],

    renderTpl: [
        '<div id="{id}-arrow" class="{baseCls}-arrow<tpl if="arrowCls"> {arrowCls}</tpl>"<tpl if="arrowStyle"> style="{arrowStyle}"</tpl>>',
        '</div>',
        '<h3 id="{id}-header" class="{baseCls}-header<tpl if="headerCls"> {headerCls}</tpl>"<tpl if="headerStyle"> style="{headerStyle}"</tpl>><span id="{id}-headerText" class="{baseCls}-header-text">{title}</span></h3>',
        '<div id="{id}-body" class="{baseCls}-body<tpl if="bodyCls"> {bodyCls}</tpl>"<tpl if="bodyStyle"> style="{bodyStyle}"</tpl>>{html}</div>'
    ],

    statics: {
        show: function (target, config, forceNew) {
            if (target) {
                var isCmp = target && target.isComponent,
                    t = isCmp ? target.el : Ext.get(target),
                    calloutOwner = isCmp ? target : t,
                    callout, show;

                if (target.callouts && target.callouts.length > 0 && !forceNew) {
                    callout = target.callouts[0];

                    if (config && Ext.isDefined(config.title)) {
                        callout.setTitle(config.title);
                    }

                    if (config && Ext.isDefined(config.html)) {
                        callout.setHtml(config.html);
                    }

                    if (config && Ext.isDefined(config.iconCls)) {
                        callout.setIconCls(config.iconCls);
                    }

                    if (config && Ext.isDefined(config.alignment)) {
                        if (callout.rendered) {
                            callout.removeCls(callout.baseCls + "-" + callout.alignment);
                            callout.addCls(callout.baseCls + "-" + config.alignment);
                        }

                        callout.origalignment = config.alignment;
                        callout.alignment = config.alignment;
                    }

                    if (config && Ext.isDefined(config.animation)) {
                        callout.animation = config.animation;
                    }

                    if (config && Ext.isDefined(config.ui)) {
                        callout.setUI(config.ui);
                    }

                    callout.triggerElement = t;
                    callout.hidden = true;
                    callout.delayShow();
                } else {
                    config.target = calloutOwner;

                    if (!Ext.isDefined(config.trigger)) {
                        config.trigger = "manual";
                    }

                    if (config.trigger == "manual" && !Ext.isDefined(config.hidden)) {
                        show = true;
                    }

                    callout = Ext.create("Ext.net.Callout", config);

                    if (show) {
                        callout.triggerElement = t;
                        callout.delayShow();
                    }
                }

                return callout
            }
        },

        hide: function (target) {
            if (target) {
                var isCmp = target && target.isComponent,
                    t = isCmp ? target.el : Ext.get(target),
                    calloutOwner = isCmp ? target : t,
                    callout;

                if (target.callouts && target.callouts.length > 0) {
                    callout = target.callouts[0];
                    callout.clearTimer('show');
                    callout.triggerElement = null;
                    callout.delayHide();
                }
            }
        },

        destroy: function (target) {
            if (target) {
                var isCmp = target && target.isComponent,
                    t = isCmp ? target.el : Ext.get(target),
                    calloutOwner = isCmp ? target : t,
                    callout;

                if (target.callouts && target.callouts.length > 0) {
                    callout = target.callouts[0];
                    callout.destroy();
                }
            }
        }
    },

    constructor: function (config) {
        if (config && config.hoverConfig) {
            Ext.apply(this.hoverConfig, config.hoverConfig);
            delete config.hoverConfig;
        }

        if (config && Ext.isDefined(config.hidden)) {
            this.hasConfigHidden = true;
        }

        this.callParent([config]);
    },

    initRenderData: function () {
        return Ext.applyIf(this.callParent(), {
            title: this.title || "",
            html: this.html || "",
            arrowCls: this.arrowCls,
            arrowStyle: this.arrowStyle,
            headerCls: this.headerCls,
            headerStyle: this.headerStyle,
            bodyCls: this.bodyCls,
            bodyStyle: this.bodyStyle
        });
    },

    initComponent: function () {
        var me = this,
            target;

        me.detectFocusInGecko = Ext.Function.bind(me.detectFocusInGecko, me);

        if (me.target) {
            if (!me.renderTo) {
                me.renderTo = Ext.getBody();
                Ext.WindowManager.register(me);
                me.renderedToBody = true;
            }

            if (me.target.isComponent && !me.target.rendered) {
                me.target.on("afterrender", function () {
                    target = me.target;
                    delete me.target;
                    me.setTarget(target);
                }, me);
            } else {
                target = me.target;
                delete me.target;
                me.setTarget(target);
            }
        }
        else {
            if (!this.hasConfigHidden) {
                this.hidden = false;
            }

            this.animation = false;
            this.addCls(this.baseCls + "-" + this.alignment);
        }

        me.origalignment = me.alignment;

        me.callParent(arguments);
    },

    onRender: function () {
        this.callParent(arguments);

        this.body = Ext.get(this.id + "-body");
        this.header = Ext.get(this.id + "-header");
        this.headerText = Ext.get(this.id + "-headerText");
        this.arrow = Ext.get(this.id + "-arrow");

        if (!this.target) {
            this.el.setStyle("position", "relative");
        }

        if (this.noArrow) {
            this.arrow.setDisplayed(false);
        }

        if (this.maxWidth) {
            this.el.setStyle("maxWidth", this.maxWidth + "px");
        }

        this.setTitle(this.title);

        if (this.headerToolbar) {
            this.createHeaderToolbar();
        }

        if (this.bodyWidget) {
            this.createBodyWidget();
        }

        if (this.iconCls) {
            this.setIconCls(this.iconCls);
        }

        if (this.glyph) {
            var glyph = this.glyph;
            delete this.glyph;
            this.setGlyph(glyph);
        }
    },

    setIconCls: function (cls) {
        if (this.iconCls) {
            this.header.removeCls(this.iconCls);
        }

        this.iconCls = cls && cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls;

        if (this.iconCls) {
            this.header.addCls("x-callout-header-icon");
            this.header.addCls(this.iconCls);
        } else {
            this.header.removeCls("x-callout-header-icon");
        }
    },

    renderGlyphEl: function () {
        this.glyphEl = Ext.core.DomHelper.insertFirst(this.header, {
            tag: "span",
            cls: "x-callout-glyph",
            unselectable: "on"
        }, true);

        this.glyphEl.on("click", function (e, t) {
            this.fireEvent("glyphclick", this, e, t);
        }, this);

        return this.glyphEl;
    },

    setGlyph: function (glyph) {
        glyph = glyph || 0;
        var me = this,
            glyphEl = me.glyphEl,
            oldGlyph = me.glyph,
            fontFamily, glyphParts;

        me.glyph = glyph;

        if (!glyphEl) {
            glyphEl = this.renderGlyphEl();
        }

        if (typeof glyph === 'string') {
            glyphParts = glyph.split('@');
            glyph = glyphParts[0];
            fontFamily = glyphParts[1] || Ext._glyphFontFamily;
        }

        if (!glyph) {
            glyphEl.dom.innerHTML = '';
        } else if (oldGlyph != glyph) {
            glyphEl.dom.innerHTML = '&#' + glyph + ';';
        }

        if (fontFamily) {
            glyphEl.setStyle('font-family', fontFamily);
        }

        this.header.addCls("x-callout-glyph-" + (this.glyphScale || "small"));

        return me;
    },

    setTarget: function (target, eventTarget) {
        var me = this,
            isCmp = target && target.isComponent,
            t = isCmp ? target.el : Ext.get(target),
            calloutOwner = isCmp ? target : t,
            tg;

        if (this.eventSelector) {
            eventTarget = t.down(this.eventSelector);
        }

        if (this.selector) {
            t = t.down(this.selector);
        }

        if (!eventTarget && isCmp) {
            if (target.inputEl) {
                eventTarget = target.inputEl;
                t = target.inputWrap;
            }
        }

        if (me.eventTarget) {
            tg = Ext.get(me.eventTarget);
            me.mun(tg, 'mouseover', me.onTargetOver, me);
            me.mun(tg, 'mouseout', me.onTargetOut, me);
            me.mun(tg, 'mousemove', me.onMouseMove, me);
        }

        if (me.focusInInterval) {
            clearInterval(me.focusInInterval);
        }

        if (isCmp && me.checkDomInterval) {
            clearInterval(me.checkDomInterval);
        }

        if (!isCmp) {
            me.checkDomInterval = setInterval(Ext.Function.bind(this.checkDom, this), 10000);
        }

        if (!calloutOwner.callouts) {
            calloutOwner.callouts = [];
        }

        calloutOwner.callouts.push(this);

        me.target = t;
        me.calloutOwner = calloutOwner;
        me.eventTarget = eventTarget || t;

        if (t) {
            if (me.trigger == "hover") {

                Ext.apply(this, this.hoverConfig);

                me.mon(me.eventTarget, {
                    freezeEvent: true,
                    mouseover: me.onTargetOver,
                    mouseout: me.onTargetOut,
                    mousemove: me.onMouseMove,
                    scope: me
                });
            } else if (me.trigger == "click") {
                me.mon(me.eventTarget, {
                    click: me.onTargetClick,
                    scope: me
                });
            } else if (me.trigger == "focus") {
                if (this.delegate && Ext.isGecko) {
                    me.focusInInterval = setInterval(me.detectFocusInGecko, 200);
                } else if (this.delegate && Ext.isIE) {
                    me.mon(me.eventTarget, {
                        focusin: me.onTargetFocus,
                        focusout: me.onTargetBlur,
                        scope: me
                    });
                } else {
                    me.mon(me.eventTarget, {
                        focus: me.onTargetFocus,
                        blur: me.onTargetBlur,
                        scope: me
                    });
                }
            }

            if (this.hidden === false) {
                this.triggerElement = t;
                this.delayShow();
            }
        }
    },

    detectFocusInGecko: function () {
        if (document.activeElement != this.lastActiveElement) {
            var obj = new Ext.EventObjectImpl();

            if (this.lastActiveElement) {
                obj.target = this.lastActiveElement;
                this.lastActiveElement = null;
                this.onTargetBlur(obj);
            }

            if (this.eventTarget.contains(document.activeElement)) {
                this.lastActiveElement = document.activeElement;
                obj.target = this.lastActiveElement;
                this.onTargetFocus(obj);
            }
        }
    },

    createHeaderToolbar: function () {
        this.headerToolbar.floating = true;
        this.headerToolbar.shadow = false;
        this.headerToolbar.renderTo = this.el;
        this.headerToolbar = Ext.ComponentManager.create(this.headerToolbar, "toolbar");
        this.headerToolbar.callout = this;
    },

    createBodyWidget: function () {
        this.bodyWidget.renderTo = this.body;
        this.bodyWidget = Ext.ComponentManager.create(this.bodyWidget, "container");
        this.bodyWidget.callout = this;
        this.body.addCls(this.baseCls + "-body-widget");
    },

    doAlign: function () {
        if (this.target) {
            this.checkConstrain();

            var offset = this.getOffset(),
                align = this.getAlign(offset),
                config;

            config = {
                el: this.delegate ? this.triggerElement : this.target,
                alignment: this.alignment,
                align: align,
                offset: offset
            };

            this.fireEvent("beforealign", this, config);

            this.addCls(this.baseCls + "-" + config.alignment);
            this.el.alignTo(config.el, config.align, config.offset);

            this.toFront(true);
        }
    },

    doHeaderToolbarAlign: function () {
        if (this.headerToolbar) {
            this.headerToolbar.el.alignTo(this.el, this.toolbarAlign, this.toolbarOffset);
        }
    },

    getAlign: function () {
        if (this.alignment == "left") {
            return "r-l";
        } else if (this.alignment == "right") {
            return "l-r";
        } else if (this.alignment == "top") {
            return "b-t";
        } else if (this.alignment == "bottom") {
            return "t-b";
        } else if (this.alignment == "topleft") {
            return "bl-tl";
        } else if (this.alignment == "topright") {
            return "br-tr";
        } else if (this.alignment == "bottomright") {
            return "tr-br";
        } else if (this.alignment == "bottomleft") {
            return "tl-bl";
        } else if (this.alignment == "lefttop") {
            return "tr-tl";
        } else if (this.alignment == "leftbottom") {
            return "br-bl";
        } else if (this.alignment == "righttop") {
            return "tl-tr";
        } else if (this.alignment == "rightbottom") {
            return "bl-br";
        }
    },

    checkConstrain: function () {
        var me = this,
            offsets,
            parent,
            isBody,
            xy,
            dw,
            dh,
            de,
            bd,
            scrollX,
            scrollY,
            axy,
            sz,
            oldalignment;

        if (me.constrainPosition) {
            oldalignment = me.alignment,
            parent = this.el.parent(),
            isBody = parent == Ext.getBody(),
            offsets = this.getOffset();
            xy = me.getAlignToXY(this.delegate ? this.triggerElement : this.target, me.getAlign());
            dw = (isBody ? Ext.Element.getViewportWidth() : parent.getViewSize().width) - 5;
            dh = (isBody ? Ext.Element.getViewportHeight() : parent.getViewSize().height) - 5;
            de = document.documentElement;
            bd = document.body;
            scrollX = (de.scrollLeft || bd.scrollLeft || 0) + 5;
            scrollY = (de.scrollTop || bd.scrollTop || 0) + 5;
            axy = [xy[0] + offsets[0], xy[1] + offsets[1]];
            sz = me.getSize();

            if (Ext.net.StringUtils.startsWith(me.alignment, "left") && (axy[0] < scrollX)) {
                me.alignment = "right" + me.alignment.substring(4);
            } else if (Ext.net.StringUtils.startsWith(me.alignment, "right") && (axy[0] + sz.width > dw)) {
                me.alignment = "left" + me.alignment.substring(5);
            } else if (Ext.net.StringUtils.startsWith(me.alignment, "top") && (axy[1] < scrollY)) {
                me.alignment = "bottom" + me.alignment.substring(3);
            } else if (Ext.net.StringUtils.startsWith(me.alignment, "bottom") && (axy[1] + sz.height > dh)) {
                me.alignment = "top" + me.alignment.substring(6);
            }

            if (oldalignment && oldalignment != me.alignment) {
                this.removeCls(this.baseCls + "-" + oldalignment);
            }
        }
    },

    getOffset: function () {
        var value = this.noArrow ? 2 : 10,
            offset = [value, 0];

        if (this.alignment == "left" || this.alignment == "lefttop" || this.alignment == "leftbottom") {
            offset = [-value, 0];
        } else if (this.alignment == "right" || this.alignment == "righttop" || this.alignment == "rightbottom") {
            offset = [value, 0];
        } else if (this.alignment == "top" || this.alignment == "topleft" || this.alignment == "topright") {
            offset = [0, -value];
        } else if (this.alignment == "bottom" || this.alignment == "bottomleft" || this.alignment == "bottomright") {
            offset = [0, value];
        }

        if (this.offset) {
            offset[0] += this.offset[0];
            offset[1] += this.offset[1];
        }

        return offset;
    },

    setTitle: function (title) {
        this.title = title;
        this.headerText.dom.innerHTML = title;
        this.header.setDisplayed(!!title);
    },

    setHtml: function (html) {
        this.html = html;
        this.body.dom.innerHTML = html;
    },

    onMouseMove: function (e) {
        var me = this,
            t = me.delegate ? e.getTarget(me.delegate) : me.triggerElement = true,
            xy;

        if (t) {
            if ((t === true && me.triggerElement !== true) || (t !== true && t !== (me.triggerElement && me.triggerElement.dom))) {
                me.hide();
                me.lastActive = new Date(0);
                me.onTargetOver(e);
            }
        } else if (!me.hidden && me.autoHide !== false) {
            me.hide();
        }
    },

    hide: function () {
        var me = this;
        me.clearTimer('dismiss');
        me.lastActive = new Date();

        me.callParent(arguments);
        delete me.triggerElement;

        if (this.closeAction == "destroy") {
            this.destroy();
        }
    },

    onTargetClick: function (e) {
        var me = this,
            delegate = me.delegate,
            t;

        if (me.disabled || e.within(me.target.dom, true)) {
            return;
        }

        t = delegate ? e.getTarget(delegate) : true;
        if (t) {
            if (!this.hidden && delegate && (me.triggerElement && me.triggerElement.dom) != t) {
                this.hidden = true;
            }

            me.triggerElement = Ext.get(t);
            me.triggerEvent = e;
            me.clearTimer('hide');

            if (!this.hidden) {
                if (this.autoHide) {
                    if (me.showTimer) {
                        me.clearTimer('show');
                        me.triggerElement = null;
                    }

                    me.delayHide();
                }
            } else {
                me.delayShow();
            }
        }
    },

    onTargetFocus: function (e) {
        var me = this,
            delegate = me.delegate,
            t;

        if (me.disabled) {
            return;
        }

        t = delegate ? e.getTarget(delegate) : true;

        if (t) {
            me.triggerElement = Ext.get(t);
            me.triggerEvent = e;
            me.clearTimer('hide');

            if (!this.hidden && delegate) {
                this.hidden = true;
            }

            if (this.hidden) {
                me.delayShow();
            }
        }
    },

    onTargetBlur: function (e) {
        var me = this,
            delegate = me.delegate,
            t;

        if (me.disabled) {
            return;
        }

        t = delegate ? e.getTarget(delegate) : true;

        if (t) {
            me.triggerElement = Ext.get(t);
            me.triggerEvent = e;
            me.clearTimer('hide');

            if (!this.hidden && this.autoHide) {
                if (me.showTimer) {
                    me.clearTimer('show');
                    me.triggerElement = null;
                }

                me.delayHide();
            }
        }
    },

    onTargetOver: function (e) {
        var me = this,
            delegate = me.delegate,
            t;

        if (me.disabled || e.within(me.eventTarget, true)) {
            return;
        }

        t = delegate ? e.getTarget(delegate) : true;

        if (t) {
            me.triggerElement = Ext.get(t);
            me.triggerEvent = e;
            me.clearTimer('hide');
            me.delayShow();
        }
    },

    delayShow: function () {
        var me = this;

        if (me.hidden && !me.showTimer) {
            if ((me.lastActive && (Ext.Date.getElapsed(me.lastActive) < me.quickShowInterval)) || (me.showDelay <= 0)) {
                me.show();
            } else {
                me.showTimer = Ext.defer(me.showFromDelay, me.showDelay, me);
            }
        } else if (!me.hidden && me.autoHide !== false) {
            me.show();
        }
    },

    showFromDelay: function () {
        this.fromDelayShow = true;
        this.show();
        delete this.fromDelayShow;
    },

    onTargetOut: function (e) {
        var me = this,
            triggerEl = me.triggerElement,
            // If we don't have a delegate, then the target is set
            // to true, so set it to the main target.
            target = triggerEl === true ? me.eventTarget : triggerEl;

        // If disabled, moving within the current target, ignore the mouseout
        // EventObject.within is the only correct way to determine this.
        if (me.disabled || !triggerEl || e.within(target, true)) {
            return;
        }


        if (me.showTimer) {
            me.clearTimer('show');
            me.triggerElement = null;
        }

        if (me.autoHide !== false) {
            me.delayHide();
        }
    },

    // @private
    delayHide: function () {
        var me = this;

        if (!me.hidden && !me.hideTimer) {
            if (me.hideDelay > 0) {
                me.hideTimer = Ext.defer(me.hide, me.hideDelay, me);
            } else {
                me.hide();
            }
        }
    },

    show: function () {
        var me = this;

        this.callParent(arguments);

        if (this.hidden === false) {
            if (me.alignment) {
                me.alignment = me.origalignment;
            }

            me.doAlign();

            if (this.animation) {
                this.el.setOpacity(0, false);
                this.el.fadeIn(this.animation);
            }
        }

        if (me.dismissDelay && me.autoHide !== false) {
            me.dismissTimer = Ext.defer(me.hide, me.dismissDelay, me);
        }

        if (!this.wasFirstShow) {
            this.wasFirstShow = true;
            this.firstShow();
        }
    },

    toggle: function () {
        this.hidden ? this.show() : this.hide();
    },

    firstShow: function () {
        if (this.headerToolbar) {
            this.headerToolbar.updateLayout();
            this.doHeaderToolbarAlign();
        }

        if (this.bodyWidget) {
            this.bodyWidget.updateLayout();
        }
    },

    _timerNames: {},

    clearTimer: function (name) {
        var me = this,
            names = me._timerNames,
            propName = names[name] || (names[name] = name + 'Timer'),
            timer = me[propName];

        if (timer) {
            clearTimeout(timer);
            me[propName] = null;
        }
    },

    clearTimers: function () {
        var me = this;
        me.clearTimer('show');
        me.clearTimer('dismiss');
        me.clearTimer('hide');
    },

    onShow: function () {
        var me = this;
        me.callParent(arguments);

        if (this.trigger == "hover" || this.closeOnOutsideClick) {
            me.mon(Ext.getDoc(), 'mousedown', me.onDocMouseDown, me);
        }
    },

    onHide: function () {
        var me = this;

        me.callParent(arguments);

        if (me.animation) {
            me.el.show();
            me.el.fadeOut(me.animation);
        }

        if (me.trigger == "hover" || this.closeOnOutsideClick) {
            me.mun(Ext.getDoc(), 'mousedown', me.onDocMouseDown, me);
        }
    },

    onDocMouseDown: function (e) {
        var me = this,
            t;

        if (!e.within(me.el.dom)) {
            if (me.trigger !== "manual" && e.within(me.target)) {
                t = this.delegate ? e.getTarget(this.delegate) : true;

                if (t) {
                    return;
                }
            }

            me.disable();
            Ext.defer(me.doEnable, 100, me);
        }
    },

    doEnable: function () {
        if (!this.isDestroyed) {
            this.enable();
        }
    },

    onDisable: function () {
        this.callParent();
        this.clearTimers();
        this.hide();
    },

    checkDom: function () {
        var d = this.target.dom;

        if (!d || (!d.parentNode || (!d.offsetParent && !Ext.getElementById(this.target.id)))) {
            this.destroy();
        }
    },

    beforeDestroy: function () {
        var me = this;
        me.clearTimers();
        delete me.target;
        delete me.triggerElement;

        if (me.checkDomInterval) {
            clearInterval(me.checkDomInterval);
        }

        if (me.focusInInterval) {
            clearInterval(me.focusInInterval);
        }

        if (this.headerToolbar && this.headerToolbar.destroy) {
            this.headerToolbar.destroy();
        }

        if (this.bodyWidget && this.bodyWidget.destroy) {
            this.bodyWidget.destroy();
        }

        me.callParent();
    },

    onDestroy: function () {
        if (this.trigger == "hover" || this.closeOnOutsideClick) {
            Ext.getDoc().un('mousedown', this.onDocMouseDown, this);
        }

        if (!this.destroyFromCmp && this.calloutOwner && this.calloutOwner.callouts) {
            Ext.Array.remove(this.calloutOwner.callouts, this);
        }

        this.callParent();
    },

    setZIndex: function (index) {
        var me = this;

        me.el.setStyle("zIndex", index);
        index += 10;
        return index;
    }
});

Ext.onReady(function() {
    Ext.MessageBox.callout = function (target, config) {
        return Ext.net.Callout.show(target, config);
    };
});
