
Ext.define('Ext.ux.LiveSearchGridPanel', {
    extend: 'Ext.grid.Panel',
    requires: [
        'Ext.toolbar.TextItem',
        'Ext.form.field.Checkbox',
        'Ext.form.field.Text',
        'Ext.ux.statusbar.StatusBar'
    ],

    
    searchValue: null,

    
    matches: [],

    
    currentIndex: null,

    
    searchRegExp: null,

    
    caseSensitive: false,

    
    regExpMode: false,

    
    matchCls: 'x-livesearch-match',

    defaultStatusText: 'Nothing Found',

    // Component initialization override: adds the top and bottom toolbars and setup
    // headers renderer.
    initComponent: function() {
        var me = this;

        me.tbar = ['Search', {
            xtype: 'textfield',
            name: 'searchField',
            hideLabel: true,
            width: 200,
            listeners: {
                change: {
                    fn: me.onTextFieldChange,
                    scope: this,
                    buffer: 500
                }
            }
        }, {
            xtype: 'button',
            text: '&lt;',
            tooltip: 'Find Previous Row',
            handler: me.onPreviousClick,
            scope: me
        }, {
            xtype: 'button',
            text: '&gt;',
            tooltip: 'Find Next Row',
            handler: me.onNextClick,
            scope: me
        }, '-', {
            xtype: 'checkbox',
            hideLabel: true,
            margin: '0 0 0 4px',
            handler: me.regExpToggle,
            scope: me
        }, 'Regular expression', {
            xtype: 'checkbox',
            hideLabel: true,
            margin: '0 0 0 4px',
            handler: me.caseSensitiveToggle,
            scope: me
        }, 'Case sensitive'];

        me.bbar = new Ext.ux.StatusBar({
            defaultText: me.defaultStatusText,
            name: 'searchStatusBar'
        });

        me.callParent(arguments);
    },

    // afterRender override: it adds textfield and statusbar reference and start monitoring
    // keydown events in textfield input
    afterRender: function() {
        var me = this;

        me.callParent(arguments);
        me.textField = me.down('textfield[name=searchField]');
        me.statusBar = me.down('statusbar[name=searchStatusBar]');

        me.view.on('cellkeydown', me.focusTextField, me);
    },

    focusTextField: function(view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
        if (e.getKey() === e.S) {
            e.preventDefault();
            this.textField.focus();
        }
    },

    // detects html tag
    tagsRe: /<[^>]*>/gm,

    // DEL ASCII code
    tagsProtect: '\x0f',

    
    getSearchValue: function() {
        var me = this,
            value = me.textField.getValue();

        if (value === '') {
            return null;
        }

        if (!me.regExpMode) {
            value = Ext.String.escapeRegex(value);
        }
        else {
            try {
                new RegExp(value);
            }
            catch (error) {
                me.statusBar.setStatus({
                    text: error.message,
                    iconCls: 'x-status-error'
                });

                return null;
            }

            // this is stupid
            if (value === '^' || value === '$') {
                return null;
            }
        }

        return value;
    },

    
    onTextFieldChange: function() {
        var me = this,
            count = 0,
            view = me.view,
            columns = me.visibleColumnManager.getColumns();

        view.refresh();
        // reset the statusbar
        me.statusBar.setStatus({
            text: me.defaultStatusText,
            iconCls: ''
        });

        me.searchValue = me.getSearchValue();
        me.matches = [];
        me.currentIndex = null;

        if (me.searchValue !== null) {
            me.searchRegExp = new RegExp(me.getSearchValue(), 'g' + (me.caseSensitive ? '' : 'i'));

            me.store.each(function(record, idx) {
                var node = view.getNode(record);

                if (node) {
                    Ext.Array.forEach(columns, function(column) {
                        var cell = Ext.fly(node).down(column.getCellInnerSelector(), true),
                            matches, cellHTML,
                            seen;

                        if (cell) {
                            matches = cell.innerHTML.match(me.tagsRe);
                            cellHTML = cell.innerHTML.replace(me.tagsRe, me.tagsProtect);

                            // populate indexes array, set currentIndex, and replace wrap
                            // matched string in a span
                            cellHTML = cellHTML.replace(me.searchRegExp, function(m) {
                                ++count;

                                if (!seen) {
                                    me.matches.push({
                                        record: record,
                                        column: column
                                    });
                                    seen = true;
                                }

                                return '<span class="' + me.matchCls + '">' + m + '</span>';
                            }, me);
                            // restore protected tags
                            Ext.each(matches, function(match) {
                                cellHTML = cellHTML.replace(me.tagsProtect, match);
                            });
                            // update cell html
                            cell.innerHTML = cellHTML;
                        }
                    });
                }
            }, me);

            // results found
            if (count) {
                me.currentIndex = 0;
                me.gotoCurrent();
                me.statusBar.setStatus({
                    text: Ext.String.format('{0} match{1} found.', count, count === 1 ? 'es' : ''),
                    iconCls: 'x-status-valid'
                });
            }
        }

        // no results found
        if (me.currentIndex === null) {
            me.getSelectionModel().deselectAll();
            me.textField.focus();
        }
    },

    
    onPreviousClick: function() {
        var me = this,
            matches = me.matches,
            len = matches.length,
            idx = me.currentIndex;

        if (len) {
            me.currentIndex = idx === 0 ? len - 1 : idx - 1;
            me.gotoCurrent();
        }
    },

    
    onNextClick: function() {
        var me = this,
            matches = me.matches,
            len = matches.length,
            idx = me.currentIndex;

        if (len) {
            me.currentIndex = idx === len - 1 ? 0 : idx + 1;
            me.gotoCurrent();
        }
    },

    
    caseSensitiveToggle: function(checkbox, checked) {
        this.caseSensitive = checked;
        this.onTextFieldChange();
    },

    
    regExpToggle: function(checkbox, checked) {
        this.regExpMode = checked;
        this.onTextFieldChange();
    },

    privates: {
        gotoCurrent: function() {
            var pos = this.matches[this.currentIndex];

            this.getNavigationModel().setPosition(pos.record, pos.column);
            this.getSelectionModel().select(pos.record);
        }
    }
});

