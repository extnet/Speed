// @source: desktop/desktop-overrides.js

Ext.define('Ext.ux.desktop.App', {
    override: 'Ext.ux.desktop.App',

    addModule: function (module) {
        this.removeModule(module.id);
        this.modules.push(module);

        module.app = this;

        if (module.shortcut) {
            var s = this.desktop.shortcutDefaults ? Ext.applyIf(module.shortcut, this.desktop.shortcutDefaults) : module.shortcut,
                xy;

            if (Ext.isEmpty(s.x) || Ext.isEmpty(s.y)) {
                xy = this.desktop.getFreeCell();
                s.x = xy[0];
                s.y = xy[1];
                s.tempX = s.x;
                s.tempY = s.y;
            }

            if (module.shortcut.title === undefined) {
                module.shortcut.title = module.shortcut.name;
            }

            this.desktop.shortcuts.add(s);

            //this.desktop.arrangeShortcuts(false, true);
        }

        if (module.launcher) {
            if (!(module.launcher.handler || module.launcher.listeners && module.launcher.listeners.click)) {
                module.launcher.handler = function () {
                    this.createWindow();
                };
                module.launcher.scope = module;
            }
            module.launcher.moduleId = module.id;
            this.desktop.taskbar.startMenu.add(module.launcher);
        }

        if (module.autoRun) {
            module.autoRunHandler ? module.autoRunHandler() : module.createWindow();
        }
    },

    constructor: function (config) {
        var me = this;

        me.mixins.observable.constructor.call(me, config);

        if (Ext.isReady) {
            Ext.Function.defer(me.init, 10, me);
        } else {
            Ext.onReady(me.init, me);
        }

        Ext.net.Desktop = this;
    },

    // Overrides viewport setting and adds autorun and quicktips
    init: function () {
        var me = this, desktopCfg;

        if (me.useQuickTips) {
            Ext.QuickTips.init();
        }

        me.modules = me.getModules();
        if (me.modules) {
            me.initModules(me.modules);
        }

        desktopCfg = me.getDesktopConfig();
        me.desktop = new Ext.ux.desktop.Desktop(desktopCfg);

        me.viewport = new Ext.net.Viewport({
            layout: 'fit',
            items: [me.desktop]
        });

        Ext.getWin().on('beforeunload', me.onUnload, me);

        Ext.each(me.modules, function (module) {
            if (module.autoRun) {
                module.autoRunHandler ? module.autoRunHandler() : module.createWindow();
            }
        });

        me.isReady = true;
        me.fireEvent('ready', me);
    },

    // Copy the 'name' setting into the 'title' one so that the name
    // with whitestpaces become available when the shortcut is laid
    // on the desktop.
    initModules: function (modules) {
        var me = this;

        retVal = me.callParent(arguments);

        Ext.each(modules, function (module) {
            if (module.shortcut) {
                module.shortcut.title = module.shortcut.name;
            }
        });

        return retVal;
    },

    removeModule: function (id) {
        var module = this.getModule(id);
        if (module) {
            module.app = null;
            Ext.Array.remove(this.modules, module);
            var rpos = this.desktop.shortcuts.find('module', id);
            if (rpos) {
                this.desktop.shortcuts.removeAt(rpos);
            }

            var launcher = this.desktop.taskbar.startMenu.child('[moduleId="' + id + '"]');
            if (launcher) {
                this.desktop.taskbar.startMenu.remove(launcher, true);
            }

            var window = this.desktop.getModuleWindow(id);
            if (window) {
                window.destroy();
            }
        }
    }
});

