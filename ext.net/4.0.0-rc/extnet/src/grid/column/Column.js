// @source src/grid/Column/Column.js

Ext.grid.column.Column.override({
    hideTitleEl: false,

    initComponent: function () {
        var me = this;

        if (me.items) {
            this.initHeaderItems();
        }

        if (me.isCellCommand && me.commands && !me.isCommandColumn) {
            me.userRenderer = me.renderer || me.defaultRenderer;
            me.renderer = Ext.Function.bind(me.cellCommandRenderer, me);
        }

        this.callParent(arguments);

        if (!me.renderer && !me.defaultRenderer) {
            me.setPattern(me.pattern, false, true);
        }
    },

    initHeaderItems: function () {
        var me = this;

        me.cls = (me.cls || '') + ' ' + Ext.baseCSSPrefix + 'column-header';
        me.items = [{
            xtype: "container",
            flex: 1,            
            cls: 'x-grid-header-widgets x-group-sub-header',
            border: "1 0 0 0",
            layout: me.layout !== "auto" ? me.layout : "anchor",
            padding: { top: 1, left: 1, right: 1, bottom: 0 },
            defaults: { anchor: "100%" },
            items: me.items
        }];

        me.layout = Ext.apply({
            type: 'hbox'
        });

        me.hasComponentWidgets = true;
    },

    onAdded: function () {
        this.callParent(arguments);

        if (this.ownerCt.isColumn && this.hasComponentWidgets) {
            var item = this.items.first();
            if (item.rendered) {
                item.setStyle("border-top-width", "0px");
            }
            else {
                item.border = 0;
            }
        }
    },

    setPattern: function (pattern, needRefresh, initial) {
        var me = this;

        if (pattern && (initial || me.pattern !== pattern)) {
            me.pattern = pattern;

            if (me.patternTpl) {
                me.patternTpl.destroy();
            }

            me.patternTpl = new Ext.Template(me.pattern, {
                compiled: true
            });

            me.renderer = Ext.bind(function (value) {
                return this.patternTpl.apply({ value: value });
            }, me);

            if (needRefresh !== false) {
                me.ownerCt.view.refresh();
            }
        }
    },

    afterHide: function () {
        this.callParent(arguments);

        Ext.select(".x-grid-cell-" + this.id).addCls("x-hide-command");
    },

    afterShow: function () {
        this.callParent(arguments);

        Ext.select(".x-grid-cell-" + this.id).removeCls("x-hide-command");
    },

    afterRender: function () {
        this.callParent(arguments);

        if (this.hideTitleEl) {
            this.titleEl.setDisplayed(false);
        }
    },

    initRenderData: function () {
        var me = this;

        if (!me.gridRef) {
            me.gridRef = me.up('tablepanel');
        }

        return this.callParent(arguments);
    },

    cellCommandTemplate:
        '<div class="cell-imagecommands <tpl if="rightValue === true">cell-imagecommand-right-value</tpl>">' +
          '<tpl if="rightAlign === true && rightValue === false"><div class="cell-imagecommand-value">{value}</div></tpl>' +
          '<tpl for="commands">' +
             '<div cmd="{command}" class="cell-imagecommand <tpl if="parent.rightAlign === false">left-cell-imagecommand</tpl> {cls} {iconCls} {hideCls}" ' +
             'style="{style}" data-qtip="{qtext}" data-qtitle="{qtitle}">' +
                '<tpl if="text"><span data-qtip="{qtext}" data-qtitle="{qtitle}">{text}</span></tpl>' +
             '</div>' +
          '</tpl>' +
          '<tpl if="rightAlign === false || rightValue === true"><div class="cell-imagecommand-value">{value}</div></tpl>' +
        '</div>',

    getCellCommandTemplate: function () {
        if (Ext.isEmpty(this.cellTemplate)) {
            this.cellTemplate = new Ext.XTemplate(this.cellCommandTemplate);
        }

        return this.cellTemplate;
    },

    processEvent: function (type, view, cell, recordIndex, cellIndex, e) {
        var me = this,
            match = e.getTarget(".cell-imagecommand", 5),
            isClick = type == "click",
            isMouseDown = type == "mousedown";

        if (match) {
            if (isClick) {
                me.onCellCommandClick(view, e, match, cell, recordIndex, cellIndex);
            } else if (isMouseDown) {
                return false;
            }

            if (this.stopSelection != false) {
                return false;
            }
        }

        if (isMouseDown && this.stopSelectionSelectors) {
            var i = 0,
                s = this.stopSelectionSelectors;

            for (i; i < s.length; i++) {
                if (e.getTarget(s[i], cell)) {
                    return false;
                }
            }
        }

        return this.callParent(arguments);
    },

    cellCommandRenderer: function (value, meta, record, row, col, store, view) {
        var me = this;

        if (me.commands && me.commands.length > 0 && me.isCellCommand) {
            var rightAlign = me.rightCommandAlign === false ? false : true,
                preparedCommands = [],
                commands = me.commands,
                i,
                cmd,
                command,
                userRendererValue;

            for (i = 0; i < commands.length; i++) {
                cmd = commands[i];

                if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                    cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
                }
            }

            if (me.prepareCommands) {
                commands = Ext.net.clone(me.commands);
                me.prepareCommands(me.gridRef, commands, record, row, col, value);
            }

            for (i = rightAlign ? (commands.length - 1) : 0; rightAlign ? (i >= 0) : (i < commands.length) ; rightAlign ? i-- : i++) {
                cmd = commands[i];

                cmd.tooltip = cmd.tooltip || {};

                if (cmd.iconCls && cmd.iconCls.charAt(0) === '#') {
                    cmd.iconCls = X.net.RM.getIcon(cmd.iconCls.substring(1));
                }

                command = {
                    command: cmd.command,
                    cls: cmd.cls,
                    iconCls: cmd.iconCls,
                    hidden: cmd.hidden,
                    disabled: cmd.disabled,
                    text: cmd.text,
                    style: cmd.style,
                    qtext: cmd.tooltip.text,
                    qtitle: cmd.tooltip.title,
                    hideMode: cmd.hideMode
                };

                if (me.prepareCommand) {
                    me.prepareCommand(me.gridRef, command, record, row, col, value);
                }

                if (command.disabled) {
                    command.cls = (command.cls || "") + " x-imagecommand-disabled";
                }

                if (command.hidden) {
                    command.hideCls = "x-hidden-" + (command.hideMode || "display");
                }

                preparedCommands.push(command);
            }

            userRendererValue = value;

            if (typeof me.userRenderer === "string") {
                me.userRenderer = Ext.util.Format[me.userRenderer];
            }

            if (typeof me.userRenderer === "function") {
                userRendererValue = me.userRenderer.call(
                    me.rendererScope || me,
                    value,
                    meta,
                    record,
                    row,
                    col,
                    store,
                    view
                );
            }

            meta.tdCls = meta.tdCls || "";
            meta.tdCls += " cell-imagecommand-cell";

            if (me.isHidden()) {
                meta.tdCls += " x-hide-command";
            }

            return me.getCellCommandTemplate().apply({
                commands: preparedCommands,
                value: userRendererValue,
                rightAlign: rightAlign,
                rightValue: me.align == "right"
            });
        } else {
            meta.tdCls = meta.tdCls || "";
            meta.tdCls += " cell-no-imagecommand";
        }

        if (typeof me.userRenderer === "string") {
            me.userRenderer = Ext.util.Format[me.userRenderer];
        }

        if (typeof me.userRenderer === "function") {
            value = me.userRenderer.call(
                me.rendererScope || me.ownerCt,
                value,
                meta,
                record,
                row,
                col,
                store,
                view
            );
        }

        return value;
    },

    onCellCommandClick: function (view, e, target, cell, recordIndex, cellIndex) {
        var cmd = Ext.fly(target).getAttribute("cmd"),
            owner = this.gridRef,
            store = owner.getStore(),
            record = store.getAt ? store.getAt(recordIndex) : view.getRecord(view.getNode(recordIndex));

        if (Ext.isEmpty(cmd, false) || Ext.fly(target).hasCls("x-imagecommand-disabled")) {
            return;
        }

        this.fireEvent("command", this, cmd, record, recordIndex, cellIndex);
    },

    onTitleElDblClick: function(e) { // #685
        var prev;

        if (this.isAtStartEdge(e)) {
            prev = this.previousNode('gridcolumn:not([hidden]):not([isGroupHeader]):not([isCheckerHd])');

            if (prev) {
                this.callParent(arguments);
            }
        } else {
            this.callParent(arguments);
        }
    },

    beforeDestroy: function () {
        if (this.editors) {
            Ext.destroy(this.editors);
        }

        this.callParent(arguments);
    },

    onDestroy: function () {
        if (this.patternTpl) {
            this.patternTpl.destroy();
        }

        this.callParent(arguments);
    }
});