// @source: livesearchgridpanel/LiveSearchGridPanel-overrides.js
Ext.ClassManager.addNameAliasMappings({ 'Ext.ux.LiveSearchGridPanel': ['plugin.livesearch'] });
Ext.define('Ext.ux.LiveSearchGridPanel', {
    override: 'Ext.ux.LiveSearchGridPanel',

    requires: [
        'Ext.toolbar.TextItem',
        'Ext.form.field.Checkbox',
        'Ext.form.field.Text',
        'Ext.ux.statusbar.StatusBar'
    ],

    init: function (grid) {
        var me = this;

        me.grid = grid;
        me.grid.liveSearchPlugin = me;
        me.store = me.grid.store;
        me.view = me.grid.view;
        me.visibleColumnManager = grid.visibleColumnManager;

        if (me.hightlightOnRefresh) {
            me.hightlightOnRefresh = false;
            me.toggleHightlightOnRefresh(true);
        }

        if (me.value) {
            if (me.grid.view.viewReady) {
                me.initValue();
            }
            else {
                me.grid.view.on("viewready", me.initValue, me, { single: true });
            }
        }
    },

    next: function () {
        return this.onNextClick.apply(this, arguments);
    },

    prev: function () {
        return this.onPreviousClick.apply(this, arguments);
    }
});
// @source: livesearchgridpanel/LiveSearchToolbar-debug.js
Ext.define('Ext.ux.LiveSearchToolbar', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.livesearchtoolbar',

    searchText: "Search",
    prevText: "&lt;",
    prevTooltipText: "Find Previous Row",
    nextText: "&gt;",
    nextTooltipText: "Find Next Row",
    regExpText: "Regular expression",
    caseSensitiveText: "Case sensitive",

    hideRegExp: false,
    hideCaseSensitive: false,
    searchBuffer: 100,
    searchFieldWidth: 200,

    initComponent: function () {
        var me = this,
            searchItems = me.getSearchItems(),
            userItems = me.items || [];

        if (me.prependButtons) {
            me.items = userItems.concat(searchItems);
        } else {
            me.items = searchItems.concat(userItems);
        }

        me.callParent();
    },

    getGrid: function () {
        if (!this.grid) {
            this.grid = this.up("gridpanel");
        }

        if (Ext.isString(this.grid)) {
            var grid = Ext.getCmp(this.grid);
            if (grid) {
                this.grid = grid;
            }
        }

        return this.grid;
    },

    afterRender: function () {
        var me = this,
            grid = this.getGrid(),
            lsp = grid.liveSearchPlugin,
            retVal = me.callParent(arguments);

        me.regExpField = me.down('#regExpField');
        me.caseSensitiveField = me.down('#caseSensitiveField');

        // Wire up live search plugin component
        lsp.tbar = me;
        lsp.textField = me.searchField = me.down('#searchField');
        lsp.statusBar = lsp.bbar = grid.down('statusbar');

        if (grid) {
            if (grid.liveSearchPlugin.value) {
                me.searchField.suspendEvents();
                me.searchField.setValue(grid.liveSearchPlugin.value);
                me.searchField.resumeEvents();
            }

            grid.liveSearchPlugin.on("search", function (p, value) {
                this.searchField.suspendEvents();
                this.searchField.setValue(grid.liveSearchPlugin.value);
                this.searchField.resumeEvents();
            }, me);

            me.regExpField.suspendEvents();
            me.regExpField.setValue(grid.liveSearchPlugin.regExpMode);
            me.regExpField.resumeEvents();

            grid.liveSearchPlugin.on("regexpmodechange", function (p, value) {
                this.regExpField.suspendEvents();
                this.regExpField.setValue(grid.liveSearchPlugin.regExpMode);
                this.regExpField.resumeEvents();
            }, me);

            me.caseSensitiveField.suspendEvents();
            me.caseSensitiveField.setValue(grid.liveSearchPlugin.caseSensitive);
            me.caseSensitiveField.resumeEvents();

            grid.liveSearchPlugin.on("casesensitivechange", function (p, value) {
                this.caseSensitiveField.suspendEvents();
                this.caseSensitiveField.setValue(grid.liveSearchPlugin.caseSensitive);
                this.caseSensitiveField.resumeEvents();
            }, me);

            grid.getView().on('cellkeydown', me.focusTextField, me);
        }

        return retVal;
    },

    focusTextField: function (view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
        if (e.getKey() === e.S) {
            e.preventDefault();
            this.textField.focus();
        }
    },

    getSearchItems: function () {
        var me = this;
        return [me.searchText,
        {
            xtype: 'textfield',
            itemId: "searchField",
            submitValue: false,
            hideLabel: true,
            width: this.searchFieldWidth,
            listeners: {
                change: {
                    fn: me.onTextFieldChange,
                    scope: this,
                    buffer: this.searchBuffer
                }
            }
        }, {
            xtype: 'button',
            text: me.prevText,
            tooltip: me.prevTooltipText,
            handler: me.onPreviousClick,
            scope: me
        }, {
            xtype: 'button',
            text: me.nextText,
            tooltip: me.nextTooltipText,
            handler: me.onNextClick,
            scope: me
        }, '-', {
            xtype: 'checkbox',
            itemId: "regExpField",
            hideLabel: true,
            margin: '0 0 0 4px',
            handler: me.regExpToggle,
            hidden: me.hideRegExp,
            submitValue: false,
            scope: me
        }, {
            xtype: 'tbtext',
            text: me.regExpText,
            hidden: me.hideRegExp
        }, {
            xtype: 'checkbox',
            hideLabel: true,
            margin: '0 0 0 4px',
            itemId: "caseSensitiveField",
            handler: me.caseSensitiveToggle,
            hidden: me.hideCaseSensitive,
            submitValue: false,
            scope: me
        }, {
            xtype: 'tbtext',
            text: me.caseSensitiveText,
            hidden: me.hideCaseSensitive
        }];
    },

    onTextFieldChange: function (field) {
        var grid = this.getGrid(),
            lsp = grid.liveSearchPlugin;
        if (grid) {
            lsp.onTextFieldChange();
            field.focus();
        }
    },

    onPreviousClick: function () {
        var grid = this.getGrid(),
            lsp = grid.liveSearchPlugin;
        if (grid) {
            lsp.prev.apply(lsp, arguments);
        }
    },

    onNextClick: function () {
        var grid = this.getGrid(),
            lsp = grid.liveSearchPlugin;
        if (grid) {
            lsp.next.apply(lsp, arguments);
        }
    },

    caseSensitiveToggle: function (checkbox, checked) {
        var grid = this.getGrid(),
            lsp = grid.liveSearchPlugin;
        if (grid) {
            return lsp.caseSensitiveToggle.apply(lsp, arguments);
        }
    },

    regExpToggle: function (checkbox, checked) {
        var grid = this.getGrid(),
            lsp = grid.liveSearchPlugin;
        if (grid) {
            lsp.regExpToggle.apply(lsp, arguments);
        }
    }
});