Ext.define('Ext.ux.desktop.Desktop', {
    override: 'Ext.ux.desktop.Desktop',

    shortcutEvent: "click",
    ddShortcut: true,
    shortcutDragSelector: true,
    shortcutNameEditing: false,
    alignToGrid: true,
    multiSelect: true,
    defaultWindowMenu: true,
    restoreText: 'Restore',
    minimizeText: 'Minimize',
    maximizeText: 'Maximize',
    closeText: 'Close',
    defaultWindowMenuItemsFirst: false,

    shortcutTpl: [
        '<tpl for=".">',
        '<div class="ux-desktop-shortcut" style="{[this.getPos(values)]}" id="{name}-shortcut">',
        '<div class="ux-desktop-shortcut-wrap">',
        '<div class="ux-desktop-shortcut-icon {iconCls}">',
        '<img src="', Ext.BLANK_IMAGE_URL, '" title="{name}">',
        '</div>',
        '<div class="ux-desktop-shortcut-text {textCls}">{title}</div>',
        '</div>',
        '<div class="ux-desktop-shortcut-bg"></div>',
        '</div>',
        '</tpl>',
        '<div class="x-clear"></div>'
    ],

    addShortcutsDD: function (store, records) {
        var me = this,
            view = this.rendered && this.getComponent(1);

        if (!this.rendered) {
            this.on("afterlayout", function () {
                this.addShortcutsDD(store, records);
            }, this, { delay: 500, single: true });

            return;
        }

        if (!view.rendered || !view.viewReady) {
            view.on("viewready", function () {
                this.addShortcutsDD(store, records);
            }, this, { delay: 500, single: true });

            return;
        }

        Ext.each(records, function (record) {
            this.resizeShortcutBg(record);
        }, this);

        if (!this.ddShortcut) {
            return;
        }

        Ext.each(records, function (r) {
            r.dd = new Ext.dd.DDProxy(view.getNode(r), "desktop-shortcuts-dd");
            r.dd.startDrag = function (x, y) {
                var dragEl = Ext.get(this.getDragEl()),
                    el = Ext.get(this.getEl()),
                    view = me.getComponent(1),
                    bg = el.child(".ux-desktop-shortcut-bg"),
                    wrap = el.child(".ux-desktop-shortcut-wrap");

                this.origXY = el.getXY();

                if (!view.isSelected(el)) {
                    view.getSelectionModel().select(view.getRecord(el));
                }
                dragEl.applyStyles({ border: "solid gray 1px" });
                dragEl.update(wrap.dom.innerHTML);
                dragEl.addCls(wrap.dom.className + " ux-desktop-dd-proxy");

                if (me.alignToGrid) {
                    this.placeholder = me.body.createChild({
                        tag: "div",
                        cls: "ux-desktop-shortcut-proxy-bg"
                    });
                }

                wrap.hide(false);
                bg.hide(false);
            };

            r.dd.onDrag = function (e) {
                if (me.alignToGrid) {
                    var left = Ext.fly(this.getDragEl()).getLeft(true), //e.getX(),
                        top = Ext.fly(this.getDragEl()).getTop(true), //e.getY(),
                        xy = {
                            x: (left + 33) - ((left + 33) % 66),
                            y: (top + 45) - ((top + 45) % 91)
                        };

                    this.placeholder.setXY([xy.x, xy.y]);
                }
            };

            r.dd.afterDrag = function () {
                var el = Ext.get(this.getEl()),
                    view = me.getComponent(1),
                    record = view.getRecord(el),
                    sm = view.getSelectionModel(),
                    left = el.getLeft(true),
                    top = el.getTop(true),
                    xy = {
                        x: (left + 33) - ((left + 33) % 66),
                        y: (top + 45) - ((top + 45) % 91)
                    },
                    offsetX = xy.x - this.origXY[0],
                    offsetY = xy.y - this.origXY[1];

                if (me.alignToGrid) {
                    this.placeholder.destroy();
                }

                if (sm.getCount() > 1) {
                    Ext.each(sm.getSelection(), function (r) {
                        if (r.id != record.id) {
                            var node = Ext.get(view.getNode(r)),
                                xy = node.getXY(),
                                ox = xy[0] + offsetX,
                                oy = xy[1] + offsetY;

                            node.setXY([ox, oy]);
                            r.data.x = ox;
                            r.data.y = oy;
                            r.data.tempX = ox;
                            r.data.tempY = oy;
                            if (me.alignToGrid) {
                                me.shiftShortcutCell(r);
                            }
                        }
                    }, this);
                }

                el.setXY([xy.x, xy.y]);
                record.data.x = xy.x;
                record.data.y = xy.y;
                record.data.tempX = xy.x;
                record.data.tempY = xy.y;
                el.child(".ux-desktop-shortcut-bg").show(false);
                el.child(".ux-desktop-shortcut-wrap").show(false);
                if (me.alignToGrid) {
                    me.shiftShortcutCell(record);
                }
                me.app.fireEvent("shortcutmove", me.app, me.app.getModule(record.data.module), record, xy);
                me.saveState();
            };
        }, this);
    },

    applyState: function (state) {
        if (this.shortcuts && state.s) {
            Ext.each(state.s, function (coord) {
                this.shortcuts.each(function (shortcut) {
                    if (shortcut.data.module == coord.m) {
                        shortcut.data.x = coord.x;
                        shortcut.data.y = coord.y;
                        return false;
                    }
                }, this);
            }, this);
        }

        if (this.taskbar.quickStart && state.q) {
            this.taskbar.quickStart.setWidth(state.q);
        }

        if (this.taskbar.tray && state.t) {
            this.taskbar.tray.setWidth(state.t);
        }
    },

    arrangeShortcuts: function (ignorePosition, ignoreTemp) {
        var col = { index: 1, x: 10 },
            row = { index: 1, y: 10 },
            records = this.shortcuts.getRange(),
            area = this.getComponent(0),
            view = this.getComponent(1),
            height = area.getHeight();

        for (var i = 0, len = records.length; i < len; i++) {
            var record = records[i],
                tempX = record.get('tempX'),
                tempY = record.get('tempY'),
                x = record.get('x'),
                y = record.get('y'),
                xEmpty = Ext.isEmpty(x),
                yEmpty = Ext.isEmpty(y);

            if (ignoreTemp !== true) {
                x = Ext.isEmpty(x) ? tempX : x;
                y = Ext.isEmpty(y) ? tempY : y;
            }

            if (Ext.isEmpty(x) || Ext.isEmpty(y) || ignorePosition === true) {
                this.setShortcutPosition(record, height, col, row, view);
            }
            else {
                x = !xEmpty && Ext.isString(x) ? eval(x.replace('{DX}', 'area.getWidth()')) : x;
                y = !yEmpty && Ext.isString(y) ? eval(y.replace('{DY}', 'area.getHeight()')) : y;
                x = x - (x % (this.alignToGrid ? 66 : 1));
                y = y - (y % (this.alignToGrid ? 91 : 1));
                Ext.fly(view.getNode(record)).setXY([x, y]);
                if (!xEmpty && !yEmpty) {
                    record.data.x = x;
                    record.data.y = y;
                }
                record.data.tempX = x;
                record.data.tempY = y;
            }
        }
    },

    cascadeWindows: function () {
        var x = 0,
            y = 0,
            zmgr = this.getDesktopZIndexManager();

        if (zmgr) {
            zmgr.eachBottomUp(function (win) {
                if (win.isWindow && win.isVisible() && !win.maximized) {
                    win.setPosition(x, y);
                    x += 20;
                    y += 20;
                }
            });
        }
    },

    centerWindow: function () {
        var me = this,
            xy;

        if (me.isVisible()) {
            xy = me.el.getAlignToXY(me.desktop.body, 'c-c');
            me.setPagePosition(xy);
        } else {
            me.needsCenter = true;
        }

        return me;
    },

    checkerboardWindows: function () {
        var me = this,
            availWidth = me.body.getWidth(true),
            availHeight = me.body.getHeight(true),
            x = 0,
            y = 0,
            lastx = 0,
            lasty = 0,
            square = 400;

        me.windows.each(function (win) {
            if (win.isVisible()) {
                win.setWidth(square);
                win.setHeight(square);

                win.setPosition(x, y);
                x += square;

                if (x + square > availWidth) {
                    x = lastx;
                    y += square;

                    if (y > availHeight) {
                        lastx += 20;
                        lasty += 20;
                        x = lastx;
                        y = lasty;
                    }
                }
            }
        }, me);
    },

    closeWindows: function () {
        this.windows.each(function (win) {
            win.close();
        });
    },

    createDataView: function () {
        var me = this,
            data, dataView,
            plugins = [],
            tpl;

        if (!me.shortcuts) {
            data = [];

            Ext.each(me.app.modules, function (module) {
                var s = module.shortcut;
                if (module.shortcut && module.shortcut.hidden !== true) {
                    if (me.shortcutDefaults) {
                        Ext.applyIf(s, me.shortcutDefaults);
                    }

                    data.push(s);
                }
            }, me);

            me.shortcuts = Ext.create('Ext.data.Store', {
                model: 'Ext.ux.desktop.ShortcutModel',
                data: data,
                listeners: {
                    "add": {
                        fn: this.addShortcutsDD,
                        delay: 100,
                        scope: this
                    },
                    "remove": {
                        fn: this.removeShortcutsDD,
                        scope: this
                    }
                }
            });

            if (this.sortShortcuts !== false) {
                me.shortcuts.sort("sortIndex", "ASC");
            }

            me.shortcuts.on("datachanged", me.saveState, me, { buffer: 100 });
        }

        Ext.on("resize", this.onWindowResize, this, { buffer: 100 });

        if (this.shortcutDragSelector && this.multiSelect !== false) {
            plugins.push(Ext.create('Ext.ux.DataView.DragSelector', {}));
        }

        if (this.shortcutNameEditing) {
            this.labelEditor = Ext.create('Ext.ux.DataView.LabelEditor', {
                dataIndex: "name",
                autoSize: false,
                offsets: [-6, 0],
                field: Ext.create('Ext.form.field.TextArea', {
                    allowBlank: false,
                    width: 66,
                    growMin: 20,
                    enableKeyEvents: true,
                    style: "overflow:hidden",
                    grow: true,
                    selectOnFocus: true,
                    listeners: {
                        keydown: function (field, e) {
                            if (e.getKey() == e.ENTER) {
                                this.labelEditor.completeEdit();
                            }
                        },
                        scope: this
                    }
                }),
                labelSelector: "ux-desktop-shortcut-text"
            });
            this.labelEditor.on("complete", function (editor, value, oldValue) {
                this.app.fireEvent("shortcutnameedit", this.app, this.app.getModule(editor.activeRecord.data.module), value, oldValue);
            }, this);
            plugins.push(this.labelEditor);
        }

        dataView = me.callParent(arguments);

        tpl = Ext.isArray(me.shortcutTpl) ? dataView.tpl : me.shortcutTpl;
        tpl.getPos = Ext.Function.bind(function (values) {
            var area = this.getComponent(0),
                x = Ext.isString(values.x) ? eval(values.x.replace('{DX}', 'area.getWidth()')) : values.x,
                y = Ext.isString(values.y) ? eval(values.y.replace('{DY}', 'area.getHeight()')) : values.y;
            return Ext.String.format("left:{0}px;top:{1}px;", values.x || values.tempX || 0, values.y || values.tempY || 0);
        }, this);

        dataView.multiSelect = this.multiSelect;
        dataView.cls = "ux-desktop-view";
        dataView.plugins = plugins;
        dataView.tpl = tpl;
        dataView.selModel = {
            listeners: {
                "select": function (sm, record) {
                    this.resizeShortcutBg(record);
                },

                "deselect": function (sm, record) {
                    this.resizeShortcutBg(record);
                },

                scope: this,
                delay: 10
            }
        };
        dataView.listeners = {
            "refresh": this.onWindowResize,
            "itemadd": this.arrangeShortcuts,
            "itemremove": this.arrangeShortcuts,
            "itemupdate": this.onItemUpdate,
            scope: this,
            buffer: 100
        }

        return dataView;
    },

    createWindowMenu: function () {
        var me = this,
            menu,
            defaultConfig = me.defaultWindowMenu ? {
                defaultAlign: 'br-tr',
                items: [
                    { text: me.restoreText, handler: me.onWindowMenuRestore, scope: me },
                    { text: me.minimizeText, handler: me.onWindowMenuMinimize, scope: me },
                    { text: me.maximizeText, handler: me.onWindowMenuMaximize, scope: me },
                    '-',
                    { text: me.closeText, handler: me.onWindowMenuClose, scope: me }
                ]
            } : {};

        if (me.windowMenu && Ext.isArray(me.windowMenu.items)) {
            defaultConfig.items = defaultConfig.items || [];

            defaultConfig.items = defaultWindowMenuItemsFirst ? defaultConfig.items.concat(me.windowMenu.items) : me.windowMenu.items.concat(defaultConfig.items);
            delete me.windowMenu.items;
        }

        menu = new Ext.menu.Menu(Ext.applyIf(me.windowMenu || {}, defaultConfig));
        if (me.defaultWindowMenu) {
            menu.on("beforeshow", me.onWindowMenuBeforeShow, me);
        }
        menu.on("hide", me.onWindowMenuHide, me);

        return menu;
    },

    getFreeCell: function () {
        var x = 0,
            y = 0,
            view = this.getComponent(1),
            width = view.getWidth(),
            height = view.getHeight(),
            occupied,
            isOver;

        while (x < width) {
            occupied = false;
            this.shortcuts.each(function (r) {
                if (r.data.tempX == x && r.data.tempY == y) {
                    occupied = true;
                    return false;
                }
            }, this);

            if (!occupied) {
                return [x, y];
            }

            isOver = (y + 91 * 2 + 10) > height;

            y = y + 91 + 10;

            if (isOver && y > 10) {
                x = x + 66 + 10;
                y = 10;
            }

            x = x - (x % 66);
            y = y - (y % 91);
        }

        return [x, y];
    },

    getModuleWindow: function (id) {
        var win;
        this.windows.each(function (w) {
            if (w.moduleId == id) {
                win = w;
                return false;
            }
        });
        return win;
    },

    getState: function () {
        var shortcuts = [];

        this.shortcuts.each(function (record) {
            var x = record.data.x,
                y = record.data.y;

            if (!Ext.isEmpty(x) || !Ext.isEmpty(y)) {
                shortcuts.push({ x: x, y: y, m: record.data.module });
            }
        });

        return { s: shortcuts, q: this.taskbar.quickStart.getWidth(), t: this.taskbar.tray.getWidth() };
    },

    initComponent: function () {
        var me = this;

        me.callParent(arguments);

        me.taskbar.desktop = me;
    },

    minimizeWindows: function () {
        this.windows.each(function (win) {
            this.minimizeWindow(win);
        }, this);
    },

    // Github #1559: skip fiddling around with menu entries
    // that don't define 'minWindows' config option.
    onDesktopMenuBeforeShow: function (menu) {
        var me = this, count = me.windows.getCount();

        menu.items.each(function (item) {
            if (Ext.isDefined(item.minWindows)) {
                var min = item.minWindows || 0;
                item.setDisabled(count < min);
            }
        });
    },

    onItemUpdate: function (record, index, node) {
        this.removeShortcutsDD(record.store, record);
        this.addShortcutsDD(record.store, record);
        this.resizeShortcutBg(record);
    },

    // Implements support for the module shortcut to have a simple
    // javascript handler directly on the component.
    onShortcutItemClick: function (dataView, record) {
        var me = this,
            module = me.app.getModule(record.data.module);

        if (module && record.data.handler && Ext.isFunction(record.data.handler)) {
            record.data.handler.call(this, module);
        } else {
            me.callParent(arguments);
        }
    },

    onWindowResize: function () {
        this.arrangeShortcuts(false, true);
    },

    removeShortcutsDD: function (store, record) {
        if (record.dd) {
            record.dd.destroy();
            delete record.dd;
        }
    },

    resizeShortcutBg: function (record) {
        var node = Ext.get(this.getComponent(1).getNode(record));

        if (!node) {
            return;
        }

        var wrap = node.child(".ux-desktop-shortcut-wrap"),
            bg = node.child(".ux-desktop-shortcut-bg"),
            w = wrap.getWidth(),
            h = wrap.getHeight();

        bg.setSize(w, h);
        node.setSize(w + 2, h + 2);
    },

    setShortcutPosition: function (record, height, col, row, view) {
        var node = Ext.get(view.getNode(record)),
            wrap = node.child(".ux-desktop-shortcut-wrap"),
            nodeHeight = 91,
            isOver = (row.y + nodeHeight) > height;

        if (isOver && row.y > 10) {
            col.index = col.index++;
            col.x = col.x + 66 + 10;
            row.index = 1;
            row.y = 10;
        }

        col.x = col.x - (col.x % (this.alignToGrid ? 66 : 1));
        row.y = row.y - (row.y % (this.alignToGrid ? 91 : 1));

        node.setXY([
            col.x,
            row.y
        ]);

        record.data.x = col.x;
        record.data.y = row.y;
        record.data.tempX = col.x;
        record.data.tempY = row.y;

        row.index++;
        row.y = row.y + nodeHeight + 10;
    },

    shiftShortcutCell: function (record) {
        var x = record.data.tempX,
            y = record.data.tempY,
            view = this.getComponent(1),
            height = view.getHeight(),
            newRecord;

        this.shortcuts.each(function (r) {
            if (r.id != record.id && r.data.tempX == x && r.data.tempY == y) {
                var node = Ext.get(view.getNode(r)),
                    wrap = node.child(".ux-desktop-shortcut-wrap"),
                    nodeHeight = 91,
                    isOver = (y + nodeHeight * 2 + 10) > height;

                y = y + nodeHeight + 10;

                if (isOver && y > 10) {
                    x = x + 66 + 10;
                    y = 10;
                }

                x = x - (x % 66);
                y = y - (y % 91);

                node.setXY([
                    x,
                    y
                ]);

                r.data.x = "";
                r.data.y = "";
                r.data.tempX = x;
                r.data.tempY = y;
                newRecord = r;
                return false;
            }
        }, this);

        if (newRecord) {
            this.shiftShortcutCell(newRecord);
        }
    },

    showWindow: function (config, cls) {
        var w = this.createWindow(config, cls);
        w.show();
        return w;
    },

    snapFitWindows: function () {
        var me = this,
            availWidth = me.body.getWidth(true),
            availHeight = me.body.getHeight(true),
            x = 0,
            y = 0,
            snapCount = 0,
            snapSize;

        me.windows.each(function (win) {
            if (win.isVisible()) {
                snapCount++;
            }
        });

        snapSize = parseInt(availWidth / snapCount);

        if (snapSize > 0) {
            me.windows.each(function (win) {
                if (win.isVisible()) {
                    win.setWidth(snapSize);
                    win.setHeight(availHeight);
                    win.setPosition(x, y);
                    x += snapSize;
                }
            });
        }
    },

    snapFitVWindows: function () {
        var me = this,
            availWidth = me.body.getWidth(true),
            availHeight = me.body.getHeight(true),
            x = 0,
            y = 0,
            snapCount = 0,
            snapSize;

        me.windows.each(function (win) {
            if (win.isVisible()) {
                snapCount++;
            }
        });

        snapSize = parseInt(availHeight / snapCount);

        if (snapSize > 0) {
            me.windows.each(function (win) {
                if (win.isVisible()) {
                    win.setWidth(availWidth);
                    win.setHeight(snapSize);

                    win.setPosition(x, y);
                    y += snapSize;
                }
            });
        }
    },

    // Github #1565: Correct maximized window's top coordinate to 0
    updateActiveWindow: function () {
        var me = this,
            retVal = me.callParent(arguments),
            activeWindow = me.getActiveWindow();

        if (activeWindow && activeWindow.maximized && activeWindow.el &&
            activeWindow.el.getTop() != 0) {
            activeWindow.el.setTop(0);
        }

        return retVal;
    }
});

