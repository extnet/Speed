// @source core/msg/InfoPanel.js

Ext.layout.ContextItem.override({
    flushAnimations: function () {
        var target = this.target,
            index,
            width,
            height,
            clear,
            ct = target.ownerCt,
            items,
            config = target.notificationAnimationConfig;

        if (target.isNotification && config && ct) {
            items = target.queue.getItems(true);
            target.getLayout().animate = target.queue.fx.show;
            index = items.length - 2;

            if (config.x === true) {
                width = this.props["width"] || target.getWidth();
                config.x = (index >= 0 ? items[index].el.getBox(false, true).right : 0) - width;
            }

            if (config.y === true) {
                height = this.props["height"] || target.getHeight();
                config.y = (index >= 0 ? items[index].el.getBox(false, true).bottom : 0) - height;
            }

            if (target.queue.fx.show && target.queue.fx.show.opacity) {
                config.opacity = 0;
                this.props["opacity"] = 1;
            }

            this.previousSize = config;
            clear = true;
        }

        this.callParent(arguments);

        if (clear) {
            target.getLayout().animate = target.queue.fx.slideBack;

            delete target.notificationAnimationConfig;
            delete this.previousSize.opacity;
            delete this.props["opacity"];
        }
    }
});

Ext.define('Ext.net.InfoPanelQueue', {
    extend: "Ext.util.Observable",
    addToEnd: true,
    sliding: true,
    vertical: true,
    offsetX: 20,
    offsetY: 20,
    spacing: 10,
    animateOpacity: true,
    defaultType: "infopanel",
    statics: {
        queues: {},
        noneQueue: {
            items: [],
            removeAll: function (animate) {
                var items = this.items,
                    item,
                    i,
                    len;

                this.items = [];

                for (i = 0, len = items.length; i < len; i++) {
                    item = item[i];

                    if (!item.hidden && item.rendered && animate !== false) {
                        item.destroy();
                    } else {
                        item.destroy(false);
                    }
                }
            }
        }
    },

    constructor: function (config) {
        config = config || {};

        if (config.animate === undefined) {
            config.animate = Ext.isBoolean(this.animate) ? this.animate : Ext.enableFx;
        }

        this.enableAnimations = config.animate;
        delete config.animate;

        this.callParent([config]);

        Ext.net.InfoPanelQueue.queues[this.name] = this;
        this.initQueue();
    },

    initQueue: function () {
        if (!this.container) {
            this.initItems();
            Ext.on('resize', this.align, this, { buffer: 200 });
        }

        if (this.slideTo == "right" || this.slideTo == "left") {
            this.vertical = false;
        }

        Ext.net.InfoPanelQueue.queues[this.name] = this;

        this.fx = Ext.merge(this.getDefaultFx(), this.fx || {});

        if (!this.alignment) {
            this.alignment = "tr-tr";
        }

        if (!this.container) {
            this.calculateItemAlign();
        }
    },

    calculateItemAlign: function () {
        var reverse,
            alignParts,
            ea0, ea1, elen;

        this.itemAnchor = "";
        reverse = this.isReverseSlide();
        alignParts = this.alignment.split("-");
        elen = alignParts[0].length;
        ea0 = alignParts[0].charAt(0);
        ea1 = elen == 2 ? alignParts[0].charAt(1) : alignParts[0].charAt(0);

        if (this.vertical) {
            this.itemAnchor = (reverse ? "t" : "b") + (elen == 2 ? ea1 : "");
        } else {
            this.itemAnchor = elen == 2 ? (ea0 + (reverse ? "l" : "r")) : ea0;
        }

        this.itemAnchor += "-" + this.itemAnchor;
        this.alignOffset = [
            (elen == 2 ? (ea1 == "r" ? -1 : 1) : (ea0 == "r" ? -1 : (ea0 == "l" ? 1 : 0))) * this.offsetX,
            (ea0 == "t" ? 1 : (ea0 == "b" ? -1 : 0)) * this.offsetY
        ];
    },

    getNotificationId: function (n) {
        return n.getItemId && n.getItemId();
    },

    getDefaultFx: function () {
        return {
            show: {
                easing: 'easeIn',
                duration: 500,
                opacity: this.animateOpacity
            },

            hide: {
                duration: 500,
                opacity: this.animateOpacity
            },

            slideBack: {
                duration: 500
            }
        };
    },

    initItems: function () {
        var i,
            items = this.items;

        this.items = new Ext.util.AbstractMixedCollection(false, this.getNotificationId);

        if (items) {
            if (!Ext.isArray(items)) {
                items = [items];
            }

            this.add(items);
        }
    },

    applyDefaults: function (config) {
        var i,
            defaults = this.defaults;

        if (defaults) {
            if (Ext.isArray(config)) {
                for (i = 0; i < config.length; i++) {
                    config[i] = this.applyDefaults(config[i]);
                }

                return config;
            }

            Ext.applyIf(config, defaults);
        }

        return config;
    },

    lookupComponent: function (comp) {
        return (typeof comp == 'string') ? Ext.ComponentManager.get(comp)
                                            : Ext.ComponentManager.create(comp, this.defaultType);
    },

    initNotification: function (item) {
        if (!item.queue) {
            item.queue = this;
        }

        if (!this.container) {
            this.fireEvent("beforeadd", this, item);
            this.initAlignEl();

            item.hideMode = "offsets";
            item = this.applyDefaults(item);
            item = this.lookupComponent(item);

            this.addToEnd ? this.items.add(item) : this.items.insert(0, item);
            this.fireEvent("add", this, item);

            if (item.rendered) {
                this.onItemRender(item);
                this.onAfterItemRender(item);
            } else {
                item.on("render", this.onItemRender, this, { single: true });
                item.on("afterrender", this.onAfterItemRender, this, { single: true });
            }

            item.on("destroy", this.align, this);
            item.on("hide", this.onItemHide, this);
            item.on("beforeshow", this.onItemBeforeShow, this);
            item.on("show", this.align, this);
            item.on("resize", this.align, this, { buffer: 200 });
        } else if (this.enableAnimations) {
            var vertical = this.vertical,
                c = {};

            if (this.sliding) {
                if (vertical) {
                    c.y = true;
                } else {
                    c.x = true;
                }
            }

            item.notificationAnimationConfig = c;
        }

        return item;
    },

    initContainer: function () {
        if (!this.container.rendered) {
            this.container.on("afterrender", this.initContainer, this, { single: true });

            return;
        }

        var vertical = this.vertical,
            l = this.container.getLayout(),
            i;

        this.vertical = vertical = (l.names && l.names.x) == "y";

        if (this.enableAnimations) {
            l.animatePolicy = this.animateOpacity ? { opacity: true } : {};

            if (this.sliding) {
                l.animatePolicy[vertical ? "y" : "x"] = true;
            }
        }

        if (this.container.items.length) {
            for (i = 0; i < this.container.items.length; i++) {
                this.initNotification(this.container.items.getAt(i));
            }
        }

        this.container.on("beforeadd", this.onBeforeAdd, this);
        this.container.addCls("x-infopanel-container");
        this.container.defaultType = this.defaultType;
        this.initContainer = Ext.emptyFn;
    },

    onBeforeAdd: function (container, item) {
        this.initNotification(item);
    },

    onItemRender: function (item) {
        if (!this.container) {
            item.el.getXY = item._getXY;
            item.el.setX(-10000);

            if (this.fx.show.opacity) {
                item.el.setOpacity(0);
            }
        }
    },

    initAlignEl: function () {
        if (!this.alignmentEl && !this.container) {
            this.alignmentEl = Ext.getBody();
        } else {
            this.alignmentEl = Ext.get(this.alignmentEl);
        }

        this.initAlignEl = Ext.emptyFn;
    },

    onAfterItemRender: function (item) {
        if (!item.hidden) {
            this.initItemAlign(item);
            this.align();
        }
    },

    onItemHide: function (item) {
        if (!item._destroyAfterHide) {
            this.align();
        }
    },

    onItemBeforeShow: function (item) {
        var _hidden = item.hidden;

        if (this.fx.show.opacity) {
            item.el.setOpacity(0);
        }

        item._includeToVisible = true;
        this.initItemAlign(item);

        delete item._includeToVisible;
    },

    initItemAlign: function (item) {
        var reverse = this.isReverseSlide(),
            vertical = this.vertical,
            el,
            align,
            xy,
            items = this.getItems(true),
            itemIndex = Ext.Array.indexOf(items, item),
            itemOffset;

        if (items.length > 1 && itemIndex > 0 && this.addToEnd) {
            el = items[itemIndex - 1];
            align = this.itemAnchor;
            itemOffset = [0, 0];
            el.el._xy = el._xy;
            xy = item.getAlignToXY(el, align, itemOffset);

            delete el.el._xy;
        } else {
            el = this.alignmentEl;
            align = this.alignment;
            itemOffset = [this.alignOffset[0], this.alignOffset[1]];

            if (vertical) {
                itemOffset[1] = (reverse ? 1 : -1) * (item.getHeight())
            } else {
                itemOffset[0] = (reverse ? 1 : -1) * (item.getWidth())
            }

            xy = item.getAlignToXY(el, align, itemOffset);
        }

        item.setXY(xy, false);

        if (item.el) {
            item.el.dom.style.visibility = "";
        }

        item._xy = xy;
    },

    isReverseSlide: function () {
        if (!this.slideTo) {
            var vertical = this.vertical;
            this.slideTo = vertical ? "left" : "up";

            if (vertical && this.addToEnd && Ext.net.StringUtils.startsWith(this.alignment, "t")) {
                this.slideTo = vertical ? "right" : "down";
            } else if (!vertical && this.addToEnd
                && (Ext.net.StringUtils.startsWith(this.alignment, "l")
                || Ext.net.StringUtils.startsWith(this.alignment, "bl")
                || Ext.net.StringUtils.startsWith(this.alignment, "tl"))) {
                this.slideTo = vertical ? "right" : "down";
            }
        }

        return this.slideTo == "up" || this.slideTo == "left";
    },

    add: function (items) {
        var i,
            len,
            item;

        if (this.container) {
            if (this.container && Ext.isString(this.container)) {
                this.container = Ext.net.ResourceMgr.getCmp(this.container);
            }

            if (this.container) {
                this.initContainer();
            }

            this.fireEvent("beforeadd", this, items);
            items = this.applyDefaults(items);
            items = this.addToEnd ? this.container.add(items) : this.container.insert(0, items);
            this.fireEvent("add", this, items);

            return items;
        }

        if (!Ext.isArray(items)) {
            items = [items];
        }

        for (i = 0, len = items.length; i < len; i++) {
            item = items[i];
            items[i] = this.initNotification(item);
        }

        return items.length == 1 ? items[0] : items;
    },

    remove: function (item, animate) {
        if (!item.hidden && item.rendered && animate !== false) {
            item.destroy();
        } else {
            if (this.container) {
                this.container.remove(item);
            } else {
                this.items.remove(item);
                this.align();
            }

            this.fireEvent("remove", this, item);
        }
    },

    removeAll: function (animate) {
        var items = this.container ? this.container.items : this.items,
            item,
            align,
            i, len;

        for (i = 0, len = items.length; i < len; i++) {
            item = item.getAt(i);

            if (!item.hidden && item.rendered && animate !== false) {
                item.destroy();
            } else {
                if (this.container) {
                    this.container.remove(item);
                } else {
                    align = true;
                }

                this.fireEvent("remove", this, item);
            }
        }

        if (align) {
            this.items.removeAll();
            this.align();
        }
    },

    getItems: function (visible) {
        var i,
            len,
            item,
            allItems = this.container ? this.container.items : this.items,
            items = [];

        for (i = 0, len = allItems.length; i < len; i++) {
            item = allItems.getAt(i);

            if (((visible && !item.hidden) || !visible || item._includeToVisible)
                && item.el
                && item.el.dom) {
                items.push(item);
            }
        }

        return items;
    },

    align: function () {
        if (this.container) {
            this.container.updateLayout();

            return;
        }

        var i,
            len,
            item,
            prevItem,
            x,
            y,
            xy,
            anim,
            config,
            items,
            reverse = this.isReverseSlide();

        items = this.getItems(true);

        for (i = 0, len = items.length; i < len; i++) {
            item = items[i];

            if (!item.el || !item.el.dom) {
                continue;
            }

            if (i == 0) {
                xy = item.getAlignToXY(this.alignmentEl, this.alignment, this.alignOffset);
            } else {
                prevItem = items[i - 1];

                if (prevItem.el && prevItem.el.dom) {
                    prevItem.el._xy = prevItem._xy;

                    xy = item.getAlignToXY(prevItem, this.itemAnchor, [
                        this.vertical ? 0 : ((reverse ? -1 : 1) * (item.getWidth() + this.spacing)),
                        this.vertical ? ((reverse ? -1 : 1) * (item.getHeight() + this.spacing)) : 0
                    ]);

                    delete prevItem.el._xy;
                } else {
                    xy = item.getAlignToXY(this.alignmentEl, this.alignment, this.alignOffset);
                }
            }

            if (item._xy[0] != xy[0] || item._xy[1] != xy[1]) {
                if (this.enableAnimations) {
                    item.stopAnimation();

                    if (!item.el || !item.el.dom) {
                        continue;
                    }

                    if (this.vertical) {
                        anim = reverse ? (item._xy[1] > xy[1] ? "show" : "slideBack") : (item._xy[1] < xy[1] ? "show" : "slideBack");
                    } else {
                        anim = reverse ? (item._xy[0] > xy[0] ? "show" : "slideBack") : (item._xy[0] < xy[0] ? "show" : "slideBack");
                    }

                    anim = this.fx[anim];

                    config = {
                        from: {
                            x: item.getX(),
                            y: item.getY()
                        },
                        to: {
                            x: xy[0],
                            y: xy[1]
                        },
                        duration: anim.duration,
                        dynamic: true
                    };

                    config.to.opacity = 1;

                    if (anim.easing) {
                        config.easing = anim.easing;
                    }

                    item.animate(config);
                } else {
                    item.setXY(xy, false);
                }

                item._xy = xy;
            }
        }
    }

}, function () {
    this.defaultQueue = new this({
        name: "default"
    });

    new this({
        name: "topright",
        alignment: "tr-tr",
        vertical: true,
        slideTo: "down"
    });

    new this({
        name: "topleft",
        alignment: "tl-tl",
        vertical: true,
        slideTo: "down"
    });

    new this({
        name: "top",
        alignment: "t-t",
        vertical: true,
        slideTo: "down"
    });

    new this({
        name: "bottomright",
        alignment: "br-br",
        vertical: true,
        slideTo: "up"
    });

    new this({
        name: "bottomleft",
        alignment: "bl-bl",
        vertical: true,
        slideTo: "up"
    });

    new this({
        name: "bottom",
        alignment: "b-b",
        vertical: true,
        slideTo: "up"
    });

    new this({
        name: "righttop",
        alignment: "tr-tr",
        vertical: false,
        slideTo: "left"
    });

    new this({
        name: "rightbottom",
        alignment: "br-br",
        vertical: false,
        slideTo: "left"
    });

    new this({
        name: "right",
        alignment: "r-r",
        vertical: false,
        slideTo: "left"
    });

    new this({
        name: "lefttop",
        alignment: "tl-tl",
        vertical: false,
        slideTo: "right"
    });

    new this({
        name: "leftbottom",
        alignment: "bl-bl",
        vertical: false,
        slideTo: "right"
    });

    new this({
        name: "left",
        alignment: "l-l",
        vertical: false,
        slideTo: "right"
    });

    new this({
        name: "center",
        alignment: "c-c",
        vertical: true,
        slideTo: "down"
    });
});



