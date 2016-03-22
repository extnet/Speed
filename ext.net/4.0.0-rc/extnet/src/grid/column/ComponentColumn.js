Ext.define("Ext.grid.column.ComponentColumn", {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.componentcolumn',
    isColumn: true,
    showDelay: 250,
    hideDelay: 300,
    overOnly: false,
    editor: false,
    pin: false,
    autoWidthComponent: true,
    isComponentColumn: true,
    stopSelection: true,
    pinAllColumns: true,
    moveEditorOnEnter: true,
    moveEditorOnTab: true,
    hideOnUnpin: false,
    disableKeyNavigation: false,
    swallowKeyEvents: true,

    constructor: function (config) {
        var me = this;
        me.callParent(arguments);
        me.cache = [];

        me.userRenderer = me.renderer;
        me.renderer = Ext.Function.bind(me.cmpRenderer, me);
    },

    cmpRenderer: function (value, meta, record, row, col, store, view) {
        if (meta) {
            meta.tdCls = meta.tdCls || "";
            meta.tdCls += " row-cmp-cell";
        }
        else {
            var node = view.getNode(record);

            if (node) {
                node = Ext.fly(node).down("td[data-columnid=" + this.id + "]");
                if (node) {
                    node.addCls("row-cmp-cell");
                }
            }
        }

        if (this.overOnly) {
            return "<div class='row-cmp-placeholder'>" + this.emptyRenderer(value, meta, record, row, col, store, view) + "</div>";
        }

        return this.emptyRenderer(value, meta, record, row, col, store, view);
    },

    emptyRenderer: function (value, meta, record, row, col, store, view) {
        if (this.userRenderer) {
            if (typeof this.userRenderer === "string") {
                this.userRenderer = Ext.util.Format[this.userRenderer];
            }

            return this.userRenderer.call(
                this.rendererScope || this.ownerCt,
                value,
                meta,
                record,
                row,
                col,
                store,
                view
            );
        }
        else if (this.editor) {
            return value;
        } else {
            return "<div style='height:16px;width:1px;'></div>";
        }
    },

    initRenderData: function () {
        var me = this;
        me.gridRef = me.up('tablepanel');
        me.gridRef.addCls("x-grid-componentcolumn");
        me.view = me.gridRef.getView();

        if (me.overOnly) {
            me.view.on("beforerefresh", me.onBeforeRefresh, me);
            me.view.on("refresh", me.mayShowPin, me, { buffer: 10 });
            me.view.on("beforeitemupdate", me.moveComponent, me);
            me.view.on("beforeitemremove", me.moveComponent, me);
            me.view.on("itemmouseenter", me.onItemMouseEnter, me);
            me.view.on("itemmouseleave", me.onItemMouseLeave, me);
        } else {
            me.view.on("beforerefresh", me.removeComponents, me);
            me.view.on("refresh", me.insertComponents, me, { buffer: 10 });
            me.view.on("beforeitemupdate", me.removeComponent, me);
            if (!me.view.bufferedRenderer) {
                me.view.on("beforeitemremove", me.removeComponent, me);
                me.view.on("itemadd", me.itemAdded, me);
            }
            me.view.on("itemupdate", me.itemUpdated, me);
        }

        if (me.view.bufferedRenderer) {
            if (!me.overOnly) { 
                Ext.Function.interceptBefore(me.view.all, "scroll", me.beforeScroll, me);
                Ext.Function.interceptAfter(me.view.all, "scroll", Ext.Function.createBuffered(me.afterScroll, 200, me), me);
                Ext.Function.interceptAfter(me.view, "doAdd", Ext.Function.createBuffered(me.afterViewAdd, 50, me));
            }

            Ext.Function.interceptBefore(me.view.all, "clear", me.beforeAllClear, me);
        }

        if (Ext.isNumber(this.pin) && this.pin > -1) {
            if (this.gridRef.store.getCount() > 0) {
                this.showComponent(this.pin);
                this.pin = true;
            } else {
                this.gridRef.store.on("load", function () {
                    this.showComponent(this.pin);
                    this.pin = true;
                }, this, { single: true, delay: 100 });
            }
        }

        if (this.disableKeyNavigation) {
            var sm = me.gridRef.getSelectionModel();
            sm.enableKeyNav = false;

            if (sm.keyNav) {
                sm.keyNav.disable();
            }
        }

        if (me.gridRef.isTree || me.gridRef.ownerLockable && me.gridRef.ownerLockable.isTree) {
            me._cnrScope = { column: me, root: false };
            me.gridRef.on("beforeitemcollapse", me.removeNodeComponents, me._cnrScope);
            me._crScope = { column: me, root: true };
            me.gridRef.on("beforeitemmove", me.removeNodeComponents, me._crScope);
        }

        me.view.on("cellfocus", this.onFocusCell, this);

        return me.callParent(arguments);
    },

    mayShowPin: function () {
        if (this.pin && this.pinnedOnRecord && this.gridRef.store.indexOf(this.pinnedOnRecord) > -1) {
            this.showComponent(this.pinnedOnRecord, false);
            delete this.pinnedOnRecord;
        }
    },

    beforeAllClear: function (removeDom) {
        if (removeDom) {
            this.removeComponents();
        }
    },

    beforeScroll: function (newRecords, direction, removeCount) {
        var me = this,
            i,
            removeEnd,
            nc = me.view.all,
            elements = nc.elements;

        if (direction == -1) {
            for (i = (nc.endIndex - removeCount) + 1; i <= nc.endIndex; i++) {
                me.removeComponent(me.view, me.view.getRecord(elements[i]));
            }
        }
        else {
            removeEnd = nc.startIndex + removeCount;
            for (i = nc.startIndex; i < removeEnd; i++) {
                me.removeComponent(me.view, me.view.getRecord(elements[i]));
            }
        }
    },

    afterScroll: function (newRecords, direction, removeCount) {
        var me = this,
            i,
            recCount = newRecords.length;

        for (i = 0; i < recCount; i++) {
            me.insertComponentForRecord(newRecords[i]);
        }
    },

    afterViewAdd: function (records, index) {
        var me = this,
            count = records.length,
            i;

        for (i = 0; i < count; i++) {
            me.insertComponentForRecord(records[i]);
        }
    },

    onBeforeRefresh: function () {
        if (this.pin && this.overOnly && this.overComponent && this.overComponent.rendered) {
            this.pinnedOnRecord = this.overComponent.column.record;
        }
        this.hideComponent();
    },

    onFocusCell: function (record, cell, position) {
        if (this.view.headerCt.getHeaderAtIndex(position.column) == this) {
            this.focusComponent(position.row);
        }
    },

    onItemMouseLeave: function (view, record, item, index, e) {
        var me = this;

        if (this.pin) {
            return;
        }

        if (me.showDelayTask) {
            clearTimeout(me.showDelayTask);
            delete me.showDelayTask;
        }

        if (me.hideDelay) {
            if (me.hideDelayTask) {
                clearTimeout(me.hideDelayTask);
            }

            me.hideDelayTask = setTimeout(function () {
                me.hideComponent(view, record, item, index, e);
            }, me.hideDelay);
        } else {
            me.hideComponent(view, record, item, index, e);
        }
    },

    getComponent: function (rowIndex) {
        if (this.overOnly) {
            return this.overComponent;
        }

        var record = Ext.isNumber(rowIndex) ? (this.gridRef.store.getAt ? this.gridRef.store.getAt(rowIndex) : this.view.getRecord(this.view.getNode(rowIndex))) : rowIndex,
            i,
            l;

        for (i = 0, l = this.cache.length; i < l; i++) {
            if (this.cache[i].id == record.id) {
                return this.cache[i].cmp;
            }
        }

        return null;
    },

    focusComponent: function (rowIndex) {
        var cmp = this.getComponent(rowIndex);

        if (cmp && cmp.hidden !== true && cmp.focus) {
            cmp.focus();
        }
    },

    moveComponent: function (view, record, index) {
        if (Ext.isDefined(index) && this.overComponent && this.overComponent.column && this.overComponent.column.rowIndex == index) {
            this.hideComponent();
        }
    },

    hideComponent: function (view, record, item, index, e) {
        delete this.hideDelayTask;

        if (!this.overOnly) {
            return;
        }

        var hideOtherComponents = view === true,
            rowIndex = this.overComponent && this.overComponent.column ? this.overComponent.column.rowIndex : -1;

        if (this.showDelayTask) {
            clearTimeout(this.showDelayTask);
            delete this.showDelayTask;
        }

        if (this.overComponent && this.overComponent.rendered && this.overComponent.hidden !== true) {
            if (!item) {
                this.doComponentHide();
            } else {
                this.doComponentHide(item);
            }
        }

        if (hideOtherComponents && this.overComponent) {
            var columns = this.view.getHeaderCt().getGridColumns(),
                item = this.gridRef.getView().getNode(rowIndex);

            Ext.each(columns, function (column) {
                if (column != this && column.hideComponent) {
                    column.hideComponent(item);
                }
            }, this);
        }
    },

    pinOverComponent: function (preventPinAll) {
        if (!this.overOnly) {
            return;
        }

        this.pin = true;
        this.fireEvent("pin", this, this.overComponent);

        if (this.pinAllColumns && preventPinAll !== true) {
            var columns = this.view.getHeaderCt().getGridColumns();
            Ext.each(columns, function (column) {
                if (column != this && column.pinOverComponent) {
                    column.pinOverComponent(true);
                }
            }, this);
        }
    },

    unpinOverComponent: function (preventUnpinAll) {
        if (!this.overOnly) {
            return;
        }

        this.pin = false;

        if (this.hideOnUnpin) {
            this.hideComponent();
        }

        this.fireEvent("unpin", this, this.overComponent);

        if (this.pinAllColumns && preventUnpinAll !== true) {
            var columns = this.view.getHeaderCt().getGridColumns();

            Ext.each(columns, function (column) {
                if (column != this && column.unpinOverComponent) {
                    column.unpinOverComponent(true);
                }
            }, this);
        }
    },

    doComponentHide: function (item) {
        var ce = this.overComponent.getEl(),
            el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody(),
            div = item ? this.getRenderTarget(item) : null;

        this.restoreLastPlaceholder();

        if (div) {
            div.down('.row-cmp-placeholder').removeCls("x-hidden-display");
        }

        this.overComponent.hide(false);

        if (this.overComponent.column) {
            this.fireEvent("unbind", this, this.overComponent, this.overComponent.record, this.overComponent.column && this.overComponent.column.index, this.gridRef);
        }

        this.onUnbind(this.overComponent);
        if (this.overComponent._inGrid !== false) {
            el.dom.appendChild(ce.dom);
            this.overComponent._inGrid = false;
        }
    },

    onItemMouseEnter: function (view, record, item, index, e) {
        var me = this;

        if (me.hideDelayTask) {
            clearTimeout(me.hideDelayTask);
            delete me.hideDelayTask;
        }

        if (this.pin || (this.overComponent && this.overComponent.record && this.overComponent.record.id == record.id)) {
            return;
        }

        if (me.showDelay) {
            if (me.showDelayTask) {
                clearTimeout(me.showDelayTask);
            }

            me.showDelayTask = setTimeout(function () {
                me.showComponent(record, item, index, e);
            }, me.showDelay);
        } else {
            me.showComponent(record, item, index, e);
        }
    },

    restoreLastPlaceholder: function () {
        if (this.lastComponentDiv) {
            if (this.lastComponentDiv.dom) {
                try {
                    this.lastComponentDiv.down('.row-cmp-placeholder').removeCls("x-hidden-display");
                } catch (e) {
                }
            }

            delete this.lastComponentDiv;
        }
    },

    getRenderTarget: function (node) {
        var td = this.select(node)[0];
        return td ? Ext.get(td).first("div") : null;
    },

    showComponent: function (record, item, index, e) {
        delete this.showDelayTask;

        if (!this.overOnly) {
            return;
        }

        if (Ext.isNumber(record)) {
            record = this.gridRef.store.getAt ? this.gridRef.store.getAt(record) : this.view.getRecord(this.view.getNode(record));
        }

        var showOtherComponents = item === true;

        if (!Ext.isDefined(index)) {
            index = this.gridRef.store.indexOf ? this.gridRef.store.indexOf(record) : (record.parentNode ? record.parentNode.indexOf(record) : 0);
            item = this.gridRef.getView().getNode(index);
        }

        if (this.hideDelayTask) {
            clearTimeout(this.hideDelayTask);
            delete this.hideDelayTask;
        }

        if (!this.overComponent) {
            tpl = Ext.isFunction(this.component) ? this.component.call(this) : this.component;
            this.overComponents = [];
            for (var i = 0; i < tpl.length; i++) {
                var cmp,
                    evts;

                cmp = Ext.ComponentManager.create(tpl[i]);
                this.overComponents.push(cmp);
                this.initCmp(cmp);

                if (this.pinEvents) {
                    evts = Ext.Array.from(this.pinEvents);

                    Ext.each(evts, function (evt) {
                        var evtCfg = evt.split(":");
                        cmp.on(evtCfg[0], this.pinOverComponent, this, evtCfg.length > 1 ? { defer: parseInt(evtCfg[1], 10) } : {});
                    }, this);
                }

                if (this.unpinEvents) {
                    evts = Ext.Array.from(this.unpinEvents);

                    Ext.each(evts, function (evt) {
                        var evtCfg = evt.split(":");
                        cmp.on(evtCfg[0], this.unpinOverComponent, this, evtCfg.length > 1 ? { defer: parseInt(evtCfg[1], 10) } : {});
                    }, this);
                }
                this.overComponent = this.overComponents[0];
            }
        }

        if (this.overComponent) {
            if (this.overComponent.hidden !== true && this.overComponent.record) {
                this.fireEvent("unbind", this, this.overComponent, this.overComponent.record, this.overComponent.column && this.overComponent.column.index, this.gridRef);
                this.onUnbind(this.overComponent);
            }

            var e = {
                config: this.overComponents,
                record: record,
                rowIndex: index,
                grid: this.gridRef
            },
                hide = false;

            beforeBind = this.fireEvent("beforebind", this, e);
            if (beforeBind === false || e.cancel === true) {
                hide = true;
            }

            if (Ext.isArray(e.config)) {
                e.config = e.config[0];
            }

            if (this.overComponent != e.config) {
                delete this.overComponent.column;
                this.hideComponent();
            }

            this.overComponent = e.config;

            var cmp = this.overComponent,
                div = this.getRenderTarget(item);

            if (!div) {
                hide = true;
            }

            this.restoreLastPlaceholder();

            this.lastComponentDiv = div;

            if (div) {
                div.down('.row-cmp-placeholder').addCls("x-hidden-display");
                div.addCls("row-cmp-cell-ct");

                if (cmp.rendered) {
                    div.appendChild(cmp.getEl());
                } else {
                    cmp.render(div);
                }
            }
            this.overComponent._inGrid = true;
            this.overComponent.show(false);

            cmp.record = record;

            cmp.column = {
                grid: this.gridRef,
                column: this,
                rowIndex: index,
                record: record
            };

            if (hide || this.fireEvent("bind", this, cmp, record, index, this.gridRef) === false) {
                delete cmp.column;
                cmp._ignoreUnbind = true;
                this.hideComponent();
                return;
            }

            delete cmp._ignoreUnbind;
            this.onBind(cmp, record);

            if (this.overComponent.hasFocus) {
                var selectText = !!this.overComponent.getFocusEl().dom.select && this.overComponent.selectOnFocus === true;
                this.overComponent.focus(selectText, 10);
            }

            if (showOtherComponents) {
                var columns = this.view.getHeaderCt().getGridColumns();
                Ext.each(columns, function (column) {
                    if (column != this && column.showComponent) {
                        column.showComponent(record);
                    }
                }, this);
            }
        }
    },

    itemUpdated: function (record, index, node) {
        this.insertComponentForRecord(record, node);
    },

    itemAdded: function (records, index, nodes) {
        for (var i = 0, len = records.length; i < len; i++) {
            this.insertComponentForRecord(records[i], nodes && nodes[i], i === (len - 1));
        }
    },

    select: function (row) {
        var classSelector = "x-grid-cell-" + this.id + ".row-cmp-cell",
            el = row ? Ext.fly(row) : this.gridRef.getEl();
        return el.query("td." + classSelector);
    },

    insertComponentForRecord: function (record, node, refreshSize) {
        var tpl,
            cmp,
            div,
            e,
            node,
            record,
            beforeBind,
            i,
            width = 0;

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

        if (this.view.store.indexOf) {
            i = this.view.store.indexOf(record);
        }
        else if (record.parentNode) {
            i = record.parentNode.indexOf(record);
        }

        tpl = Ext.isFunction(this.component) ? this.component.call(this) : Ext.clone(this.component);

        e = {
            config: tpl,
            record: record,
            rowIndex: i,
            grid: this.gridRef
        };

        beforeBind = this.fireEvent("beforebind", this, e);
        if (beforeBind === false || e.cancel === true) {
            return;
        }

        tpl = e.config;

        if (Ext.isArray(tpl)) {
            tpl = tpl[0];
        }

        cmp = Ext.ComponentManager.create(tpl);

        this.initCmp(cmp);

        cmp.record = record;

        this.cache.push({ id: record.id, cmp: cmp });

        div.dom.innerHTML = "";
        div.addCls("row-cmp-cell-ct");

        cmp.render(div);

        cmp.column = {
            grid: this.gridRef,
            column: this,
            rowIndex: i,
            record: record
        };

        if (this.fireEvent("bind", this, cmp, record, i, this.gridRef) === false) {
            delete cmp.column;
            cmp.destroy();
            return;
        }

        this.onBind(cmp, record);

        if (!this.view._bufferedRefreshSize) {
            this.view._bufferedRefreshSize = Ext.Function.createBuffered(this.view.refreshSize, 10, this.view);
        }

        if (refreshSize !== false) {
            this.view._bufferedRefreshSize();
        }
    },

    insertComponents: function () {
        var records = this.view.getViewRange(),
            i,
            len = (records && records.length) || 0;

        for (i = 0; i < len; i++) {
            this.insertComponentForRecord(records[i], null, i === (len - 1));
        }
    },

    onBind: function (cmp, record) {
        if (this.editor && cmp.setValue && this.dataIndex) {
            this.settingValue = true;
            cmp.setValue(record.get(this.dataIndex));
            this.settingValue = false;
        }

        if (this.overOnly) {
            this.activeRecord = {
                cmp: cmp,
                record: record,
                rowIndex: cmp.column && cmp.column.rowIndex
            };
        }
    },

    onUnbind: function (cmp) {
        if (this.editor) {
            if (this.overOnly) {
                this.onSaveValue(cmp, true);
            }
        }
        delete cmp.column;
        delete cmp.record;
    },

    initCmp: function (cmp) {
        //cmp.on("resize", this.onComponentResize, this);
        this.on("resize", this.onColumnResize, { column: this, cmp: cmp });
        this.on("show", this.onColumnResize, { column: this, cmp: cmp });

        if (!Ext.isDefined(cmp.margin)) {
            cmp.margin = 1;
        }

        this.onColumnResize.call({ column: this, cmp: cmp });

        cmp.on("focus", function (cmp) {
            this.activeRecord = {
                cmp: cmp,
                record: cmp.record,
                rowIndex: cmp.column && cmp.column.rowIndex
            };
        }, this);

        cmp.on("specialkey", this.onCmpSpecialKey, cmp);

        if (this.swallowKeyEvents) {
            cmp.on("afterrender", function (cmp) {
                cmp.getEl().swallowEvent(["keyup", "keydown", "keypress"]);
            });
        }

        if (this.editor) {
            cmp.addCls(Ext.baseCSSPrefix + "small-editor");
            cmp.addCls(Ext.baseCSSPrefix + "grid-editor");

            if ((this.overOnly && this.saveOnChange) || !this.overOnly) {
                cmp.on("change", this.onSaveEvent, this);
            }
        }
    },

    onSaveEvent: function (cmp) {
        if (this.overOnly) {
            this.forceRefresh = true;
        }
        this.onSaveValue(cmp);
    },

    onSaveValue: function (cmp, deferRowRefresh) {
        if (cmp._ignoreUnbind) {
            return;
        }

        var me = this,
            value = cmp.getValue(),
            ev,
            headerCt,
            headers,
            row,
            colIndex;

        if (me.settingValue || (cmp.record.get(me.dataIndex) == value) || !cmp.isValid()) {
            if (!deferRowRefresh || !this.forceRefresh && deferRowRefresh) {
                return;
            }
        }

        headerCt = this.view.getHeaderCt();
        headers = headerCt.getGridColumns();
        colIndex = Ext.Array.indexOf(headers, this);
        row = cmp.column ? this.view.getNode(cmp.column.rowIndex) : null;

        ev = {
            grid: me.gridRef,
            cmp: cmp,
            record: cmp.record,
            field: me.dataIndex,
            value: value,
            originalValue: cmp.record.get(me.dataIndex),
            row: row,
            column: me,
            rowIdx: cmp.column ? cmp.column.rowIndex : null,
            colIdx: colIndex,
            cancel: false
        };

        if (this.fireEvent("validateedit", this, ev) === false || ev.cancel === true) {
            return;
        }

        cmp.record.beginEdit();
        cmp.record.set(me.dataIndex, cmp.getValue());
        cmp.record.endEdit(true);

        this.fireEvent("edit", this, ev);

        if (me.silentSave === false) {
            deferRowRefresh = true;
        }

        if (deferRowRefresh) {
            delete this.forceRefresh;
            me.gridRef.refreshComponents = me.gridRef.refreshComponents || {};
            var rowIndex = cmp.column && cmp.column.rowIndex;

            if (cmp.column && !me.gridRef.refreshComponents[rowIndex]) {
                me.gridRef.refreshComponents[rowIndex] = setTimeout(function () {
                    me.view.refreshNode(rowIndex);
                    delete me.gridRef.refreshComponents[rowIndex];
                }, 10);
            }
        }
    },

    focusColumn: function (e, rowIndex, cmp) {
        var headerCt = this.view.getHeaderCt(),
            headers = headerCt.getGridColumns(),
            colIndex = Ext.Array.indexOf(headers, this),
            rowCount = this.gridRef.store.getCount(),
            firstCol = 0,
            lastCol = headers.length - 1,
            found = false,
            newCmp;

        for (rowIndex; e.shiftKey ? (rowIndex >= 0) : (rowIndex < rowCount) ; e.shiftKey ? rowIndex-- : rowIndex++) {
            for (e.shiftKey ? --colIndex : ++colIndex; e.shiftKey ? (colIndex >= firstCol) : (colIndex <= lastCol) ; e.shiftKey ? colIndex-- : colIndex++) {
                if (headers[colIndex].hidden && headers[colIndex].isComponentColumn !== true) {
                    continue;
                }

                newCmp = headers[colIndex].getComponent(rowIndex);
                if (newCmp && newCmp.hidden !== true) {
                    newCmp.focus();
                    found = true;
                    break;
                }
            }

            colIndex = e.shiftKey ? lastCol + 1 : -1;

            if (found) {
                break;
            }
        }

        if (found && cmp.triggerBlur) {
            cmp.triggerBlur();
        }
    },

    onCmpSpecialKey: function (cmp, e) {
        /* 
         * NOTICE: although all references to 'column.grid' here have been changed to 'column.gridRef' in
         *         svn revision 6280, on this specific function, 'column.grid' still exists in contrast to
         *         'column.gridRef', for being initialized elsewehere. Details on gitHub issue #824
         */
        var store = cmp.column.grid.store,
            grid = cmp.column.grid,
            column = cmp.column.column;
        switch (e.getKey()) {
            case e.TAB:
                column.focusColumn(e, cmp.column.rowIndex, cmp);

                e.stopEvent();
                return false;
            case e.ENTER:
                if (column.moveEditorOnEnter === false || (cmp.getPicker && cmp.isExpanded)) {
                    return;
                }

                var pos = cmp.column.rowIndex,
                    newPos;

                if (!e.shiftKey && !e.ctrlKey) {
                    newPos = pos + 1;

                    if (newPos >= store.getCount()) {
                        newPos = -1;
                    }
                } else {
                    if (e.shiftKey) {
                        newPos = pos - 1;
                    }

                    if (e.ctrlKey) {
                        newPos = 0;
                    }
                }

                if (newPos > -1 && pos != newPos) {
                    column.focusComponent(newPos);

                    if (cmp.triggerBlur) {
                        cmp.triggerBlur();
                    }
                }

                e.stopEvent();
                return false;
        }
    },

    onColumnResize: function () {
        if (this.column.overOnly && this.cmp.hidden) {
            if (!this.cmp.resizeListen) {
                this.cmp.on("show", this.column.fitComponent, this, { single: true });
                this.cmp.resizeListen = true;
            }
        } else {
            this.column.fitComponent.call(this);
        }
    },

    fitComponent: function () {
        delete this.cmp.resizeListen;

        if (this.column.autoWidthComponent) {
            var lr;

            if (this.cmp.rendered) {
                lr = this.cmp.getEl().getMargin('lr');
            } else {
                var box = Ext.util.Format.parseBox(this.cmp.margin || 0);
                lr = box.left + box.right;
            }

            this.cmp.setWidth(this.column.getWidth() - lr);
        }
    },

    removeNodeComponents: function (node) {
        node.cascadeBy(function (n) {
            if (n != node || this.root) {
                this.column.removeComponent(this.column.view, n);
            }
        }, this);
    },

    removeComponent: function (view, record, rowIndex) {
        for (var i = 0, l = this.cache.length; i < l; i++) {
            if (this.cache[i].id == record.id) {
                try {
                    var cmp = this.cache[i].cmp;
                    this.fireEvent("unbind", this, cmp, cmp.record, cmp.column && cmp.column.index, this.gridRef);
                    this.onUnbind(cmp);

                    cmp.destroy();
                    Ext.Array.remove(this.cache, this.cache[i]);
                } catch (ex) { }

                break;
            }
        }
    },

    removeComponents: function () {
        for (var i = 0, l = this.cache.length; i < l; i++) {
            try {
                var cmp = this.cache[i].cmp;
                this.fireEvent("unbind", this, cmp, cmp.record, cmp.column && cmp.column.index, this.gridRef);
                this.onUnbind(cmp);
                cmp.destroy();
            } catch (ex) { }
        }

        this.cache = [];
    },

    processEvent: function (type, view, cell, recordIndex, cellIndex, e) {
        if ((type == "mousedown" || type == "click") && this.stopSelection) {
            return false;
        }

        return this.callParent(arguments);
    },

    destroy: function () {
        var me = this,
            view;

        if (me.rendered) {
            view = me.gridRef.getView();

            me.removeComponents();

            if (me.overComponent) {
                me.overComponent.destroy();
                delete me.overComponent;
            }

            if (me.overOnly) {
                me.view.un("beforerefresh", me.onBeforeRefresh, me);
                me.view.un("beforeitemupdate", me.moveComponent, me);
                me.view.un("beforeitemremove", me.moveComponent, me);
                me.view.un("itemmouseenter", me.onItemMouseEnter, me);
                me.view.un("itemmouseleave", me.onItemMouseLeave, me);
            } else {
                me.view.un("beforerefresh", me.removeComponents, me);
                me.view.un("refresh", me.insertComponents, me);
                me.view.un("beforeitemupdate", me.removeComponent, me);
                me.view.un("beforeitemremove", me.removeComponent, me);
                me.view.un("itemadd", me.itemAdded, me);
                me.view.un("itemupdate", me.itemUpdated, me);
            }

            if (me.gridRef.isTree || me.gridRef.ownerLockable && me.gridRef.ownerLockable.isTree) {
                me.gridRef.un("beforeitemcollapse", me.removeNodeComponents, me._cnrScope);
                me.gridRef.un("beforeitemmove", me.removeNodeComponents, me._crScope);
            }

            me.view.un("cellfocus", me.onFocusCell, me);
        }

        me.callParent(arguments);
    }
});