Ext.define('Ext.ux.desktop.Module', {
    override: 'Ext.ux.desktop.Module',

    addLauncher: function (launcher) {
        this.launcher = launcher;

        if (!(this.launcher.handler || this.launcher.listeners && this.launcher.listeners.click)) {
            this.launcher.handler = function () {
                this.createWindow();
            };
            this.launcher.scope = this;
        }
        this.launcher.moduleId = this.id;
        this.app.desktop.taskbar.startMenu.add(this.launcher);
    },

    addWindow: function (window, remoteResources) {
        this.window = window;
        this.remoteResources = remoteResources;
        if (this.autoRun && !this.autoRunHandler) {
            this.createWindow();
        }
    },

    createWindow: function (config) {
        if (!this.window) {
            return;
        }

        var desktop = this.app.getDesktop(),
            win = desktop.getModuleWindow(this.id),
            wndCfg,
            isReopen = !win && this.win;

        win = win || this.win;

        if (!win) {
            wndCfg = this.window.call(window) || this._window;

            if (this.remoteResources) {
                this.waitResources = true;
                return;
            }

            if (config) {
                wndCfg = Ext.apply(wndCfg, config);
            }

            win = desktop.createWindow(wndCfg);
            win.moduleId = this.id;
            if (win.closeAction === "hide") {
                this.win = win;
                win.on("destroy", function () {
                    delete this.win;
                }, this);
            }
        }

        if (isReopen) {
            desktop.windows.add(win);

            win.taskButton = desktop.taskbar.addTaskButton(win);
            win.animateTarget = win.taskButton.el;
        }
        win.show();
        return win;
    },

    run: function () {
        return this.createWindow();
    },

    setWindow: function (window) {
        this._window = window;
        if (this.remoteResources) {
            delete this.remoteResources;

            if (this.waitResources) {
                delete this.waitResources;
                this.createWindow();
            }
        }
    }
});

