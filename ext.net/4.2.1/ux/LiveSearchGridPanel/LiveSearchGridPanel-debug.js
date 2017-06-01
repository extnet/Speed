/**
 * A GridPanel class with live search support.
 */
Ext.define('Ext.ux.LiveSearchGridPanel', {
    extend: 'Ext.util.Observable',
    alias: 'plugin.livesearch',
    
    /**
     * @private
     * search value initialization
     */
    searchValue: null,
    
    /**
     * @private
     * The matched positions from the most recent search
     */
    matches: [],

    /**
     * @private
     * The current index matched.
     */
    currentIndex: null,
    
    /**
     * @private
     * The generated regular expression used for searching.
     */
    searchRegExp: null,
    
    /**
     * Case sensitive mode.
     */
    caseSensitive: false,
    
    /**
     * Regular expression mode.
     */
    regExpMode: false,

    hightlightOnRefresh : false,
    
    /**
     * @cfg {String} matchCls
     * The matched string css classe.
     */
    matchCls: 'x-livesearch-match',

    init : function (grid) {
        this.grid = grid;        
        this.grid.liveSearchPlugin = this;

        if (this.hightlightOnRefresh) {
            this.hightlightOnRefresh = false;
            this.toggleHightlightOnRefresh(true);
        }

        if (this.value) {
            if(this.grid.view.viewReady) {
                this.initValue();
            }
            else {
                this.grid.view.on("viewready", this.initValue, this, {single:true});
            }
        }
    },

    // detects html tag
    tagsRe: /<[^>]*>/gm,
    
    // DEL ASCII code
    tagsProtect: '\x0f',

    ampsRe: /&\w+;/gm,    
    ampsProtect: '\x10',
    
    // detects regexp reserved word
    regExpProtect: /\\|\/|\+|\\|\.|\[|\]|\{|\}|\?|\$|\*|\^|\|/gm,

    initValue : function () {
        if (this.grid.store.getCount() > 0) {
            this.search(this.value);
        }
        else {
            this.grid.store.on("load", this.initValue, this, {single:true, delay:100});
        }
    },
    
    /**
     * In normal mode it returns the value with protected regexp characters.
     * In regular expression mode it returns the raw value except if the regexp is invalid.
     * @return {String} The value to process or null if the textfield value is blank or invalid.
     * @private
     */
    getSearchValue: function() {
        var me = this,
            value = me.value;
            
        if (value === '') {
            return null;
        }
        if (!me.regExpMode) {
            value = value.replace(me.regExpProtect, function(m) {
                return '\\' + m;
            });
        } else {
            try {
                new RegExp(value);
            } catch (error) {
                me.errorMessage = error.message;
                me.fireEvent("regexperror", me, error.message);
                return null;
            }
            // this is stupid
            if (value === '^' || value === '$') {
                return null;
            }
        }

        return value;
    },
    
    /**
     * Finds all strings that matches the searched value in each grid cells.
     */
     search: function(value) {
         var me = this,
             count = 0,
             view = me.grid.view,
             cellSelector = view.cellSelector,
             innerSelector = view.innerSelector,
             columns = me.grid.visibleColumnManager.getColumns();

         me.value = value;

         if (me.fireEvent("beforesearch", me, me.value) === false) {
             return;
         }

         view.refresh();
         me.searchValue = me.getSearchValue();
         me.matches = [];
         me.currentIndex = null;

         if (me.searchValue !== null) {
             me.searchRegExp = new RegExp(me.getSearchValue(), 'g' + (me.caseSensitive ? '' : 'i'));

             me.grid.store.each(function (record, idx) {
                 var node = view.getNode(record);

                 if (node) {
                     Ext.Array.forEach(columns, function (column) {
                         var cell = Ext.fly(node).down(column.getCellInnerSelector(), true),
                             matches, ampsMatches, cellHTML,
                             seen;

                         if (cell) {
                             matches = cell.innerHTML.match(me.tagsRe);
                             ampsMatches = cell.innerHTML.match(me.ampsRe);
                             cellHTML = cell.innerHTML.replace(me.tagsRe, me.tagsProtect);
                             cellHTML = cellHTML.replace(me.ampsRe, me.ampsProtect);

                             // populate indexes array, set currentIndex, and replace wrap matched string in a span
                             cellHTML = cellHTML.replace(me.searchRegExp, function (m) {
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
                             Ext.each(matches, function (match) {
                                 cellHTML = cellHTML.replace(me.tagsProtect, match);
                             });

                             // restore protected tags
                             Ext.each(ampsMatches, function (match) {
                                 cellHTML = cellHTML.replace(me.ampsProtect, match);
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
                 me.fireEvent("search", me, me.value, count);
             }
         }

         // no results found
         if (me.currentIndex === null) {
             me.grid.getSelectionModel().deselectAll();
             me.fireEvent("search", me, me.value, 0);
         }
     },

    clearHightlight : function () {
        var me = this;

        me.value = null;
        me.grid.view.refresh();
    },
    
    /**
     * Selects the previous row containing a match.
     */   
    prev: function () {
        var me = this,
            matches = me.matches,
            len = matches.length,
            idx = me.currentIndex;

        if (len) {
            me.currentIndex = idx === 0 ? len - 1 : idx - 1;
            me.gotoCurrent();
        }
    },

    /**
     * Selects the next row containing a match.
     */    
    next: function () {
        var me = this,
            matches = me.matches,
            len = matches.length,
            idx = me.currentIndex;

        if (len) {
            me.currentIndex = idx === len - 1 ? 0 : idx + 1;
            me.gotoCurrent();
        }
    },

    /**
     * Switch to case sensitive mode.
     */    
    toggleCaseSensitive: function(value) {
        var oldCaseSensitive = this.caseSensitive;
        this.caseSensitive = Ext.isDefined(value) ? value : !this.caseSensitive;

        if (oldCaseSensitive != this.caseSensitive) {
            this.fireEvent("casesensitivechange", this, this.caseSensitive);
        }

        if (this.value) {
            this.search(this.value);
        }
    },
    
    /**
     * Switch to regular expression mode
     */
    toggleRegExpMode: function(value) {
        var oldRegExpMode = this.regExpMode;
        this.regExpMode = Ext.isDefined(value) ? value : !this.regExpMode;
        
        if (oldRegExpMode != this.regExpMode) {
            this.fireEvent("regexpmodechange", this, this.regExpMode);
        }

        if (this.value) {
            this.search(this.value);
        }
    },

    onViewRefresh : function () {
        if (this.value) {
            this.search(this.value);
        }
    },

    toggleHightlightOnRefresh : function (value) {
        if(this.hightlightOnRefresh){
            this.grid.getView().un("refresh", this.onViewRefresh, this);
        }
        
        this.hightlightOnRefresh = Ext.isDefined(value) ? value : !this.hightlightOnRefresh;

        if(this.hightlightOnRefresh){
            this.grid.getView().on("refresh", this.onViewRefresh, this);
        }
    },

    privates: {
        gotoCurrent: function () {
            var pos = this.matches[this.currentIndex];

            this.grid.getNavigationModel().setPosition(pos.record, pos.column);
            this.grid.getSelectionModel().select(pos.record);
        }
    }
});

Ext.define('Ext.ux.LiveSearchToolbar', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.livesearchtoolbar',

    searchText : "Search",
    prevText : "&lt;",
    prevTooltipText : "Find Previous Row",
    nextText : "&gt;",
    nextTooltipText : "Find Next Row",
    regExpText : "Regular expression",
    caseSensitiveText : "Case sensitive",

    hideRegExp : false,
    hideCaseSensitive : false,
    searchBuffer : 100,
    searchFieldWidth : 200,

    initComponent : function() {
        var me = this,
            searchItems = me.getSearchItems(),
            userItems   = me.items || [];

        if (me.prependButtons) {
            me.items = userItems.concat(searchItems);
        } else {
            me.items = searchItems.concat(userItems);
        }

        me.callParent();
    },

    getGrid : function () {
        if (!this.grid){
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

    afterRender: function() {
        var me = this,
            grid = this.getGrid();
        me.callParent(arguments);
        me.searchField = me.down('#searchField');
        me.regExpField = me.down('#regExpField');
        me.caseSensitiveField = me.down('#caseSensitiveField');

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
    },

    focusTextField: function (view, td, cellIndex, record, tr, rowIndex, e, eOpts) {
        if (e.getKey() === e.S) {
            e.preventDefault();
            this.textField.focus();
        }
    },

    getSearchItems: function() {
        var me = this;
        return [me.searchText,
            {
                 xtype: 'textfield',
                 itemId : "searchField",
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
            },{
                xtype: 'button',
                text: me.nextText,
                tooltip: me.nextTooltipText,
                handler: me.onNextClick,
                scope: me
            }, '-', {
                xtype: 'checkbox',
                itemId : "regExpField",
                hideLabel: true,
                margin: '0 0 0 4px',
                handler: me.regExpToggle,
                hidden : me.hideRegExp,
                submitValue: false,
                scope: me                
            }, {
                xtype : 'tbtext',
                text : me.regExpText, 
                hidden : me.hideRegExp
            }, {
                xtype: 'checkbox',
                hideLabel: true,
                margin: '0 0 0 4px',
                itemId : "caseSensitiveField",
                handler: me.caseSensitiveToggle,
                hidden: me.hideCaseSensitive,
                submitValue: false,               
                scope: me
            }, {
                xtype : 'tbtext',
                text: me.caseSensitiveText,
                hidden : me.hideCaseSensitive
            }];
    },

    onTextFieldChange: function(field) {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.search(field.getValue());
            field.focus();
        }
    },

    onPreviousClick: function() {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.prev();
        }
    },
   
    onNextClick: function() {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.next();
        }
    },    
    
    caseSensitiveToggle: function(checkbox, checked) {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.toggleCaseSensitive(checked);
        }
    },
   
    regExpToggle: function(checkbox, checked) {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.toggleRegExpMode(checked);
        }
    }
});