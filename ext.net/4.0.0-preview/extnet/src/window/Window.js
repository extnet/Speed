
// @source core/Window.js
Ext.window.Window.override({
    closeAction: "hide",
    defaultRenderTo: "body",
    initialAlphaNum: /^[a-z0-9]/i,

    onAdded: function () {
        this.callParent(arguments);

        if (this.initialConfig && this.initialConfig.hidden === false && this.ownerCt) {
            if (this.ownerCt.rendered) {
                this.show();
            } else {
                this.ownerCt.on("afterlayout", function () {
                    this.show();
                }, this, { single: true, delay: 10 });
            }
        }
    },

    privates: {

        initContainer: function (container) {
            var me = this;

            if (!container && me.el) {
                container = me.el.dom.parentNode;
                me.allowDomMove = false;
            }

            me.container = container.dom ? container : Ext.get(container);

            if (this.container.dom == (Ext.net.ResourceMgr.getAspForm() || {}).dom) {
                me.container = Ext.getBody();
            }

            return me.container;
        },

        doAutoRender: function () {
            var me = this;

            if (!me.rendered) {
                var form = Ext.net.ResourceMgr.getAspForm(),
                    ct = ((this.defaultRenderTo === "body" || !form) ? Ext.getBody() : form);

                if (me.floating) {
                    me.render(ct);
                } else {
                    me.render(Ext.isBoolean(me.autoRender) ? ct : me.autoRender);
                }
            }
        }
    },

    render: function (container, position) {
        var me = this,
            el = me.el,
            ownerLayout = me.ownerLayout,
            vetoed, tree, nextSibling;

        if (el && !el.isElement) {
            me.el = el = me.wrapPrimaryEl(el); // ensure me.el is wrapped
        }

        Ext.suspendLayouts();

        container = container.dom ? container : Ext.get(container);
        var newcontainer = me.initContainer(container);

        if (container.dom != (Ext.net.ResourceMgr.getAspForm() || {}).dom) {
            container = newcontainer;
        }

        nextSibling = me.getInsertPosition(position);

        if (!el) {
            tree = me.getRenderTree();  // calls beforeRender

            if (ownerLayout && ownerLayout.transformItemRenderTree) {
                tree = ownerLayout.transformItemRenderTree(tree);
            }

            // tree will be null if a beforerender listener returns false
            if (tree) {
                if (nextSibling) {
                    el = Ext.DomHelper.insertBefore(nextSibling, tree);
                } else {
                    el = Ext.DomHelper.append(container, tree);
                }

                me.wrapPrimaryEl(el);
                // Just rendered a bunch of stuff so fill up the cache with those els we
                // will need.
                me.cacheRefEls(el);
            }
        } else {
            if (!me.hasListeners.beforerender || me.fireEvent('beforerender', me) !== false) {
                me.beforeRender();
                // We're simulating the above block here as much as possible, but we're already
                // given an el, so we don't need to create it. We still need to initialize the renderTpl later.
                me.needsRenderTpl = me.rendering = true;
                me._renderState = 2;

                // Set configured styles on pre-rendered Component's element
                me.initStyles(el);
                if (me.allowDomMove !== false) {
                    if (nextSibling) {
                        container.dom.insertBefore(el.dom, nextSibling);
                    } else {
                        container.dom.appendChild(el.dom);
                    }
                }
            } else {
                vetoed = true;
            }
        }

        if (el && !vetoed) {
            me.finishRender(position);
        }

        Ext.resumeLayouts(!me.hidden && !container.isDetachedBody);

        if (me.initialConfig && me.initialConfig.hidden === false) {
            me.toFront();
        }
    }
});

Ext.window.MessageBox.override({
    updateButtonText : function () {
        var me = this,
            btnId,
            btn,
            buttons = 0;

        for (btnId in me.buttonText) {
            if (me.buttonText.hasOwnProperty(btnId)) {
                btn = me.msgButtons[btnId];
                if (btn) {
                    if (me.cfg && me.cfg.buttons && Ext.isObject(me.cfg.buttons)) {
                        buttons = buttons | Math.pow(2, Ext.Array.indexOf(me.buttonIds, btnId));
                    }

                    if (btn.text != me.buttonText[btnId]) {
                        btn.setText(me.buttonText[btnId]);
                    }
                }
            }
        }

        return buttons;
    }
});