Ext.define('Ext.ux.desktop.ShortcutModel', {
    override: 'Ext.ux.desktop.ShortcutModel',
    fields: [{
        name: 'name',
        convert: Ext.String.createVarName
    }, {
        name: 'iconCls'
    }, {
        name: 'module'
    }, {
        name: 'title'
    }]
});

Ext.define('Ext.ux.desktop.TaskBar', {
    override: 'Ext.ux.desktop.TaskBar',

    quickStartWidth : 60,
    trayWidth : 80,
    trayClockConfig : true,

    getQuickStart: function () {
        var me = this,
            retVal;

        // Maintain backwards compatibility with Ext.NET while not
        // dropping support to ExtJS' flat items list.
        if (me.quickStart === undefined &&
            me.quickStartConfig !== undefined &&
            me.quickStartConfig.xtype == 'toolbar') {

            var retWidth = (me.quickStartWidth !== undefined) ? me.quickStartWidth : (Ext.themeName === 'neptune' ? 70 : 60)

            retVal = {
                minWidth: 20,
                width: retWidth,
                items: me.quickStartConfig.items,
                enableOverflow: true
            };

            delete me.quickStartConfig;
        } else {
            retVal = me.callParent(arguments);

            if (me.quickStartWidth !== undefined) {
                retVal.width = me.quickStartWidth
            }
            if (me.hideQuickStart !== undefined) {
                retVal.hidden = me.hideQuickStart
            }
        }

        return retVal;
    },

    getTrayConfig: function () {
        var me = this;

        // Wrap tray items into ExtJS's trayItems config so that they
        // can be loaded. This makes the code backwards compatible with
        // Ext.NET implementation of the Desktop component.
        if (me.trayItems === undefined &&
            me.trayConfig !== undefined &&
            me.trayConfig.xtype == 'toolbar') {
            me.trayItems = me.trayConfig.items;
        }

        if (!Ext.isArray(me.trayItems)) {
            me.trayItems = [];
        }

        if (me.trayClock) {
            me.trayItems.push(Ext.isObject(me.trayClock) ? me.trayClock : { xtype: 'trayclock', flex: 1 });
        }

        return Ext.apply(me.callParent(arguments), {
            width: me.trayWidth,
            hidden: me.hideTray,
            enableOverflow: true
        });
    },

    // ExtJS splitter '&#160;' does not show up at all and quickstart already
    // has an end splitter.
    getWindowBarConfig: function () {
        return {
            flex: 1,
            cls: 'ux-desktop-windowbar',
            layout: { overflowHandler: 'Scroller' }
        };
    },

    initComponent: function () {
        var me = this;

        me.callParent();

        // Add a separator between the start menu button and quickstart.
        me.insert(1, '-');

        me.quickStart.on("resize", function () {
            this.desktop.saveState();
        }, this, { buffer: 100 });

        me.tray.on("resize", function () {
            this.desktop.saveState();
        }, this, { buffer: 100 });
    },

    onQuickStartClick: function (btn) {
        var me = this;

        if (btn.module !== undefined) {
            return me.callParent(arguments);
        }
    }
});