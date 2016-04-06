Ext.define("Ext.grid.column.CommandColumn", {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.commandcolumn',

    dataIndex: "",
    menuDisabled: true,
    sortable: false,
    autoWidth: false,
    hideable: false,
    isColumn: true,
    isCommandColumn: true,
    showDelay: 250,
    hideDelay: 500,
    overOnly: false,

    constructor: function (config) {
        var me = this;
        me.callParent(arguments);

        me.cache = [];
        me.commands = me.commands || [];

        me.renderer = Ext.Function.bind(me.renderer, me);
    },

    renderer: function (value, meta, record, row, col, store) {
        if (meta) {
            meta.tdCls = meta.tdCls || "";
            meta.tdCls += " row-cmd-cell";
        }
        else {
            var node = view.getNode(record);

            if (node) {
                node = Ext.fly(node).down("td[data-columnid=" + this.id + "]");
                if (node) {
                    node.addCls("row-cmd-cell");
                }
            }
        }

        if (this.overOnly) {
            return "<div class='row-cmd-placeholder'>" + this.overRenderer(value, meta, record, row, col, store) + "</div>";
        }

        return "";
    },

    overRenderer: function (value, meta, record, row, col, store) {
        if (this.placeholder) {

        } else {
            return "<div class='x-over-commands-ph'></div>";
        }
    },

    initRenderData: function () {
        var me = this;
        me.gridRef = me.up('tablepanel');
        me.gridRef.addCls("x-grid-componentcolumn");
        me.view = me.gridRef.getView();
        var groupFeature = me.getGroupingFeature(me.gridRef);

        if (me.commands) {
            if (me.overOnly) {
                me.view.on("beforerefresh", me.moveToolbar, me);
                me.view.on("beforeitemupdate", me.moveToolbar, me);
                me.view.on("beforeitemremove", me.moveToolbar, me);

                me.view.on("itemmouseenter", me.onItemMouseEnter, me);
                me.view.on("itemmouseleave", me.onItemMouseLeave, me);
            } else {
                me.shareMenus(me.commands, "initMenu");

                me.view.on("beforerefresh", me.removeToolbars, me);
                me.view.on("refresh", me.insertToolbars, me, { buffer: 10 });

                me.view.on("beforeitemupdate", me.removeToolbar, me);

                if (!me.view.bufferedRenderer) {
                    me.view.on("beforeitemremove", me.removeToolbar, me);
                    me.view.on("itemadd", me.itemAdded, me);
                }
                me.view.on("itemupdate", me.itemUpdated, me);
            }
        }

        if (me.groupCommands && groupFeature) {
            me.shareMenus(me.groupCommands, "initGroupMenu");

            if (Ext.isString(groupFeature.groupHeaderTpl)) {
                groupFeature.groupHeaderTpl = '<div class="standard-view-group">' + groupFeature.groupHeaderTpl + '</div>';
            } else if (groupFeature.groupHeaderTpl && groupFeature.groupHeaderTpl.html) {
                groupFeature.groupHeaderTpl.html = '<div class="standard-view-group">' + groupFeature.groupHeaderTpl.html + '</div>';
            }

            groupFeature.doCollapseExpand = Ext.Function.createInterceptor(groupFeature.doCollapseExpand, this.beforeCollapseExpand, this);

            if (!me.commands || me.overOnly) {
                me.view.on("beforerefresh", me.removeToolbars, this);
            }

            me.view.on("refresh", me.insertGroupToolbars, this, { buffer: 10 });
            me.view.on("groupcollapse", me.insertGroupToolbar, this);
            me.view.on("groupexpand", me.insertGroupToolbar, this);
            me.mon(me.gridRef, "resize", me.onGridResize, me);

            me.view.on('groupclick', me.groupToolbarClick);

            me.view.on("beforeitemupdate", me.groupRemoveToolbar, me);
            me.view.on("itemupdate", me.groupItemUpdated, me);
        }

        if (me.gridRef.isTree || me.gridRef.ownerLockable && me.gridRef.ownerLockable.isTree) {
            me._cnrScope = { column: me, root: false };
            me.gridRef.on("beforeitemcollapse", me.removeNodeToolbars, me._cnrScope);
            me._crScope = { column: me, root: true };
            me.gridRef.on("beforeitemmove", me.removeNodeToolbars, me._crScope);
        }

        if (me.view.bufferedRenderer && ((me.commands && !me.overOnly) || (me.groupCommands && groupFeature))) {
            Ext.Function.interceptBefore(me.view.all, "scroll", me.beforeScroll, me);
            Ext.Function.interceptAfter(me.view.all, "scroll", Ext.Function.createBuffered(me.afterScroll, 200, me), me);
            Ext.Function.interceptBefore(me.view.all, "clear", me.beforeAllClear, me);

            Ext.Function.interceptAfter(me.view, "doAdd", Ext.Function.createBuffered(me.afterViewAdd, 50, me));
        }

        return me.callParent(arguments);
    },

    beforeAllClear: function (removeDom) {
        if (this.destroyed) {
            return;
        }

        if (removeDom) {
            this.removeToolbars();
        }
    },

    beforeScroll: function (newRecords, direction, removeCount) {
        if (this.destroyed) {
            return;
        }

        var me = this,
            i,
            removeEnd,
            nc = me.view.all,
            elements = nc.elements;

        if (direction == -1) {
            for (i = (nc.endIndex - removeCount) + 1; i <= nc.endIndex; i++) {
                me.removeToolbar(me.view, me.view.getRecord(elements[i]));
            }
        }
        else {
            removeEnd = nc.startIndex + removeCount;
            for (i = nc.startIndex; i < removeEnd; i++) {
                me.removeToolbar(me.view, me.view.getRecord(elements[i]));
            }
        }

        this.removeGroupToolbars();
    },

    afterScroll: function (newRecords, direction, removeCount) {
        if (this.destroyed) {
            return;
        }

        var me = this,
            i,
            recCount = newRecords.length;

        for (i = 0; i < recCount; i++) {
            me.insertToolbarForRecord(newRecords[i]);
        }

        this.insertGroupToolbars();
    },

    afterViewAdd: function (records, index) {
        if (this.destroyed) {
            return;
        }

        var me = this,
            count = records.length,
            i;

        for (i = 0; i < count; i++) {
            me.insertToolbarForRecord(records[i]);
        }
    },

    beforeCollapseExpand: function (collapsed, groupName, focus) {
        if (this.destroyed) {
            return;
        }

        var me = this,
            groupFeature = me.getGroupingFeature(me.gridRef),
            group = groupFeature.getCache()[groupName];

        if (group.isCollapsed != collapsed) {
            this.removeGroupToolbar(groupName);
        }
    },

    groupToolbarClick: function (view, group, idx, e, options) {
        return !e.getTarget('.x-toolbar', view.el);
    },

    onGridResize: function () {
        for (var i = 0, l = this.cache.length; i < l; i++) {
            if (this.cache[i].groupId) {
                this.cache[i].updateLayout();
            }
        }
    },

    processEvent: function (type, view, cell, recordIndex, cellIndex, e) {
        var me = this,
            match = e.getTarget(".row-cmd-cell", view.el);

        if (match && (type == 'click' || type == 'mousedown') && me.stopSelection !== false) {
            return false;
        }

        return me.callParent(arguments);
    },

    onItemMouseLeave: function (view, record, item, index, e) {
        var me = this;

        if (me.showDelayTask) {
            clearTimeout(me.showDelayTask);
            delete me.showDelayTask;
        }

        if (me.hideDelay) {
            if (me.hideDelayTask) {
                clearTimeout(me.hideDelayTask);
            }

            me.hideDelayTask = setTimeout(function () {
                me.hideToolbar(view, record, item, index, e);
            }, me.hideDelay);
        } else {
            me.hideToolbar(view, record, item, index, e);
        }
    },

    moveToolbar: function () {
        this.hideToolbar();
    },

    hideToolbar: function (view, record, item, index, e) {
        delete this.hideDelayTask;

        if (this.showDelayTask) {
            clearTimeout(this.showDelayTask);
            delete this.showDelayTask;
        }
        if (this.overToolbar && this.overToolbar.rendered && this.overToolbar.hidden !== true) {
            if (!item) {
                this.doToolbarHide();
                return;
            }

            var isVisible = false,
                menu;
            this.overToolbar.items.each(function (button) {
                if (button && button.menu && button.menu.isVisible()) {
                    isVisible = true;
                    menu = button.menu;
                    return false;
                }
            });

            if (isVisible) {
                menu.on("hide", function () {
                    this.column.doToolbarHide(this.item);
                }, { column: this, item: item }, { single: true });
                return;
            }

            this.doToolbarHide(item);
        }
    },

    getRenderTarget: function (node) {
        var td = this.select(node)[0];
        return td ? Ext.get(td).first("div") : null;
    },

    doToolbarHide: function (item) {
        var ce = this.overToolbar.getEl(),
            el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody(),
            div = item ? this.getRenderTarget(item) : null;

        this.restoreLastPlaceholder();

        if (div) {
            div.down('.row-cmd-placeholder').removeCls("x-hidden-display");
        }

        this.overToolbar.addCls("x-hidden-display");
        this.overToolbar.hidden = true;

        el.dom.appendChild(ce.dom);
    },

    onItemMouseEnter: function (view, record, item, index, e) {
        var me = this;

        if (me.hideDelayTask) {
            clearTimeout(me.hideDelayTask);
            delete me.hideDelayTask;
        }

        if (me.showDelay) {
            if (me.showDelayTask) {
                clearTimeout(me.showDelayTask);
            }

            me.showDelayTask = setTimeout(function () {
                me.showToolbar(view, record, item, index, e);
            }, me.showDelay);
        } else {
            me.showToolbar(view, record, item, index, e);
        }
    },

    restoreLastPlaceholder: function () {
        if (this.lastToolbarDiv) {
            if (this.lastToolbarDiv.dom) {
                try {
                    this.lastToolbarDiv.down('.row-cmd-placeholder').removeCls("x-hidden-display");
                } catch (e) { }
            }
            delete this.lastToolbarDiv;
        }
    },

    showToolbar: function (view, record, item, index, e) {
        delete this.showDelayTask;

        if (this.hideDelayTask) {
            clearTimeout(this.hideDelayTask);
            delete this.hideDelayTask;
        }

        if (!this.overToolbar && this.commands) {
            this.overToolbar = Ext.create("Ext.toolbar.Toolbar", {
                ui: "flat",
                items: this.commands,
                enableOverflow: false,
                focusable: false,
                defaults: {
                    focusable: false
                },
                layout: {
                    pack: this.pack
                }
            });
        }

        if (this.overToolbar) {
            var toolbar = this.overToolbar,
                div = this.getRenderTarget(item);

            this.restoreLastPlaceholder();

            this.lastToolbarDiv = div;
            if (div) {
                div.down('.row-cmd-placeholder').addCls("x-hidden-display");
                div.addCls("row-cmd-cell-ct");
            }

            if (toolbar.rendered && div) {
                div.appendChild(toolbar.getEl());
            } else {
                if (div) {
                    toolbar.render(div);
                }

                toolbar.items.each(function (button) {
                    if (button.on) {
                        button.toolbar = toolbar;

                        if (button.standOut) {
                            button.on("mouseout", function () {
                                this.getEl().addCls("x-btn-over");
                            }, button);
                        }

                        if (!Ext.isEmpty(button.command, false)) {
                            button.on("click", function () {
                                var i = 0;
                                if (this.toolbar.grid.store.indexOf) {
                                    i = this.toolbar.grid.store.indexOf(this.toolbar.record);
                                }
                                else if (this.toolbar.record.parentNode) {
                                    i = this.toolbar.record.parentNode.indexOf(this.toolbar.record);
                                }
                                this.toolbar.column.fireEvent("command", toolbar.column, this.command, this.toolbar.record, i);
                            }, button);
                        }

                        if (button.menu && !button.menu.shared) {
                            this.initMenu(button.menu, toolbar);
                        }
                    }
                }, this);
            }

            this.overToolbar.removeCls("x-hidden-display");
            this.overToolbar.hidden = false;

            toolbar.record = record;

            toolbar.items.each(function (button) {
                if (button && button.menu && button.menu.isVisible()) {
                    button.menu.hide();
                }
            });

            if ((this.prepareToolbar && this.prepareToolbar(this.gridRef, toolbar, index, record) === false) || !div) {
                this.hideToolbar();
                return;
            }

            toolbar.grid = this.gridRef;
            toolbar.column = this;
            toolbar.rowIndex = index;
            toolbar.record = record;
        }
    },

    getGroupingFeature: function (grid) {
        return grid.groupingFeature;
    },

    itemUpdated: function (record, index, node) {
        this.insertToolbarForRecord(record, node);
    },

    itemAdded: function (records, index, nodes) {
        for (var i = 0, len = records.length; i < len; i++) {
            this.insertToolbarForRecord(records[i], nodes && nodes[i], i === (len - 1));
        }
    },

    select: function (row) {
        var classSelector = "x-grid-cell-" + this.id + ".row-cmd-cell",
            el = row ? Ext.fly(row) : this.gridRef.getEl();
        return el.query("td." + classSelector);
    },

    shareMenus: function (items, initMenu) {
        Ext.each(items, function (item) {
            if (item.menu) {
                if (item.menu.shared) {
                    item.menu.autoDestroy = false;
                    //item.autoDestroy = false;
                    item.destroyMenu = false;

                    item.onMenuShow = Ext.emptyFn;

                    item.showMenu = function (fromEvent) {
                        var me = this,
                            menu = me.menu;
                        if (this.rendered && this.menu) {
                            if (this.tooltip && Ext.quickTipsActive && me.getTipAttr() != 'title') {
                                Ext.tip.QuickTipManager.getQuickTip().cancelShow(me.el);
                            }

                            if (menu.isVisible()) {
                                menu.hide();
                            }

                            if (!fromEvent || me.showEmptyMenu || menu.items.getCount() > 0) {
                                menu.showBy(me.el, me.menuAlign);
                            }

                            this.menu.ownerCt = this;
                            this.ignoreNextClick = 0;
                            this.addCls(this._menuActiveCls);
                            this.fireEvent('menushow', this, this.menu);
                        }
                        return this;
                    };

                    item.menu = Ext.ComponentMgr.create(item.menu, "menu");
                    this.sharedMenus = this.sharedMenus || [];
                    this.sharedMenus.push(item.menu);
                    this[initMenu](item.menu, null, true);
                } else {
                    this.shareMenus(item.menu.items || []);
                }
            }
        }, this);
    },

    insertGroupToolbar: function (view, div) {
        var toolbar;

        if (this.groupCommands) {
            if (!div) {
                return;
            }

            div = Ext.get(div);

            var groupId = div.getAttribute("data-groupname"),
                i = 0;

            this.removeGroupToolbar(groupId);

            toolbar = new Ext.toolbar.Toolbar({
                items: this.groupCommands,
                ui: "flat",
                enableOverflow: false
            });

            this.cache.push(toolbar);

            if (div.dom.className.indexOf("row-cmd-cell-group-ct") < 0) {
                div.dom.className += " row-cmd-cell-group-ct";
            }
            //div.addCls("row-cmd-cell-group-ct");
            toolbar.render(div);

            var records = this.getRecords(groupId);

            if (this.prepareGroupToolbar && this.prepareGroupToolbar(this.gridRef, toolbar, groupId, records) === false) {
                toolbar.destroy();
                return;
            }

            toolbar.grid = this.gridRef;
            toolbar.column = this;
            toolbar.groupId = groupId;

            toolbar.items.each(function (button) {
                if (button.on) {
                    button.toolbar = toolbar;
                    button.column = this;

                    if (button.standOut) {
                        button.on("mouseout", function () {
                            this.getEl().addCls("x-btn-over");
                        }, button);
                    }

                    if (!Ext.isEmpty(button.command, false)) {
                        button.on("click", function () {
                            this.toolbar.column.fireEvent("groupcommand", this.toolbar.column, this.command, this.toolbar.grid.store.getGroups().get(this.toolbar.groupId));
                        }, button);
                    }

                    if (button.menu && !button.menu.shared) {
                        this.initGroupMenu(button.menu, toolbar);
                    }
                }
            }, this);
        }
    },

    insertToolbarForRecord: function (record, node, refreshSize) {
        if (this.commands) {

            var toolbar,
                view = this.view,
                div,
                i;

            if (record.isCollapsedPlaceholder) {
                return;
            }

            if (!node) {
                node = this.view.getNode(record, true);
            }

            if (!node) {
                return;
            }

            div = Ext.fly(node).down(this.getCellSelector() + " div");

            if (!div) {
                return;
            }

            if (view.store.indexOf) {
                i = view.store.indexOf(record);
            }
            else if (record.parentNode) {
                i = record.parentNode.indexOf(record);
            }

            this.removeToolbar(view, record, i);

            toolbar = Ext.create("Ext.toolbar.Toolbar", {
                items: this.commands,
                ui: "flat",
                enableOverflow: false,
                focusable: false,
                defaults: {
                    focusable: false
                },
                layout: {
                    pack: this.pack
                }
            });

            this.cache.push(toolbar);

            div.dom.innerHTML = "";
            
            if (div.dom.className.indexOf("row-cmd-cell-ct") < 0) {
                div.dom.className += " row-cmd-cell-ct";
            }
            //div.addCls("row-cmd-cell-ct");

            toolbar.render(div);
            toolbar.record = record;

            if (this.prepareToolbar && this.prepareToolbar(this.gridRef, toolbar, i, record) === false) {
                toolbar.destroy();
                return;
            }

            toolbar.grid = this.gridRef;
            toolbar.column = this;
            toolbar.rowIndex = i;
            toolbar.record = record;

            toolbar.items.each(function (button) {
                if (button.on) {
                    button.toolbar = toolbar;

                    if (button.standOut) {
                        button.on("mouseout", function () {
                            this.getEl().addCls("x-btn-over");
                        }, button);
                    }

                    if (!Ext.isEmpty(button.command, false)) {
                        button.on("click", function () {
                            var i = 0;
                            if (this.toolbar.grid.store.indexOf) {
                                i = this.toolbar.grid.store.indexOf(this.toolbar.record);
                            }
                            else if (this.toolbar.record.parentNode) {
                                i = this.toolbar.record.parentNode.indexOf(this.toolbar.record);
                            }
                            this.toolbar.column.fireEvent("command", toolbar.column, this.command, this.toolbar.record, i);
                        }, button);
                    }

                    if (button.menu && !button.menu.shared) {
                        this.initMenu(button.menu, toolbar);
                    }
                }
            }, this);

            if (!this.view._bufferedRefreshSize) {
                this.view._bufferedRefreshSize = Ext.Function.createBuffered(this.view.refreshSize, 10, this.view);
            }

            if (refreshSize !== false) {
                this.view._bufferedRefreshSize(true);
            }
        }
    },

    insertToolbars: function () {
        var records = this.view.getViewRange(),
            i,
            len = (records && records.length) || 0;

        for (i = 0; i < len; i++) {
            this.insertToolbarForRecord(records[i], null, i === (len - 1));
        }
    },

    initMenu: function (menu, toolbar, shared) {
        menu.items.each(function (item) {
            if (item.on) {
                item.toolbar = toolbar;

                if (shared) {
                    item.on("click", function () {
                        var pm = this.parentMenu;

                        while (pm && !pm.shared) {
                            pm = pm.parentMenu;
                        }

                        if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                            var toolbar = pm.ownerCt.toolbar,
                                i = 0;

                            if (this.toolbar.grid.store.indexOf) {
                                i = this.toolbar.grid.store.indexOf(this.toolbar.record);
                            }
                            else if (this.toolbar.record.parentNode) {
                                i = this.toolbar.record.parentNode.indexOf(this.toolbar.record);
                            }

                            toolbar.column.fireEvent("command", toolbar.column, this.command, toolbar.record, i);
                        }
                    }, item);

                    item.getRecord = function () {
                        var pm = this.parentMenu;

                        while (pm && !pm.shared) {
                            pm = pm.parentMenu;
                        }

                        if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                            var toolbar = pm.ownerCt.toolbar;
                            return toolbar.record;
                        }
                    };
                } else {
                    if (!Ext.isEmpty(item.command, false)) {
                        item.on("click", function () {
                            this.toolbar.column.fireEvent("command", this.toolbar.column, this.command, this.toolbar.record, this.toolbar.rowIndex);
                        }, item);

                        item.getRecord = function () {
                            return this.toolbar.record;
                        };
                    }
                }

                if (item.menu) {
                    this.initMenu(item.menu, toolbar, shared);
                }
            }
        }, this);
    },

    removeNodeToolbars: function (node) {
        node.cascadeBy(function (n) {
            if (n != node || this.root) {
                this.column.removeToolbar(this.column.view, n);
            }
        }, this);
    },

    removeToolbar: function (view, record, rowIndex) {
        for (var i = 0, l = this.cache.length; i < l; i++) {
            if (this.cache[i].record && (this.cache[i].record.id == record.id)) {
                try {
                    this.cache[i].destroy();
                    Ext.Array.remove(this.cache, this.cache[i]);
                } catch (ex) { }

                break;
            }
        }
    },

    removeGroupToolbar: function (groupId) {
        for (var i = 0, l = this.cache.length; i < l; i++) {
            if (this.cache[i].groupId == groupId) {
                try {
                    this.cache[i].destroy();
                    Ext.Array.remove(this.cache, this.cache[i]);
                } catch (ex) { }

                break;
            }
        }
    },

    removeGroupToolbars: function () {
        for (var i = this.cache.length - 1; i >= 0; i--) {
            if (this.cache[i].groupId) {
                try {
                    this.cache[i].destroy();
                    Ext.Array.remove(this.cache, this.cache[i]);
                } catch (ex) { }
            }
        }
    },

    removeToolbars: function () {
        for (var i = 0, l = this.cache.length; i < l; i++) {
            try {
                this.cache[i].destroy();
            } catch (ex) { }
        }

        this.cache = [];
    },

    selectGroups: function () {
        return this.gridRef.getEl().query("div.x-grid-group-hd");
    },

    insertGroupToolbars: function () {
        var groupCmd = this.selectGroups(),
            i;

        if (this.groupCommands) {
            for (i = 0; i < groupCmd.length; i++) {
                this.insertGroupToolbar(this.view, Ext.get(groupCmd[i]));
            }
        }
    },

    groupItemUpdated: function (record, index, node) {
        var grouper = this.gridRef.store.getGrouper(),
            groupId = grouper && grouper.getGroupString(record);

        if (groupId) {            
            this.insertGroupToolbar(this.view, Ext.get(this.gridRef.getEl().query("div.x-grid-group-hd[data-groupname='" + groupId + "']")[0]));
        }
    },

    groupRemoveToolbar: function (view, record, rowIndex) {
        var grouper = this.gridRef.store.getGrouper(),
            groupId = grouper && grouper.getGroupString(record);

        if (groupId) {
            this.removeGroupToolbar(groupId);
        }
    },

    initGroupMenu: function (menu, toolbar, shared) {
        menu.items.each(function (item) {
            if (item.on) {
                item.toolbar = toolbar;
                item.column = this;

                if (!Ext.isEmpty(item.command, false)) {
                    if (shared) {
                        item.on("click", function () {
                            var pm = this.parentMenu;

                            while (pm && !pm.shared) {
                                pm = pm.parentMenu;
                            }

                            if (pm && pm.shared && pm.ownerCt && pm.ownerCt.toolbar) {
                                var toolbar = pm.ownerCt.toolbar;
                                toolbar.column.fireEvent("groupcommand", toolbar.column, this.command, toolbar.grid.store.getGroups().get(toolbar.groupId));
                            }
                        }, item);
                    } else {
                        item.on("click", function () {
                            this.toolbar.column.fireEvent("groupcommand", toolbar.column, this.command, toolbar.grid.store.getGroups().get(toolbar.groupId));
                        }, item);
                    }
                }

                if (item.menu) {
                    this.initGroupMenu(item.menu, toolbar, shared);
                }
            }
        }, this);
    },

    getRecords: function (groupId) {
        if (groupId) {
            return this.gridRef.store.getGroups().get(groupId).items;
        }
    },

    destroy: function () {
        var me = this,
            view;

        if (me.rendered) {
            view = me.gridRef.getView();

            Ext.each(me.sharedMenus || [], function (menu) {
                if (menu) {
                    menu.destroy();
                }
            });
            delete me.shareMenus;

            me.removeToolbars();

            if (me.overToolbar) {
                me.overToolbar.destroy();
                delete me.overToolbar;
            }

            if (me.commands) {
                if (me.overOnly) {
                    me.view.un("beforerefresh", me.moveToolbar, me);
                    me.view.un("beforeitemupdate", me.moveToolbar, me);
                    me.view.un("beforeitemremove", me.moveToolbar, me);
                    me.view.un("itemmouseenter", me.onItemMouseEnter, me);
                    me.view.un("itemmouseleave", me.onItemMouseLeave, me);
                } else {
                    me.view.un("beforerefresh", me.removeToolbars, me);
                    me.view.un("refresh", me.insertToolbars, me);
                    me.view.un("beforeitemupdate", me.removeToolbar, me);
                    me.view.un("beforeitemremove", me.removeToolbar, me);
                    me.view.un("itemadd", me.itemAdded, me);
                    me.view.un("itemupdate", me.itemUpdated, me);
                }
            }

            if (me.groupCommands) {
                me.view.un("beforerefresh", me.removeToolbars, me);
                me.view.un("refresh", me.insertGroupToolbars, me);
                me.mun(me.gridRef, "resize", me.onGridResize, me);
                me.view.un('groupclick', me.groupToolbarClick);
                me.view.un("groupexpand", me.insertGroupToolbar, me);
                me.view.un("groupexpand", me.insertGroupToolbar, me);
            }

            if (me.gridRef.isTree || me.gridRef.ownerLockable && me.gridRef.ownerLockable.isTree) {
                me.gridRef.un("beforeitemcollapse", me.removeNodeToolbars, me._cnrScope);
                me.gridRef.un("beforeitemmove", me.removeNodeToolbars, me._crScope);
            }
        }

        this.callParent(arguments);
    }
});