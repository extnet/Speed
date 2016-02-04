// @source core/form/Image.js

Ext.define("Ext.layout.component.Image", {
    extend: "Ext.layout.component.Auto",
    alias: ["layout.image"],
    type: 'image',

    publishInnerHeight: function (ownerContext, height) {
        var padding = this.owner.el.getPadding("tb") || 0,
            border = this.owner.el.getBorderWidth("tb") || 0;

        if (this.owner.allowPan || this.owner.resizable) {
            this.owner.el.setHeight(height);

            if (!this.owner.allowPan) {
                this.owner.imgEl.setHeight(height - padding - border);
            }
        }
        else {
            this.owner.imgEl.setHeight(height - padding - border);
        }
    },

    publishInnerWidth: function (ownerContext, width) {
        var padding = this.owner.el.getPadding("lr") || 0,
            border = this.owner.el.getBorderWidth("lr") || 0;

        if (this.owner.allowPan || this.owner.resizable) {
            this.owner.el.setWidth(width);

            if (!this.owner.allowPan) {
                this.owner.imgEl.setWidth(width - padding - border);
            }
        }
        else {
            this.owner.imgEl.setWidth(width - padding - border);
        }
    }
});

Ext.define("Ext.net.Image", {
    extend: "Ext.Component",
    alias: "widget.netimage",
    lazyLoad: false,
    monitorComplete: true,
    monitorPoll: 200,
    allowPan: false,
    componentLayout: "image",

    renderTpl: [
            '<img src="{src}" style="border:none;"',
                 '<tpl if="!Ext.isEmpty(altText)"> alt="{altText}"</tpl>',
                 '<tpl if="!Ext.isEmpty(align)"> align="{align}"</tpl>',
                 '<tpl if="!Ext.isEmpty(cls)"> class="{cls}"</tpl>',
                 '<tpl if="!Ext.isEmpty(title)"> title="{title}"</tpl>',
             '/>',
    ],

    initComponent: function () {
        Ext.net.Image.superclass.initComponent.call(this);

        this.imageProxy = new Image();

        if (this.monitorComplete) {
            if (this.loadMask) {

                this.loadMask = Ext.apply({ msg: Ext.view.AbstractView.prototype.loadingText, msgCls: "x-mask-msg" }, this.loadMask);

                this.on("beforeload", function () {
                    if (this.rendered) {
                        this.getMaskEl().mask(this.loadMask.msg, this.loadMask.msgCls);
                    } else {
                        this.loadMask.deferredMask = true;
                    }
                });

                this.on("complete", function () {
                    if (this.rendered) {
                        this.getMaskEl().unmask(this.loadMask.removeMask);
                    }
                    else {
                        this.loadMask.deferredMask = false;
                    }
                }, this);
            }

            this.checkTask = new Ext.util.DelayedTask(function () {
                if (this.imageProxy.complete) {
                    this.checkTask.cancel();
                    this.complete = true;

                    if (this.allowPan && this.rendered) {
                        if (this.xDelta || this.yDelta) {
                            this.el.dom.scrollLeft -= this.xDelta || 0;
                            this.el.dom.scrollTop -= this.yDelta || 0;
                        }
                    }

                    this.fireEvent("complete", this);
                } else {
                    this.checkTask.delay(this.monitorPoll);
                }
            }, this);

            if (!this.lazyLoad) {
                this.imageProxy.src = this.imageUrl;
                this.fireEvent("beforeload", this);
                this.checkTask.delay(this.monitorPoll);
            }
        }
    },

    getMaskEl: function () {
        return this.el;
    },

    getOriginalSize: function () {
        return {
            width: this.imageProxy.width,
            height: this.imageProxy.height
        };
    },

    beforeRender: function () {
        var me = this;

        me.callParent();

        if (this.lazyLoad) {
            this.imageProxy.src = this.imageUrl;

            if (this.monitorComplete) {
                this.fireEvent("beforeload", this);
                this.checkTask.delay(this.monitorPoll);
            }
        }

        this.renderData = {
            altText: this.altText,
            align: this.align !== "notset" ? this.align : null,
            cls: this.cls,
            src: this.imageUrl,
            title: this.title
        };

        Ext.apply(this.childEls, {
            imgEl: { selectNode: 'img' }
        });
    },

    initResizable: Ext.emptyFn,

    afterRender: function () {
        Ext.net.Image.superclass.afterRender.apply(this);

        this.imgEl.on("click", this.onClick, this);
        this.imgEl.on("dblclick", this.onDblClick, this);
        if (this.allowPan) {
            this.el.dom.style.overflow = "hidden";
            this.imgEl.on("mousedown", this.onMouseDown, this);
            this.imgEl.setStyle("cursor", "move");

            if (this.xDelta || this.yDelta) {
                this.el.dom.scrollLeft -= this.xDelta || 0;
                this.el.dom.scrollTop -= this.yDelta || 0;
            }
        }

        if (this.resizable) {
            this.resizer = Ext.create("Ext.resizer.Resizer", Ext.applyIf(this.resizable || {}, {
                target: this,
                handles: "all"
            }));

            this.resizer.on("beforeresize", function (r, e) {
                return this.fireEvent("resizerbeforeresize", this, e);
            }, this);

            this.resizer.on("resize", function (r, width, height, e) {
                if (!this.allowPan) {
                    this.imgEl.setSize(width, height);
                }

                this.fireEvent("resizerresize", this, width, height, e);
            }, this);
        }
    },

    afterComponentLayout: function () {
        this.callParent(arguments);

        if (this.loadMask && this.loadMask.deferredMask) {
            this.getMaskEl().mask(this.loadMask.msg, this.loadMask.msgCls);
            delete this.loadMask.deferredMask;
        }
    },

    onClick: function (e, t) {
        this.fireEvent("click", this, e, t);
    },

    onDblClick: function (e, t) {
        this.fireEvent("dblclick", this, e, t);
    },

    onMouseDown: function (e) {
        e.stopEvent();
        this.mouseX = e.getX();
        this.mouseY = e.getY();
        Ext.getBody().on("mousemove", this.onMouseMove, this);
        Ext.getDoc().on("mouseup", this.onMouseUp, this);
    },

    onMouseMove: function (e) {
        e.stopEvent();

        var x = e.getX(),
            y = e.getY();

        if (e.within(this.el)) {
            var xDelta = x - this.mouseX;
            var yDelta = y - this.mouseY;
            this.el.dom.scrollLeft -= xDelta;
            this.el.dom.scrollTop -= yDelta;
            this.fireEvent("pan", this, this.el.dom.scrollLeft, this.el.dom.scrollTop, xDelta, yDelta);
        }

        this.mouseX = x;
        this.mouseY = y;
    },

    onMouseUp: function (e) {
        Ext.getBody().un("mousemove", this.onMouseMove, this);
        Ext.getDoc().un("mouseup", this.onMouseUp, this);
    },

    setImageUrl: function (imageUrl) {
        this.imageUrl = imageUrl;

        if (this.rendered) {
            this.imgEl.dom.removeAttribute("width");
            this.imgEl.dom.removeAttribute("height");
            this.imgEl.dom.src = this.imageUrl;

            if (this.monitorComplete) {
                delete this.imageProxy;
                this.imageProxy = new Image();
                this.imageProxy.src = this.imageUrl;
                this.fireEvent("beforeload", this);
                this.checkTask.cancel();
                this.checkTask.delay(this.monitorPoll);
            }
        } else {
            if (!this.lazyLoad) {
                delete this.imageProxy;
                this.imageProxy = new Image();
                this.imageProxy.src = this.imageUrl;

                if (this.monitorComplete) {
                    this.fireEvent("beforeload", this);
                    this.checkTask.cancel();
                    this.checkTask.delay(this.monitorPoll);
                }
            }
        }
    },

    setAlign: function (align) {
        this.align = align;

        if (this.rendered) {
            this.imgEl.dom.setAttribute("align", this.align);
        }
    },

    setAltText: function (altText) {
        this.altText = altText;

        if (this.rendered) {
            this.imgEl.dom.setAttribute("altText", this.altText);
        }
    },

    scroll: function (x, y) {
        if (x) {
            this.el.dom.scrollLeft -= x;
        }

        if (y) {
            this.el.dom.scrollTop -= y;
        }
    },

    scrollTo: function (x, y) {
        if (x || x === 0) {
            this.el.dom.scrollLeft = x;
        }

        if (y || y === 0) {
            this.el.dom.scrollTop = y;
        }
    },

    getCurrentScroll: function () {
        return {
            x: this.el.dom.scrollLeft,
            y: this.el.dom.scrollTop
        };
    },

    privates: {
        getContentTarget: function () {
            return this.imgEl;
        }
    }
});