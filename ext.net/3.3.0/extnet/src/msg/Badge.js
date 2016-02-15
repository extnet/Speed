Ext.define('Ext.net.Badge', {
    extend: "Ext.util.Observable",
    alias: 'plugin.badge',

    badgeTextCls: "x-badge-text",
    badgeNumberCls: "x-badge-number",
    alignment: "c-tr",
    scale: "small",
    hideEmpty: true,

    statics: {
        show: function (cmp, config) {
            if (Ext.isString(cmp)) {
                cmp = Ext.getCmp(cmp);
            }

            if (cmp.badge) {
                if (!Ext.isDefined(config)) {
                    cmp.badge.show();
                    return cmp.badge;
                }

                if (!Ext.isObject(config)) {
                    cmp.badge.setHtml(config);
                    cmp.badge.show();
                    return cmp.badge;
                }

                Ext.Array.remove(cmp.plugins, cmp.badge);
                cmp.badge.destroy();
            }

            if (!Ext.isObject(config)) {
                config = {
                    text: config
                };
            }

            var badge = Ext.create('Ext.net.Badge', config);

            cmp.addPlugins(badge);

            return badge;
        },

        hide: function (cmp) {
            if (Ext.isString(cmp)) {
                cmp = Ext.getCmp(cmp);
            }

            if (cmp.badge) {
                cmp.badge.hide();
                return cmp.badge;
            }
        }
    },

    constructor: function (config) {
        Ext.apply(this, config);

        this.callParent(arguments);
    },

    init: function (cmp) {
        this.cmp = cmp;
        this.cmp.badge = this;

        this.cmp.on({
            show: this.show,
            hide: this.hide,
            scope: this
        });

        if (this.text) {
            this.html = Ext.util.Format.htmlEncode(this.text);
            delete this.text;
        }

        this.updatePosition = Ext.Function.createBuffered(this.realUpdatePosition, 100, this);

        if (cmp.rendered) {
            this.initPlugin();
        }
        else {
            cmp.on("afterrender", this.initPlugin, this, { single: true, delay: 100 });
        }
    },

    getTargetEl: function () {
        var targetEl;

        if (this.selector) {
            targetEl = this.cmp.el.down(this.selector);
        }
        else {
            targetEl = this.cmp.el;
        }

        return targetEl;
    },

    getRenderTo: function () {
        return this.renderToBody !== false ? Ext.getBody() : this.targetEl.parent();
    },

    initPlugin: function () {
        this.targetEl = this.getTargetEl();
        if (this.renderToBody !== false) {
            this.floatingParent = this.cmp.up('[floating]');

            var floating = (this.floatingParent || this.cmp),
                zm = floating.zIndexManager,
                visible;

            if (zm) {
                floating.setZIndex = Ext.Function.createSequence(floating.setZIndex, function () {
                    if (this.badgeEl) {
                        Ext.Function.defer(this.updateZIndex, 10, this);
                    }
                }, this);
            }

            if (this.floatingParent && this.floatingParent.floating) {
                this.floatingParent.on("move", this.updatePosition, this);
            }

            if (floating.floating && Ext.isFunction(floating.ghost)) {
                floating.ghost = Ext.Function.createSequence(floating.ghost, function () {
                    if (this.badgeEl) {
                        this._needToShow = !this.hidden;
                        this.hide();
                    }
                }, this);

                floating.unghost = Ext.Function.createSequence(floating.unghost, function () {
                    if (this.badgeEl && this._needToShow) {
                        delete this._needToShow;
                        this.show();
                    }

                }, this);
            }
        }

        this.badgeEl = this.getRenderTo().createChild({
            tag: "div",
            cls: "x-badge" + (this.cls ? (" " + this.cls) : ""),
            style: "top:-10000px;" + this.style || "",

            children: [{
                tag: "div",
                cls: "x-badge-wrap" + (this.wrapCls ? (" " + this.wrapCls) : ""),
                style: this.wrapStyle || "",

                children: [{
                    tag: "p",
                    cls: "x-badge-inner" + (this.textCls ? (" " + this.textCls) : ""),
                    style: this.textStyle || "",
                    html: Ext.isDefined(this.html) ? this.html : ""
                }]
            }]
        });

        visible = this.cmp.isVisible();
        if (!visible) {
            this.hide();
        }

        if (this.overCls) {
            this.badgeEl.addClsOnOver(this.overCls);
        }

        this.textEl = this.badgeEl.down("p");
        this.badgeEl.unselectable();
        this.setScale(this.scale);
        if (this.ui) {
            this.setUI(this.ui);
        }
        this.setHtml(this.html);

        this.cmp.on({
            afterlayout: this.updatePosition,
            resize: this.updatePosition,
            move: this.updatePosition,
            scope: this
        });

        this.initEvents();
    },

    setScale: function (scale) {
        if (this.scale && this.badgeEl) {
            this.badgeEl.removeCls("x-badge-" + this.scale);
        }

        this.scale = scale;
        if (this.scale && this.badgeEl) {
            this.badgeEl.addCls("x-badge-" + this.scale);
        }

        this.realUpdatePosition();
    },

    setText: function (text) {
        this.setHtml(Ext.util.Format.htmlEncode(text));
    },

    setHtml: function (html) {
        var isnan,
            fireEvent,
            oldHtml;

        if (html && html.charAt) {
            if (html.charAt(0) == '+') {
                if (isNaN(html.substr(1))) {
                    html = (this.html || 0) + html.substr(1);
                }
                else {
                    html = Math.round(~~this.html + ~~html.substr(1));
                }
            }
            else if (html.charAt(0) == '-') {
                if (!isNaN(html.substr(1))) {
                    html = Math.round(~~this.html - ~~html.substr(1));
                }
            }
        }

        isnan = isNaN(html);

        fireEvent = this.html !== html;

        oldHtml = this.html;
        this.html = Ext.isDefined(html) ? html : "";
        this.textEl.dom.innerHTML = this.html;

        if (fireEvent) {
            this.fireEvent("change", this, html, oldHtml);
        }

        if (this.hideEmpty && !this.html && isnan) {
            this.hide();
            return;
        }

        if (isnan) {
            this.textEl.removeCls("x-badge-number");
            this.textEl.addCls("x-badge-text");
        }
        else {
            this.textEl.removeCls("x-badge-text");
            this.textEl.addCls("x-badge-number");
        }

        this.realUpdatePosition();
    },

    setUI: function (ui) {
        if (this.ui && this.badgeEl) {
            this.badgeEl.removeCls("x-badge-" + this.ui);
        }

        this.ui = ui;
        if (this.ui && this.badgeEl) {
            this.badgeEl.addCls("x-badge-" + this.ui);
        }
    },

    updateZIndex: function () {
        var cmp = this.floatingParent || this.cmp,
            z,
            zm,
            zParent = this.cmp.zIndexParent;

        if (zParent && this.badgeEl) {
            this.badgeEl.setStyle("z-index", ~~zParent.el.getStyle("z-index") + 1);
        }
        else {
            z = cmp.el.getStyle("z-index");
            zm = cmp.zIndexManager;
            if ((z || zm) && this.badgeEl) {
                this.badgeEl.setStyle("z-index", (!zm || (~~z > zm.zseed)) ? (~~z + 1) : (zm.zseed + 1));
            }
        }
    },

    realUpdatePosition: function () {
        if (this.badgeEl) {
            if (this.renderToBody !== false) {
                this.updateZIndex();
            }
            this.badgeEl.alignTo(this.targetEl, this.alignment, this.offset ? this.offset : [0, 0], false);
        }
    },

    initEvents: function () {
        this.badgeEl.on({
            mouseover: this.onMouseOver,
            mouseout: this.onMouseOut,
            click: this.onClick,
            dblclick: this.onDblClick,
            scope: this
        });
    },

    onMouseOver: function (e) {
        this.fireEvent("mouseover", this, e);
    },

    onMouseOut: function (e) {
        this.fireEvent("mouseout", this, e);
    },

    onClick: function (e) {
        this.fireEvent("click", this, e);
    },

    onDblClick: function (e) {
        this.fireEvent("dblclick", this, e);
    },

    show: function () {
        if (this.badgeEl) {
            this.hidden = false;
            this.badgeEl.show();
            this.realUpdatePosition();
            this.fireEvent("show", this);
        }
    },

    hide: function () {
        if (this.badgeEl) {
            this.hidden = true;
            this.badgeEl.hide();
            this.fireEvent("hide", this);
        }
    },

    destroy: function () {
        if (this.badgeEl) {
            this.badgeEl.destroy();
            delete this.badgeEl;
        }
        this.cmp.un({
            show: this.show,
            hide: this.hide,
            afterlayout: this.updatePosition,
            resize: this.updatePosition,
            move: this.updatePosition,
            scope: this
        });

        if (this.floatingParent) {
            this.floatingParent.un("move", this.updatePosition, this);
        }

        this.callParent(arguments);
    }
});

Ext.onReady(function() {
    Ext.MessageBox.badge = function (cmp, config) {
        if (config) {
            Ext.net.Badge.show(cmp, config);
        } else {
            Ext.net.Badge.hide(cmp);
        }
    };
});