Ext.define('Ext.net.InfoPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.infopanel',
    bodyCls: "x-infopanel-body",
    minWidth: 200,
    isNotification: true,
    shadow: false,
    autoHide: false,
    pinEvent: "none",
    hideDelay: 7000,
    showPin: false,
    pinned: false,
    bringToFront: true,
    focusOnToFront: false,
    textAlign: 'left',
    statics: {
        info: function (title, html, queue) {
            var config;

            if (arguments.length == 1 && Ext.isObject(title)) {
                config = title;
            } else {
                config = {};
                config.title = title;
                config.html = html;
                config.queue = queue;
            }

            config.isFloatingInfo = true;

            if (config.floating !== false && !Ext.isDefined(config.autoHide)) {
                config.autoHide = true;
            }

            if (!config.alignmentEl && config.floating !== false) {
                if (!config.queue) {
                    config.queue = Ext.net.InfoPanelQueue.defaultQueue;
                }

                if (Ext.isString(config.queue)) {
                    config.queue = Ext.net.InfoPanelQueue.queues[config.queue];
                }

                return config.queue.add(config);
            } else {
                return Ext.create("Ext.net.InfoPanel", config);
            }
        }
    },

    toFront: function () {
        this.setZIndex(this.zIndexManager.zseed);

        if (this.modal) {
            this.zIndexManager.showModalMask(this); // #621
        }
    },

    initComponent: function () {
        var noqueue = false;
        this.addCls("x-infopanel");

        this.afterHideAnimate = Ext.Function.bind(this.afterHideAnimate, this);

        if (!this.alignmentEl && this.initialConfig.floating !== false && this.isFloatingInfo) {
            if (!this.queue) {
                this.queue = Ext.net.InfoPanelQueue.defaultQueue;
                noqueue = true;
            }

            if (Ext.isString(this.queue)) {
                this.queue = Ext.net.InfoPanelQueue.queues[this.queue];
            }

            if (noqueue && this.queue && !this.queue.container) {
                this.queue.add(this);
            }
        } else {
            delete this.queue;
            if (this.alignmentEl) {
                this.alignmentEl = Ext.get(this.alignmentEl);
            }
        }

        if ((this.alignmentEl || !this.queue || !this.queue.container) && this.initialConfig.floating !== false && this.isFloatingInfo) {
            this.floating = true;
            this.renderTo = Ext.getBody();
        }

        if (this.ui && this.ui != "default") {
            this.nui = this.ui;
            this.addCls("x-infopanel-" + this.ui);
            this.ui = "default";
        }

        if (this.floating) {
            this.addCls("x-infopanel-floating");
        }

        if (this.iconCls) {
            this.addCls("x-infopanel-icon");
        }

        this.callParent(arguments);

        if (noqueue && this.queue && this.queue.container) {
            this.queue.add(this);
        }
    },

    _getXY: function () {
        if (this._xy) {
            return this._xy;
        }

        return Ext.dom.Element.prototype.getXY.call(this);
    },

    hide: function (animate) {
        var me = this,
            config,
            hideFx = this.queue && this.queue.fx.hide;

        if (this._parentHide || animate === false) {
            delete this._parentHide;

            this.wasHidden = true;
            this.callParent(arguments);

            return this;
        }

        if (this._hiding) {
            return this;
        }

        if (hideFx && this.queue && this.queue.enableAnimations) {
            this._hiding = true;

            if (this.rendered) {
                config = {
                    duration: hideFx.duration,
                    listeners: {
                        afteranimate: this.afterHideAnimate
                    }
                };

                if (hideFx.easing) {
                    config.easing = hideFx.easing;
                }

                if (hideFx.opacity) {
                    config.to = {
                        opacity: 0
                    };
                }

                this.el.animate(config);
            }
        } else {
            if (this.alignmentEl) {
                this.animateHide();

                return;
            }

            if (this._destroyAfterHide) {
                this.destroy(false);
            } else {
                this.callParent(arguments);
            }
        }

        return this;
    },

    afterHideAnimate: function () {
        var me = this;

        if (me._destroyAfterHide) {
            me.destroy(false);
        } else {
            delete me._hiding;

            me._parentHide = true;
            me.hide();
            me.el.setOpacity(1, false);
        }
    },

    destroy: function (animate) {
        if (!this.hidden && this.rendered && animate !== false) {
            this._destroyAfterHide = true;
            this.hide();
        } else {
            if (this.queue) {
                this.queue.remove(this, animate);
                delete this.queue;
            } else {
                Ext.Array.remove(Ext.net.InfoPanelQueue.noneQueue.items, this);
            }

            if (this.hideTask) {
                this.hideTask.cancel();
            }

            this.callParent(arguments);
        }
    },

    stopHiding: function () {
        if (this.header && this.showPin) {
            this.pin();
        } else {
            this.pinned = true;

            if (this.autoHide) {
                this.hideTask.cancel();
            }
        }
    },

    onRender: function () {
        this.callParent(arguments);

        this.body.addCls("x-infopanel-body-" + this.textAlign);

        if (this.bringToFront && this.floating) {
            this.toFront();
        }

        if (this.alignmentEl) {
            this.x = -10000;
        }

        if (this.autoHide) {
            this.hideTask = new Ext.util.DelayedTask(this.destroy, this);
            this.el.hover(this.onOver, this.onOut, this);
        }

        if (this.header) {
            this.header.addCls("x-infopanel-header x-panel-header-light");
        }
    },

    animateShow: function () {
        this.el.setOpacity(0, false);
        this.el.fadeIn();
    },

    animateHide: function () {
        this.el.fadeOut({
            listeners: {
                afteranimate: this.afterHideAnimate
            }
        });
    },

    restartHideTask: function () {
        if (this.hideTask) {
            this.hideTask.cancel();
            this.hideTask.delay(this.hideDelay);
            this.delayed = false;
        }
    },

    onOver: function () {
        if (!this.pinned) {
            this.hideTask.cancel();
            this.delayed = true;
        }
    },

    onOut: function () {
        if (!this.pinned) {
            this.hideTask.delay(this.hideDelay);
            this.delayed = false;
        }
    },

    pin: function (e, toolEl, owner, tool) {
        this.tools.unpin.hide();
        this.tools.pin.show();
        this.hideTask.cancel();
        this.pinned = true;
    },

    unpin: function (e, toolEl, owner, tool) {
        this.tools.pin.hide();
        this.tools.unpin.show();
        this.destroy();
        this.pinned = false;
    },

    afterLayout: function () {
        this.callParent(arguments);

        if (this.alignmentEl && !this._aligned) {
            this._aligned = true;
            var xy = this.getAlignToXY(this.alignmentEl, this.alignment || "tr-tr", [this.offsetX || 0, this.offsetY || 0]);
            this.x = xy[0];
            this.y = xy[1];
            this.setXY(xy);

            this.animateShow();
        }
    },

    afterRender: function () {
        this.callParent(arguments);

        if (this.showPin) {
            this.addTool({
                type: "unpin",
                itemId: "unpin",
                handler: this.pin,
                hidden: this.pinned,
                hideMode: "display",
                scope: this
            });

            this.addTool({
                type: "pin",
                itemId: "pin",
                handler: this.unpin,
                hidden: !this.pinned,
                hideMode: "display",
                scope: this
            });
        }

        if (this.pinEvent !== "none") {
            this.el.on(this.pinEvent, this.stopHiding, this);
            this.on(this.pinEvent, this.stopHiding, this);
        }

        if (this.autoHide && !this.delayed && !this.pinned) {
            this.hideTask.delay(this.hideDelay);
        }
    },

    setUI: function (ui) {
        if (ui == "default") {
            this.callParent(arguments);

            return;
        }

        if (this.nui) {
            this.removeCls("x-infopanel-" + this.nui);
        }

        this.nui = ui;

        if (this.nui) {
            this.addCls("x-infopanel-" + this.nui);
        }
    }
});

Ext.onReady(function() {
    Ext.MessageBox.info = Ext.net.InfoPanel.info;
});