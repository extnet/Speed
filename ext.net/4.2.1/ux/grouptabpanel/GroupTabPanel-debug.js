/**
 * A TabPanel with grouping support.
 */
Ext.define('Ext.ux.GroupTabPanel', {
    extend: 'Ext.Container',

    alias: 'widget.grouptabpanel',

    requires:[
        'Ext.data.*',
        'Ext.tree.*',
        'Ext.layout.*'
    ],

    baseCls : Ext.baseCSSPrefix + 'grouptabpanel',
    activeGroup : 0,
    activeTab : 0,

    /**
     * @event beforetabchange
     * Fires before a tab change (activated by {@link #setActiveTab}). Return false in any listener to cancel
     * the tabchange
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newCard The card that is about to be activated
     * @param {Ext.Component} oldCard The card that is currently active
     */

    /**
     * @event tabchange
     * Fires when a new tab has been activated (activated by {@link #setActiveTab}).
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newCard The newly activated item
     * @param {Ext.Component} oldCard The previously active item
     */

    /**
     * @event beforegroupchange
     * Fires before a group change (activated by {@link #setActiveGroup}). Return false in any listener to cancel
     * the groupchange
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newGroup The root group card that is about to be activated
     * @param {Ext.Component} oldGroup The root group card that is currently active
     */

    /**
     * @event groupchange
     * Fires when a new group has been activated (activated by {@link #setActiveGroup}).
     * @param {Ext.ux.GroupTabPanel} grouptabPanel The GroupTabPanel
     * @param {Ext.Component} newGroup The newly activated root group item
     * @param {Ext.Component} oldGroup The previously active root group item
     */

    initComponent: function(config) {
        var me = this;

        Ext.apply(me, config);

        // Processes items to create the TreeStore and also set up
        // "this.cards" containing the actual card items.
        me.store = me.createTreeStore();

        me.layout = {
            type: 'hbox',
            align: 'stretch'
        };
        me.defaults = {
            border: false
        };

        me.items = [{
            xtype: 'treepanel',
            cls: 'x-tree-panel x-grouptabbar',
            width: me.tabWidth || 150,
            rootVisible: false,
            store: me.store,
            hideHeaders: true,
            animate: false,
            processEvent: Ext.emptyFn,
            border: false,
            plugins: [{
                ptype: 'grouptabrenderer'
            }],
            viewConfig: {
                overItemCls: '',
                getRowClass: me.getRowClass
            },
            columns: [{
                xtype: 'treecolumn',
                sortable: false,
                dataIndex: 'text',
                flex: 1,
                renderer: function (value, cell, node, idx1, idx2, store, tree) {
                    var cls = '';

                    if (node.parentNode && node.parentNode.parentNode === null) {
                        cls += ' x-grouptab-first';
                        if (node.previousSibling) {
                            cls += ' x-grouptab-prev';
                        }
                        if (!node.get('expanded') || node.firstChild == null) {
                            cls += ' x-grouptab-last';
                        }
                    } else if (node.nextSibling === null) {
                        cls += ' x-grouptab-last';
                    } else {
                        cls += ' x-grouptab-center';
                    }
                    if (node.data.activeTab) {
                        cls += ' x-active-tab';
                    }
                    cell.tdCls= 'x-grouptab'+ cls;

                    return value;
                }
             }]
        },{
            xtype: 'container',
            flex: 1,
            layout: 'card',
            deferredRender : me.deferredRender,            
            baseCls: Ext.baseCSSPrefix + 'grouptabcontainer',
            items: me.cards
        }];

        if(me.tabPosition == "right"){
            var tmp = me.items[0];
            me.items[0] = me.items[1];
            me.items[1] = tmp;
        }

        me.callParent(arguments); 
        me.setActiveGroup(me.activeGroup);
        me.setActiveTab(me.activeTab);               
        me.mon(me.down('treepanel').getSelectionModel(), 'select', me.onNodeSelect, me);

        if (this.hasId()) {
            this.on("render", function () {
                this.getActiveTabField().render(this.el.parent() || this.el);
                this.getActiveGroupField().render(this.el.parent() || this.el);
            }, this);
        }
    },

    getRowClass: function(node, rowIndex, rowParams, store) {
        var cls = '';
        if (node.data.activeGroup) {
           cls += ' x-active-group';
        }
        return cls;
    },

    /**
     * @private
     * Node selection listener.
     */
    onNodeSelect: function (selModel, node) {
        var me = this,
            parent;

        if (node.parentNode && node.parentNode.parentNode === null) {
            parent = node;
        } else {
            parent = node.parentNode;
        }

        if (me.setActiveGroup(parent.get('groupId')) === false || me.setActiveTab(node.get('id')) === false) {
            return false;
        }
        
        this.refreshView();        
    },

    refreshView : function () {
        var me = this,
            currentNode = me.store.getRootNode(),
            parent;

        if (!me.rendered) {
            return false;
        }

        if (!me.activeGroup) {
            return;
        }

        Ext.each(currentNode.childNodes, function(node){
            if(node.get("groupId") == me.activeGroup.id){
                parent = node;
                return false;
            }
        });
        
        while (currentNode) {
            currentNode.set('activeTab', false);
            currentNode.set('activeGroup', false);
            currentNode = currentNode.firstChild || currentNode.nextSibling || currentNode.parentNode.nextSibling;
        }

        parent.set('activeGroup', true);
        parent.eachChild(function(child) {
            child.set('activeGroup', true);
        });
        
        if(me.activeTab){
            Ext.each(parent.childNodes, function(node){
                if(node.get("id") == me.activeTab.id){
                    node.set('activeTab', true);
                    return false;
                }
            });
        }
        me.down('treepanel').getView().refresh();
    },

    /**
     * Makes the given component active (makes it the visible card in the GroupTabPanel's CardLayout)
     * @param {Ext.Component} cmp The component to make active
     */
    setActiveTab: function(cmp) {
        var me = this,
            newTab = cmp,
            index,
            oldTab;

        if(Ext.isNumber(cmp) && me.activeGroup) {            
            Ext.each(me.groups, function(group){
                if(group.id == me.activeGroup.id){
                    cmp = group.tabs[cmp];
                    return false;
                }
            });
        }

        if(Ext.isString(cmp)) {
            newTab = Ext.getCmp(cmp);
        }        

        if (newTab === me.activeTab) {
            return false;
        }

        oldTab = me.activeTab;
        if (me.fireEvent('beforetabchange', me, newTab, oldTab) !== false) {
             me.activeTab = newTab;
             if (me.rendered) {                 
                 me.down('container[baseCls=' + Ext.baseCSSPrefix + 'grouptabcontainer' + ']').getLayout().setActiveItem(newTab);                 
             }
             else{
                this.items.get(1).activeItem = newTab;
             }

             index = 0;

             Ext.each(me.groups, function(group){
                if(group.id == me.activeGroup.id){
                    Ext.each(group.tabs, function(tab, idx){
                        if(newTab.id == tab){
                            index = idx;
                        }
                    });
                    return false;
                }
             });

             this.getActiveTabField().setValue(newTab.id + ':' + index);

             me.fireEvent('tabchange', me, newTab, oldTab);
         }         

         this.refreshView();

         return true;
    },

    /**
     * Makes the given group active
     * @param {Ext.Component} cmp The root component to make active.
     */
    setActiveGroup: function(cmp, refresh) {
        var me = this,
            newGroup = cmp,
            index,
            oldGroup;

        if(Ext.isNumber(cmp)) {
            cmp = me.groups[cmp].id;
        }
        
        if(Ext.isString(cmp)) {
            newGroup = Ext.getCmp(cmp);
        }
        
        if (newGroup === me.activeGroup) {
            return true;
        }

        oldGroup = me.activeGroup;
        if (me.fireEvent('beforegroupchange', me, newGroup, oldGroup) !== false) {
             me.activeGroup = newGroup;
             index = 0;

             Ext.each(me.groups, function(group, idx){
                if(group.id == me.activeGroup.id){
                    index = idx;
                    return false;
                }
             });

             this.getActiveGroupField().setValue(newGroup.id + ':' + index);
             me.fireEvent('groupchange', me, newGroup, oldGroup);
         } else {
             return false;
         }

         if(refresh) {
            me.refreshView();
         }

         return true;
    },

    /**
     * @private
     * Creates the TreeStore used by the GroupTabBar.
     */
    createTreeStore: function() {
        var me = this,
            groups = me.prepareItems(me.items),
            data = {
                text: '.',
                children: []
            },
            cards = me.cards = [];
        me.activeGroup = me.activeGroup || 0;
        me.groups = [];
        
        Ext.each(groups, function(groupItem, idx) {
            me.groups[idx] = {id:groupItem.id, tabs:[]};

            var leafItems = groupItem.items.items,
                rootItem = (leafItems[groupItem.mainItem] || leafItems[0]),
                groupRoot = {
                    children: []
                };

            // Create the root node of the group
            groupRoot.id = rootItem.id;
            groupRoot.groupId = groupItem.id;
            groupRoot.text = rootItem.title;
            groupRoot.iconCls = rootItem.iconCls;

            groupRoot.expanded = !groupItem.collapsed;
            groupRoot.activeGroup = (me.activeGroup === idx);
            groupRoot.activeTab = groupRoot.activeGroup ? true : false;
            /*if (groupRoot.activeTab) {
                me.activeTab = groupRoot.id;
            }

            if (groupRoot.activeGroup) {
                me.mainItem = groupItem.mainItem || 0;
                me.activeGroup = groupRoot.id;
            }*/

            Ext.each(leafItems, function(leafItem) {
                // First node has been done
                me.groups[idx].tabs.push(leafItem.id);
                if (leafItem.id !== groupRoot.id) {
                    var child = {
                        id: leafItem.id,
                        groupId : groupItem.id,
                        leaf: true,
                        text: leafItem.title,
                        iconCls: leafItem.iconCls,
                        activeGroup: groupRoot.activeGroup,
                        activeTab: false
                    };
                    groupRoot.children.push(child);
                }

                // Ensure the items do not get headers
                delete leafItem.title;
                delete leafItem.iconCls;
                cards.push(leafItem);
            });

            data.children.push(groupRoot);
      });

       return Ext.create('Ext.data.TreeStore', {
            fields: ['id', 'text', 'activeGroup', 'activeTab', 'groupId'],
            root: {
                expanded: true
            },
            proxy: {
                type: 'memory',
                data: data
            }
        });
    },

    /**
     * Returns the item that is currently active inside this GroupTabPanel.
     * @return {Ext.Component/Number} The currently active item
     */
    getActiveTab: function() {
        return this.activeTab;
    },

    /**
     * Returns the root group item that is currently active inside this GroupTabPanel.
     * @return {Ext.Component/Number} The currently active root group item
     */
    getActiveGroup: function() {
        return this.activeGroup;
    },

    getActiveTabField : function () {
        if (!this.activeTabField) {
            this.activeTabField = new Ext.form.field.Hidden({ 
                name  : this.id + "_ActiveTab"
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeTabField);
        }

        return this.activeTabField;
    },

    getActiveGroupField : function () {
        if (!this.activeGroupField) {
            this.activeGroupField = new Ext.form.field.Hidden({ 
                name  : this.id + "_ActiveGroup"
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeGroupField);
        }

        return this.activeGroupField;
    }
});
/**
* Allows GroupTab to render a table structure.
*/
Ext.define('Ext.ux.GroupTabRenderer', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.grouptabrenderer',

    tableTpl: new Ext.XTemplate(
        '<div id="{view.id}-body" class="' + Ext.baseCSSPrefix + '{view.id}-table ' + Ext.baseCSSPrefix + 'grid-table-resizer" style="{tableStyle}">',
            '{%',
                'values.view.renderRows(values.rows, values.viewStartIndex, out);',
            '%}',
        '</div>',
        {
            priority: 5
        }
    ),

    rowTpl: new Ext.XTemplate(
        '{%',
            'Ext.Array.remove(values.itemClasses, "', Ext.baseCSSPrefix + 'grid-row");',
            'var dataRowCls = values.recordIndex === -1 ? "" : " ' + Ext.baseCSSPrefix + 'grid-data-row";',
        '%}',
        '<div {[values.rowId ? ("id=\\"" + values.rowId + "\\"") : ""]} ',
            'data-boundView="{view.id}" ',
            'data-recordId="{record.internalId}" ',
            'data-recordIndex="{recordIndex}" ',
            'class="' + Ext.baseCSSPrefix + 'grouptab-row {[values.itemClasses.join(" ")]} {[values.rowClasses.join(" ")]}{[dataRowCls]}" ',
            '{rowAttr:attributes}>',
            '<tpl for="columns">' +
                '{%',
                    'parent.view.renderCell(values, parent.record, parent.recordIndex, parent.rowIndex, xindex - 1, out, parent)',
                 '%}',
            '</tpl>',
        '</div>',
        {
            priority: 5
        }
    ),

    cellTpl: new Ext.XTemplate(
        '{%values.tdCls = values.tdCls.replace(" ' + Ext.baseCSSPrefix + 'grid-cell "," ");%}',
        '<div class="' + Ext.baseCSSPrefix + 'grouptab-cell {tdCls}" {tdAttr}>',
            '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner" style="text-align: {align}; {style};">{value}</div>',
            '<div class="x-grouptabs-corner x-grouptabs-corner-top-left"></div>',
            '<div class="x-grouptabs-corner x-grouptabs-corner-bottom-left"></div>',
        '</div>',
        {
            priority: 5
        }
    ),

    selectors: {
        // Outer table
        bodySelector: 'div.' + Ext.baseCSSPrefix + 'grid-table-resizer',

        // Element which contains rows
        nodeContainerSelector: 'div.' + Ext.baseCSSPrefix + 'grid-table-resizer',

        // row
        itemSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-row',

        // row which contains cells as opposed to wrapping rows
        rowSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-row',

        // cell
        cellSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-cell', 

        getCellSelector: function(header) {
            return header ? header.getCellSelector() : this.cellSelector; 
        }

    },

    init: function(grid) {
        var view = grid.getView(), 
            me = this;
        view.addTpl(me.tableTpl);
        view.addRowTpl(me.rowTpl);
        view.addCellTpl(me.cellTpl);
        Ext.apply(view, me.selectors);
    }
});