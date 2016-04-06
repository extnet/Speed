
// @source grid/plugin/RowExpander.js

// feature idea to enable Ajax loading and then the content
// cache would actually make sense. Should we dictate that they use
// data or support raw html as well?

/**
 * @class Ext.ux.RowExpander
 * @extends Ext.AbstractPlugin
 * Plugin (ptype = 'rowexpander') that adds the ability to have a Column in a grid which enables
 * a second row body which expands/contracts.  The expand/contract behavior is configurable to react
 * on clicking of the column, double click of the row, and/or hitting enter while a row is selected.
 *
 * @ptype rowexpander
 */
Ext.define('Ext.net.RowExpander', {
    extend: 'Ext.plugin.Abstract',
    lockableScope: 'normal',

    requires: [
        'Ext.grid.feature.RowBody'
    ],

    alias: 'plugin.netrowexpander',
    columnWidth: 24,

    mixins: {
        observable: 'Ext.util.Observable'
    },

    isRowExpander: true,
    rowBodyTpl: null,
    lockedTpl: null,

    /**
     * @cfg {Boolean} expandOnEnter
     * <tt>true</tt> to toggle active row between expanded/collapsed when the enter
     * key is pressed (defaults to <tt>false</tt>).
     */
    expandOnEnter: false,

    /**
     * @cfg {Boolean} expandOnDblClick
     * <tt>true</tt> to toggle a row between expanded/collapsed when double clicked
     * (defaults to <tt>true</tt>).
     */
    expandOnDblClick: true,

    /**
     * @cfg {Boolean} selectRowOnExpand
     * <tt>true</tt> to select a row when clicking on the expander icon
     * (defaults to <tt>false</tt>).
     */
    selectRowOnExpand: false,
    headerWidth: 24,
    bodyBefore: false,
    hiddenColumn: false,

    rowBodyTrSelector: '.' + Ext.baseCSSPrefix + 'grid-rowbody-tr',
    rowBodyHiddenCls: Ext.baseCSSPrefix + 'grid-row-body-hidden',
    rowCollapsedCls: Ext.baseCSSPrefix + 'grid-row-collapsed',
    swallowBodyEvents: false,

    addCollapsedCls: {
        fn: function (out, values, parent) {
            var me = this.rowExpander;
            if (!me.recordsExpanded[values.record.internalId]) {
                values.itemClasses.push(me.rowCollapsedCls);
            }
            this.nextTpl.applyOut(values, out, parent);
        },

        syncRowHeights: function (lockedItem, normalItem) {
            this.rowExpander.syncRowHeights(lockedItem, normalItem);
        },

        // We need a high priority to get in ahead of the outerRowTpl
        // so we can setup row data
        priority: 20000
    },

    constructor: function (config) {
        this.callParent(arguments);
        this.mixins.observable.constructor.call(this);
        this.fitCmpWidth = Ext.Function.createDelayed(this.fitCmpWidth, 1);
    },

    /**
     * @event expandbody
     * **Fired through the grid's View**
     * @param {HtmlElement} rowNode The &lt;tr> element which owns the expanded row.
     * @param {Ext.data.Model} record The record providing the data.
     * @param {HtmlElement} expandRow The &lt;tr> element containing the expanded data.
     */
    /**
     * @event collapsebody
     * **Fired through the grid's View.**
     * @param {HtmlElement} rowNode The &lt;tr> element which owns the expanded row.
     * @param {Ext.data.Model} record The record providing the data.
     * @param {HtmlElement} expandRow The &lt;tr> element containing the expanded data.
     */

    setCmp: function (grid) {
        var me = this,
            features;

        this.callParent(arguments);

        this.recordsExpanded = {};
        this.preventsExpanding = {};
        this.bodyContent = {};

        if (!this.rowBodyTpl) {
            this.rowBodyTpl = "";
        }

        if (!Ext.isEmpty(this.rowBodyTpl) && (this.loader || this.component)) {
            this.cmpBodyTpl = (this.rowBodyTpl instanceof Ext.XTemplate) ? this.rowBodyTpl : Ext.create('Ext.XTemplate', this.rowBodyTpl);
            this.rowBodyTpl = "";
        }

        this.rowBodyTpl = (this.rowBodyTpl instanceof Ext.XTemplate) ? this.rowBodyTpl : Ext.create('Ext.XTemplate', this.rowBodyTpl);
        features = me.getFeatureConfig(grid);

        if (grid.features) {
            grid.features = Ext.Array.push(features, grid.features);
        } else {
            grid.features = features;
        }

        this.componentsCache = [];
        this.outerComponentsCache = [];

        /*
         * #832: Make RowExpander SingleExpand=true behave like SingleExpand=false DOM-wise, and
         *       just call collapseAll() on row expand when SingleExpand=true.
         */
        if (this.singleExpand && this.cacheSingleExpandRows && this.component && this.component.monitorResize) {
            this.component.monitorResize = this.singleExpand;
        }
        
        this.componentCfg = this.component;
        delete this.component;
    },

    getFeatureConfig: function (grid) {
        var me = this,
            features = [],
            featuresCfg = {
                ftype: 'rowbody',
                rowExpander: me,
                bodyBefore: me.bodyBefore,
                recordsExpanded: this.recordsExpanded,
                rowBodyHiddenCls: this.rowBodyHiddenCls,
                rowCollapsedCls: this.rowCollapsedCls,
                setupRowData: this.getRowBodyFeatureData,
                setup: this.setup,
                expander: this
            };

        features.push(Ext.apply({
            lockableScope: 'normal',
            getRowBodyContents: me.getRowBodyContentsFn(me.rowBodyTpl)
        }, featuresCfg));

        // Locked side will need a copy to keep the two DOM structures symmetrical.
        // A lockedTpl config is available to create content in locked side.
        // The enableLocking flag is set early in Ext.panel.Table#initComponent if any columns are locked.
        if (grid.enableLocking) {
            features.push(Ext.apply({
                lockableScope: 'locked',
                getRowBodyContents: me.lockedTpl ? me.getRowBodyContentsFn(me.lockedTpl) : function () { return ''; }
            }, featuresCfg));
        }

        return features;
    },

    getRowBodyContentsFn: function (rowBodyTpl) {
        var me = this;
        return function (rowValues) {
            rowBodyTpl.owner = me;
            return rowBodyTpl.applyTemplate(rowValues.record.getData()) || this.rowExpander.bodyContent[rowValues.record.internalId];
        };
    },

    getExpanded: function () {
        var store = this.grid.store,
            expandedRecords = [];

        store.each(function (record, index) {
            if (this.recordsExpanded[record.internalId]) {
                expandedRecords.push(record);
            }
        }, this);

        return expandedRecords;
    },

    init: function (grid) {
        if (grid.lockable) {
            grid = grid.normalGrid;
        }

        var me = this,
            ownerLockable = grid.ownerLockable,
            lockedView;

        this.callParent(arguments);
        this.grid = grid;
        me.view = grid.getView();

        me.bindView(me.view);
        me.view.addRowTpl(me.addCollapsedCls).rowExpander = me;

        // If our client grid is the normal side of a lockable grid, we listen to its lockable owner's beforereconfigure
        // and also bind to the locked grid's view for dblclick and keydown events
        if (ownerLockable) {
            me.addExpander(ownerLockable.lockedGrid.headerCt.items.getCount() ? ownerLockable.lockedGrid : grid);

            lockedView = ownerLockable.lockedGrid.getView();

            // Bind to locked view for key and mouse events
            // Add row processor which adds collapsed class
            me.bindView(lockedView);
            lockedView.addRowTpl(me.addCollapsedCls).rowExpander = me;

            ownerLockable.mon(ownerLockable, {
                processcolumns: me.onLockableProcessColumns,
                lockcolumn: me.onColumnLock,
                unlockcolumn: me.onColumnUnlock,
                scope: me
            });

            // Process items added.
            // It may be a re-rendering by the buffered renderer of an expanded item.
            // If so, schedule a syncRowHeights call.
            me.viewListeners = view.on({
                itemadd: me.onItemAdd,
                scope: me
            });
        } else {
            me.addExpander(grid);
            grid.on('beforereconfigure', me.beforeReconfigure, me);
        }

        grid.headerCt.on("columnresize", this.updateComponentsWidth, this, { delay: 20, buffer: 20 });
        grid.headerCt.on("columnhide", this.updateComponentsWidth, this, { delay: 20, buffer: 20 });
        grid.headerCt.on("columnshow", this.updateComponentsWidth, this, { delay: 20, buffer: 20 });
    },

    onItemAdd: function(newRecords, startIndex, newItems) {
        var me = this,
            ownerLockable = me.grid.ownerLockable,
            lockableSyncRowHeights = me.lockableSyncRowHeights || (me.lockableSyncRowHeights = Ext.Function.createAnimationFrame(ownerLockable.syncRowHeights, ownerLockable)),
            len = newItems.length,
            i;

        // If any added items are expanded, we will need a syncRowHeights call on next animation frame
        for (i = 0; i < len; i++) {
            if (!Ext.fly(newItems[i]).hasCls(me.rowCollapsedCls)) {
                lockableSyncRowHeights();
                return;
            }
        }
    },

    updateComponentsWidth: function () {
        var i,
            grid = this.grid,
            body,
            len = this.componentsCache.length,
            item;

        if (this.component && this.component.record && this.recordsExpanded[this.component.record.internalId]) {
            body = Ext.get(grid.view.getNode(grid.store.getByInternalId(this.component.record.internalId))).down("div.x-grid-rowbody");
            this.component.setWidth(body.getWidth() - body.getPadding("lr") - (this.scrollOffset || 0));
        }

        if (this.componentsCache && len > 0) {
            for (i = 0; i < len; i++) {
                item = this.componentsCache[i];
                if (this.recordsExpanded[item.id]) {
                    body = Ext.get(grid.view.getNode(grid.store.getByInternalId(item.id))).down("div.x-grid-rowbody");
                    item.cmp.setWidth(body.getWidth() - body.getPadding("lr") - (this.scrollOffset || 0));
                }
            }
        }
    },

    beforeReconfigure: function (grid, store, columns, oldStore, oldColumns) {
        var me = this;

        if (me.viewListeners) {
            me.viewListeners.destroy();
        }

        if (columns) {
            me.expanderColumn = new Ext.grid.Column(me.getHeaderConfig());
            columns.unshift(me.expanderColumn);
        }

    },

    onLockableProcessColumns: function (lockable, lockedHeaders, normalHeaders) {
        this.addExpander(lockedHeaders.length ? lockable.lockedGrid : lockable.normalGrid);
    },

    addExpander: function (expanderGrid) {
        var me = this;

        me.grid = expanderGrid;
        me.expanderColumn = expanderGrid.headerCt.insert(0, me.getHeaderConfig());

        // If a CheckboxModel, it must now put its checkbox in at position one because this
        // cell always gets in at position zero, and spans 2 columns.
        expanderGrid.getSelectionModel().injectCheckbox = 1;
    },

    getRowBodyFeatureData: function (record, idx, rowValues) {
        var me = this;
        me.self.prototype.setupRowData.apply(me, arguments);

        rowValues.rowBody = me.getRowBodyContents(rowValues);
        rowValues.rowBodyCls = me.recordsExpanded[record.internalId] ? '' : me.rowBodyHiddenCls;
    },

    setup: function (rows, rowValues) {
        var me = this,
            lockable = me.grid.ownerLockable;

        me.self.prototype.setup.apply(me, arguments);

        // If we are lockable, and we are setting up the side which has the expander column, it is row spanning so we don't have to colspan it
        if (lockable && Ext.Array.indexOf(me.grid.columnManager.getColumns(), me.rowExpander.expanderColumn) !== -1) {
            rowValues.rowBodyColspan -= 1;
        }
    },

    bindView: function (view) {
        view.stopEventFn = this.stopEventFn;

        view.on("beforerefresh", function () {
            this.preventsExpanding = {};
        }, this);

        if (this.expandOnEnter) { // Means legacy behavior
            view.on('itemkeydown', this.onKeyDownLegacy, this);
        } else { // New ExtJS 6 behavior
            view.on('itemkeydown', this.onKeyDown, this);
        }

        if (this.expandOnDblClick) {
            view.on('itemdblclick', this.onDblClick, this);
        }

        view.on('itemmousedown', function (view, record, item, index, e) {
            return !e.getTarget('div.x-grid-rowbody', view.el);
        }, this);

        if (this.swallowBodyEvents) {
            view.on("itemupdate", this.swallowRow, this);
            view.on("refresh", this.swallowRow, this);
        }

        if (this.componentCfg || this.loader) {
            view.on("beforerefresh", this.mayRemoveComponents, this);
            view.on("beforeitemupdate", this.mayRemoveComponent, this);
            view.on("beforeitemremove", this.removeComponent, this);
            view.on("refresh", this.restoreComponents, this);
            view.on("itemupdate", this.restoreSingleComponent, this);
        }
    },

    moveComponent: function () {
        if (!this.componentInsideGrid) {
            return;
        }

        var ce = this.component.getEl(),
            el = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();

        ce.addCls("x-hidden");
        el.dom.appendChild(ce.dom);
        this.componentInsideGrid = false;
    },

    removeComponent: function (view, record, rowIndex) {
        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            if (this.componentsCache[i].id == record.internalId) {
                try {
                    var cmp = this.componentsCache[i].cmp;
                    cmp.destroy();
                    Ext.Array.remove(this.componentsCache, this.componentsCache[i]);
                } catch (ex) { }

                break;
            }
        }
    },

    mayRemoveComponent: function (view, record, rowIndex) {
        if (this.invalidateComponentsOnRefresh) {
            this.removeComponents(view, record, rowIndex);
            return;
        }

        var item,
            ce,
            elTo;

        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            item = this.componentsCache[i];

            if (item.id == record.internalId) {
                ce = item.cmp.getEl();
                elTo = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();
                ce.addCls("x-hidden");
                elTo.dom.appendChild(ce.dom);

                this.outerComponentsCache.push(item);
                Ext.Array.remove(this.componentsCache, item);

                break;
            }
        }
    },

    mayRemoveComponents: function () {
        if (this.invalidateComponentsOnRefresh) {
            this.removeComponents();
            return;
        }

        var cmp,
            ce,
            elTo = Ext.net.ResourceMgr.getAspForm() || Ext.getBody();

        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            cmp = this.componentsCache[i].cmp;
            ce = cmp.getEl();

            ce.addCls("x-hidden");
            elTo.dom.appendChild(ce.dom);
        }

        this.outerComponentsCache = this.componentsCache;
        this.componentsCache = [];
    },

    removeComponents: function (outer) {
        for (var i = 0, l = this.componentsCache.length; i < l; i++) {
            try {
                var cmp = this.componentsCache[i].cmp;
                cmp.destroy();
            } catch (ex) { }
        }

        this.componentsCache = [];

        if (outer && this.outerComponentsCache) {
            for (var i = 0, l = this.outerComponentsCache.length; i < l; i++) {
                try {
                    var cmp = this.outerComponentsCache[i].cmp;
                    cmp.destroy();
                } catch (ex) { }
            }

            this.outerComponentsCache = [];
        }
    },

    onRowCmpLoad: function (loader, response, options) {
        var expander = loader.paramsFnScope.expander,
            grid = expander.grid,
            target = loader.getTarget();

        grid.view.refreshSize(true);
        expander.fitCmpWidth(target);
    },

    createComponent: function (record, body) {
        var rowCmp,
            needContainer,
            scope,
            box,
            loader;

        if (this.loader) {
            needContainer = !(this.loader.renderer == "html" || this.loader.renderer == "data");
            scope = { record: record, expander: this, el: body, grid: this.grid };
            loader = Ext.isFunction(this.loader) ? this.loader.call(scope) : Ext.clone(this.loader);
            loader.paramsFnScope = scope;
            loader.success = this.onRowCmpLoad;

            rowCmp = Ext.create(needContainer ? "Ext.container.Container" : "Ext.Component", {
                loader: loader,
                layout: "anchor",
                defaults: { anchor: "100%" },
                tpl: !Ext.isEmpty(this.cmpBodyTpl) ? ((this.cmpBodyTpl instanceof Ext.XTemplate) ? this.cmpBodyTpl : Ext.create('Ext.XTemplate', this.cmpBodyTpl)) : undefined
            });
        }
        else {
            rowCmp = Ext.ComponentManager.create(Ext.isFunction(this.componentCfg) ? this.componentCfg.call({ record: record, expander: this }) : Ext.clone(this.componentCfg), "panel");
        }

        //box = Ext.util.Format.parseBox(this.componentMargin || 0);

        if (this.componentMargin) {
            rowCmp.margin = this.componentMargin;
        }

        rowCmp.ownerCt = this.grid;
        rowCmp.record = record;
        rowCmp.width = body.getWidth() - (this.scrollOffset || 0);
        rowCmp.render(body);
        rowCmp.addCls("x-row-expander-control");
        this.componentsCache.push({ id: record.internalId, cmp: rowCmp });
        return rowCmp;
    },

    restoreSingleComponent: function (record, index, node) {
        var grid = this.grid;

        if (record.isCollapsedPlaceholder) {
            return;
        }

        if (this.recordsExpanded[record.internalId]) {
            var rowNode = grid.view.getNode(record, false),
                row = Ext.get(rowNode),
                nextBd = row.down(this.rowBodyTrSelector),
                body = row.down("div.x-grid-rowbody"),
                rowCmp = this.getComponent(record, body);

            if (!rowCmp) {
                rowCmp = this.createComponent(record, body);
            }

            grid.view.refreshSize(true);
            this.fitCmpWidth(rowCmp);
        }
    },

    restoreComponents: function () {
        var grid = this.grid,
        cmps = [];

        Ext.each(grid.getView().getViewRange(), function (record, i) {
            if (record.isCollapsedPlaceholder) {
                return;
            }

            if (this.recordsExpanded[record.internalId]) {
                var rowNode = grid.view.getNode(record, false),
                    row = Ext.get(rowNode),
                    nextBd = row.down(this.rowBodyTrSelector),
                    body = row.down("div.x-grid-rowbody"),
                    rowCmp = this.getComponent(record, body);

                if (!rowCmp) {
                    rowCmp = this.createComponent(record, body);
                }

                cmps.push(rowCmp);
            }
        }, this);

        this.removeOuterOrphans();

        if (grid.view.viewReady) {
            grid.view.refreshSize(true);
        }

        Ext.each(cmps, function (cmp) {
            this.fitCmpWidth(cmp);
        }, this);
    },

    removeOuterOrphans: function () {
        if (this.outerComponentsCache && this.outerComponentsCache.length > 0) {
            var len = this.outerComponentsCache.length,
                store = this.grid.store,
                records = store.data.items,
                len2 = records.length,
                r,
                found,
                i = 0,
                item;

            while (i < len) {
                item = this.outerComponentsCache[i];
                found = false;

                for (r = 0; r < len2; r++) {
                    if (records[r].internalId == item.id) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    try {
                        item.cmp.destroy();
                    } catch (ex) { }
                    Ext.Array.remove(this.outerComponentsCache, item);
                    len--;
                }
                else {
                    i++;
                }
            }
        }
    },

    swallowRow: function () {
        var grid = this.grid;

        grid.store.each(function (record, i) {
            if (this.recordsExpanded[record.internalId]) {
                var rowNode = grid.view.getNode(record, false),
                    body = Ext.get(rowNode).down(this.rowBodyTrSelector);

                body.swallowEvent(['click', 'mousedown', 'mousemove', 'mouseup', 'dblclick'], false);
            }
        }, this);
    },

    onKeyDown: function(view, record, row, rowIdx, e) {
        var me = this,
            key = e.getKey(),
            pos = view.getNavigationModel().getPosition(),
            isCollapsed;

        if (pos) {
            row = Ext.fly(row);
            isCollapsed = row.hasCls(me.rowCollapsedCls);

            // + key on collapsed or - key on expanded
            if (((key === 107  || (key === 187 && e.shiftKey)) && isCollapsed) || ((key === 109 || key === 189) && !isCollapsed) && !this.preventsExpanding[record.internalId]) {
                me.toggleRow(rowIdx, record);
            }
        }
    },

    onKeyDownLegacy: function (view, record, row, rowIdx, e) {
        if (e.getKey() === e.ENTER) {
            var ds = view.store,
                sels = view.getSelectionModel().getSelection(),
                ln = sels.length,
                i = 0;

            for (; i < ln; i++) {
                if (!this.preventsExpanding[sels[i].internalId]) {
                    rowIdx = ds.indexOf(sels[i]);
                    this.toggleRow(rowIdx, sels[i]);
                }
            }
        }
    },

    beforeExpand: function (record, body, rowNode, rowIndex) {
        if (this.fireEvent("beforeexpand", this, record, body, rowNode, rowIndex) !== false) {
            if (this.singleExpand || this.component) {
                this.collapseAll();
            }

            return true;
        } else {
            return false;
        }
    },

    expandAll: function () {
        if (this.singleExpand || this.component) {
            return;
        }

        var i = 0,
            records = this.view.getViewRange(),
            store = this.grid.store,
            len = records.length;

        for (i; i < len; i++) {
            this.toggleRow(store.indexOf(records[i]), records[i], true);
        }
    },

    collapseAll: function () {
        var i = 0,
            records = this.view.getViewRange(),
            store = this.grid.store,
            len = records.length;

        for (i; i < len; i++) {
            this.toggleRow(store.indexOf(records[i]), records[i], false);
        }
        this.recordsExpanded = {};
        this.grid.view.rowBodyFeature.recordsExpanded = this.recordsExpanded;
    },

    collapseRow: function (row) {
        this.toggleRow(row, this.view.getRecord(this.view.getNode(row)), false);
    },

    expandRow: function (row) {
        this.toggleRow(row, this.view.getRecord(this.view.getNode(row)), true);
    },

    toggleRow: function (rowIdx, record, state) {
        if (record.isCollapsedPlaceholder) {
            return;
        }

        var me = this,
            view = this.view,
            bufferedRenderer = view.bufferedRenderer,
            scroller = view.getScrollable(),
            fireView = view,
            rowNode = this.view.getNode(record, false),
            normalRow = Ext.get(rowNode),
            lockedRow,
            nextBd = normalRow.down(this.rowBodyTrSelector),
            body = normalRow.down("div.x-grid-rowbody"),
            hasState = Ext.isDefined(state),
            wasCollapsed = normalRow.hasCls(me.rowCollapsedCls),
            addOrRemoveCls = wasCollapsed ? 'removeCls' : 'addCls',
            grid = this.grid,
            rowCmp,
            needContainer,
            // The expander column should be rowSpan="2" only when the expander is expanded
            rowSpan = wasCollapsed ? 2 : 1,
            ownerLockable = me.grid.ownerLockable,
            expanderCell;

        rowIdx = grid.store.indexOf(record);

        var cachelessRowExpander = this.singleExpand === true && this.cacheSingleExpandRows !== true;

        //Ext.suspendLayouts();
        if ((normalRow.hasCls(this.rowCollapsedCls) && !hasState) || (hasState && state === true && normalRow.hasCls(this.rowCollapsedCls))) {
            if (this.beforeExpand(record, nextBd, rowNode, rowIdx)) {
                normalRow.removeCls(this.rowCollapsedCls);
                nextBd.removeCls(this.rowBodyHiddenCls);
                this.recordsExpanded[record.internalId] = true;

                if (this.component) {
                    if (cachelessRowExpander) {
                        this.component = Ext.ComponentManager.create(Ext.isFunction(this.componentCfg) ? this.componentCfg.call({ record: record, expander: this }) : this.componentCfg, "panel");
                        this.recreateComponent = false; // ensure we're not going to try to recreate the component afterwards
                    }

                    if (this.recreateComponent) {
                        this.component.destroy();
                        this.component = Ext.ComponentManager.create(Ext.isFunction(this.componentCfg) ? this.componentCfg.call({ record: record, expander: this }) : this.componentCfg, "panel");
                    }

                    if (this.component.rendered) {
                        body.appendChild(this.component.getEl());
                        this.component.show();
                        this.component.setWidth(body.getWidth() - (this.scrollOffset || 0));
                    } else {
                        this.component.width = body.getWidth() - (this.scrollOffset || 0);
                        this.component.render(body);
                    }

                    this.component.addCls("x-row-expander-control");
                    this.component.removeCls("x-hidden");

                    this.componentInsideGrid = true;
                    rowCmp = this.component;
                }
                else if (this.componentCfg || this.loader) {
                    // #836: If the RowExpander is not cached, don't try to find any component associated to the row.
                    if (cachelessRowExpander) {
                        rowCmp = null;
                    } else {
                        rowCmp = this.getComponent(record, body);
                    }

                    if (!rowCmp) {
                        rowCmp = this.createComponent(record, body);
                    } else {
                        rowCmp.show();
                    }
                }

                if (this.swallowBodyEvents) {
                    this.swallowRow();
                }

                if (rowCmp) {
                    rowCmp.record = record;
                    this.fitCmpWidth(rowCmp);
                }

                this.fireEvent('expand', this, record, nextBd, rowNode, rowIdx);
            }
        } else if ((!normalRow.hasCls(this.rowCollapsedCls) && !hasState) || (hasState && state === false && !normalRow.hasCls(this.rowCollapsedCls))) {
            if (this.fireEvent("beforecollapse", this, record, nextBd, rowNode, rowIdx) !== false) {
                if (this.component && this.component.rendered) {
                    if (cachelessRowExpander) {
                        // #836: when we have SingleExpand but no CacheSingleExpandRows, destroy on hide.
                        this.removeComponent(this, record, rowIdx);
                    } else {
                        this.component.hide();
                    }
                } else if (this.componentCfg || this.loader) {
                    rowCmp = this.getComponent(record, body);

                    if (rowCmp && rowCmp.rendered) {
                        if (cachelessRowExpander) {
                            // #836: when we have SingleExpand but no CacheSingleExpandRows, destroy on hide.
                            this.removeComponent(this, record, rowIdx);
                        } else {
                            rowCmp.hide();
                        }
                    }
                }

                normalRow.addCls(this.rowCollapsedCls);
                nextBd.addCls(this.rowBodyHiddenCls);
                this.recordsExpanded[record.internalId] = false;

                this.fireEvent('collapse', this, record, nextBd, rowNode, rowIdx);
            }
        }

        // Sync the collapsed/hidden classes on the locked side
        if (me.grid.ownerLockable) {

            // It's the top level grid's LockingView that does the firing when there's a lockable assembly involved.
            fireView = ownerLockable.getView();

            // Only attempt to toggle lockable side if it is visible.
            if (ownerLockable.lockedGrid.isVisible()) {

                view = ownerLockable.view.lockedGrid.view;

                // Process the locked side.
                lockedRow = Ext.fly(view.getNode(rowIdx));
                // Just because the grid is locked, doesn't mean we'll necessarily have a locked row.
                if (lockedRow) {
                    lockedRow[addOrRemoveCls](me.rowCollapsedCls);

                    // If there is a template for expander content in the locked side, toggle that side too
                    nextBd = lockedRow.down(me.rowBodyTrSelector, true);
                    Ext.fly(nextBd)[addOrRemoveCls](me.rowBodyHiddenCls);
                }
            }
        }

        // Here is where we set the rowSpan on this plugin's row expander cell.
        // It should be rowSpan="2" only when the expander row is visible.
        if (me.expanderColumn) {
            expanderCell = Ext.fly(view.getRow(rowIdx)).down(me.expanderColumn.getCellSelector(), true);
            if (expanderCell) {
                expanderCell.rowSpan = rowSpan;
            }
        }

        fireView.fireEvent(wasCollapsed ? 'expandbody' : 'collapsebody', rowNode, record, nextBd);

        // Layout needed of we are shrinkwrapping height, or there are locked/unlocked sides to sync
        // Will sync the expander row heights between locked and normal sides
        if (view.getSizeModel().height.shrinkWrap || ownerLockable) {
            view.refreshSize(true);
        }
        // If we are using the touch scroller, ensure that the scroller knows about
        // the correct scrollable range
        if (scroller) {
            if (bufferedRenderer) {
                bufferedRenderer.refreshSize();
            } else {
                scroller.refresh(true);
            }
        }    
    },

    onDblClick: function (view, record, row, rowIdx, e) {
        if (!this.preventsExpanding[record.internalId] && !e.getTarget(this.rowBodyTrSelector, view.el)) {
            this.toggleRow(rowIdx, record);
        }
    },

    renderer: Ext.emptyFn,

    // Called from TableLayout.finishedLayout
    syncRowHeights: function (lockedItem, normalItem) {
        var me = this,
            lockedBd = Ext.fly(lockedItem).down(me.rowBodyTrSelector),
            normalBd = Ext.fly(normalItem).down(me.rowBodyTrSelector),
            lockedHeight,
            normalHeight;

        // If expanded, we have to ensure expander row heights are synched
        if (normalBd.isVisible()) {

            // If heights are different, expand the smallest one
            if ((lockedHeight = lockedBd.getHeight()) !== (normalHeight = normalBd.getHeight())) {
                if (lockedHeight > normalHeight) {
                    normalBd.setHeight(lockedHeight);
                } else {
                    lockedBd.setHeight(normalHeight);
                }
            }
        }
            // When not expanded we do not control the heights
        else {
            lockedBd.dom.style.height = normalBd.dom.style.height = '';
        }
    },

    onColumnUnlock: function (lockable, column) {
        var me = this,
            lockedColumns;

        lockable = me.grid.ownerLockable;
        lockedColumns = lockable.lockedGrid.visibleColumnManager.getColumns();

        // User has unlocked all columns and left only the expander column in the locked side.
        if (lockedColumns.length === 1) {
            if (lockedColumns[0] === me.expanderColumn) {
                lockable.unlock(me.expanderColumn);
                me.grid = lockable.normalGrid;
            } else {
                lockable.lock(me.expanderColumn, 0);
            }
        }
    },

    onColumnLock: function (lockable, column) {
        var me = this,
            lockedColumns,
            lockedGrid;

        lockable = me.grid.ownerLockable;
        lockedColumns = lockable.lockedGrid.visibleColumnManager.getColumns();

        // User has unlocked all columns and left only the expander column in the locked side.
        if (lockedColumns.length === 1) {
            me.grid = lockedGrid = lockable.lockedGrid;
            lockedGrid.headerCt.insert(0, me.expanderColumn);
        }
    },

    getHeaderConfig: function () {
        var me = this,
            lockable = me.grid.ownerLockable;

        return {
            width: me.headerWidth,
            ignoreExport: true,
            isExpanderColumn: true,
            lockable: false,
            sortable: false,
            resizable: false,
            draggable: false,
            hideable: false,
            menuDisabled: true,
            hidden: this.hiddenColumn,
            tdCls: Ext.baseCSSPrefix + 'grid-cell-special',
            innerCls: Ext.baseCSSPrefix + 'grid-cell-inner-row-expander',
            preinitScope: me,
            preinitFn: function (column) {
                this.expanderColumn = column;
            },
            renderer: function (value, metadata, record) {
                var res = me.renderer.apply(this, arguments);
                if (res === false) {
                    res = "&#160;";
                    me.preventsExpanding[record.internalId] = true;
                }
                else if (res === true) {
                    res = null;
                }

                if (me.recordsExpanded[record.internalId]) {
                    metadata.tdAttr += ' rowspan="2"';
                }
                return res ? res : ('<div class="' + Ext.baseCSSPrefix + 'grid-row-expander" role="presentation"></div>');
            },
            processEvent: function (type, view, cell, rowIndex, cellIndex, e, record) {
                if ((type === "click" && e.getTarget('.' + Ext.baseCSSPrefix + 'grid-row-expander')) || (type === 'keydown' && e.getKey() === e.SPACE)) {
                    me.toggleRow(rowIndex, record);
                    return me.selectRowOnExpand;
                }
            },

            // This column always migrates to the locked side if the locked side is visible.
            // It has to report this correctly so that editors can position things correctly
            isLocked: function () {
                return lockable && (lockable.lockedGrid.isVisible() || this.locked);
            },

            // In an editor, this shows nothing.
            editRenderer: function () {
                return '&#160;';
            }
        };
    },

    isCollapsed: function (row) {
        if (typeof row === "number") {
            row = this.view.getNode(row);
        }

        return Ext.fly(row).hasCls(this.rowCollapsedCls);
    },

    isExpanded: function (row) {
        if (typeof row === "number") {
            row = this.view.getNode(row);
        }

        return !Ext.fly(row).hasCls(this.rowCollapsedCls);
    },

    getComponent: function (record, body) {
        var i, l, item, cmp;

        if (this.componentsCache) {
            for (i = 0, l = this.componentsCache.length; i < l; i++) {
                item = this.componentsCache[i];
                if (item.id == record.internalId) {
                    if (body) {
                        item.cmp.setWidth(body.getWidth() - (this.scrollOffset || 0));
                    }
                    return item.cmp;
                }
            }
        }

        if (this.outerComponentsCache) {
            for (i = 0, l = this.outerComponentsCache.length; i < l; i++) {
                if (this.outerComponentsCache[i].id == record.internalId) {
                    item = this.outerComponentsCache[i];
                    cmp = item.cmp;

                    if (body) {
                        body.appendChild(cmp.getEl());
                        cmp.removeCls("x-hidden");
                        cmp.setWidth(body.getWidth() - (this.scrollOffset || 0));
                        Ext.Array.remove(this.outerComponentsCache, item);
                        this.componentsCache.push(item);
                    }

                    return cmp;
                }
            }
        }

        return null;
    },

    destroy: function () {
        if (this.component && Ext.isFunction(this.component.destroy)) {
            this.component.destroy();
        }

        if (this.componentsCache) {
            this.removeComponents(true);
        }
    },

    fitCmpWidth: function (cmp) {
        if (cmp && cmp.record && this.recordsExpanded[cmp.record.internalId]) {
            body = Ext.get(this.grid.view.getNode(this.grid.store.getByInternalId(cmp.record.internalId))).down("div.x-grid-rowbody");
            cmp.setWidth(body.getWidth() - body.getPadding("lr") - (this.scrollOffset || 0));
        }
    }
});
