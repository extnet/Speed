Ext.define('ExtThemeNeptune.Component', {
    override: 'Ext.Component',
    initComponent: function() {
        this.callParent();
        if (this.dock && this.border === undefined) {
            this.border = false;
        }
    },
    privates: {
        initStyles: function() {
            var me = this,
                hasOwnBorder = me.hasOwnProperty('border'),
                border = me.border;
            if (me.dock) {
                // prevent the superclass method from setting the border style.  We want to
                // allow dock layout to decide which borders to suppress.
                me.border = null;
            }
            me.callParent(arguments);
            if (hasOwnBorder) {
                me.border = border;
            } else {
                delete me.border;
            }
        }
    }
});

/**
 * The FocusManager is responsible for managing the following according to WAI ARIA practices:
 *
 * 1. Component focus
 * 2. Keyboard navigation
 * 3. Provide a visual cue for focused components, in the form of a focus ring/frame.
 *
 */
Ext.define('Ext.aria.FocusManager', {
    singleton: true,
    requires: [
        'Ext.util.KeyNav',
        'Ext.util.Observable'
    ],
    mixins: {
        observable: 'Ext.util.Observable'
    },
    /**
     * @property {Boolean} enabled
     * Whether or not the FocusManager is currently enabled
     */
    enabled: false,
    /**
     * @event disable
     * Fires when the FocusManager is disabled
     * @param {Ext.aria.FocusManager} fm A reference to the FocusManager singleton
     */
    /**
     * @event enable
     * Fires when the FocusManager is enabled
     * @param {Ext.aria.FocusManager} fm A reference to the FocusManager singleton
     */
    // Array to keep track of open windows
    windows: [],
    constructor: function(config) {
        var me = this,
            whitelist = me.whitelist,
            cache, i, len;
        me.mixins.observable.constructor.call(me, config);
    },
    /**
     * @private
     * Enables the FocusManager by turning on window management and keyboard navigation
     */
    enable: function() {
        var me = this,
            doc = Ext.getDoc();
        if (me.enabled) {
            return;
        }
        // initDom will call addFocusListener which needs the FocusManager to be enabled
        me.enabled = true;
        // map F6 to toggle focus among open windows
        me.toggleKeyMap = new Ext.util.KeyMap({
            target: doc,
            scope: me,
            defaultEventAction: 'stopEvent',
            key: Ext.event.Event.F6,
            fn: me.toggleWindow
        });
        me.fireEvent('enable', me);
    },
    onComponentBlur: function(cmp, e) {
        var me = this;
        if (me.focusedCmp === cmp) {
            me.previousFocusedCmp = cmp;
        }
        Ext.globalEvents.fireEvent('componentblur', me, cmp, me.previousFocusedCmp);
        return false;
    },
    onComponentFocus: function(cmp, e) {
        var me = this;
        if (Ext.globalEvents.fireEvent('beforecomponentfocus', me, cmp, me.previousFocusedCmp) === false) {
            me.clearComponent(cmp);
            return;
        }
        me.focusedCmp = cmp;
        return false;
    },
    // This should be fixed in https://sencha.jira.com/browse/EXTJS-14124
    onComponentHide: Ext.emptyFn,
    toggleWindow: function(key, e) {
        var me = this,
            windows = me.windows,
            length = windows.length,
            focusedCmp = me.focusedCmp,
            curIndex = 0,
            newIndex = 0,
            current;
        if (length === 1) {
            return;
        }
        current = focusedCmp.isWindow ? focusedCmp : focusedCmp.up('window');
        if (current) {
            curIndex = me.findWindowIndex(current);
        }
        if (e.shiftKey) {
            newIndex = curIndex - 1;
            if (newIndex < 0) {
                newIndex = length - 1;
            }
        } else {
            newIndex = curIndex + 1;
            if (newIndex === length) {
                newIndex = 0;
            }
        }
        current = windows[newIndex];
        if (current.cmp.isWindow) {
            current.cmp.toFront();
        }
        current.cmp.focus(false, 100);
        return false;
    },
    addWindow: function(window) {
        var me = this,
            win = {
                cmp: window
            };
        me.windows.push(win);
    },
    removeWindow: function(window) {
        var me = this,
            windows = me.windows,
            current;
        if (windows.length === 1) {
            return;
        }
        current = me.findWindowIndex(window);
        if (current >= 0) {
            Ext.Array.erase(windows, current, 1);
        }
    },
    findWindowIndex: function(window) {
        var me = this,
            windows = me.windows,
            length = windows.length,
            curIndex = -1,
            i;
        for (i = 0; i < length; i++) {
            if (windows[i].cmp === window) {
                curIndex = i;
                break;
            }
        }
        return curIndex;
    }
}, function() {
    var mgr = Ext['FocusManager'] = Ext.aria.FocusManager;
    Ext.onReady(function() {
        mgr.enable();
    });
});

/** */
Ext.define('Ext.aria.Component', {
    override: 'Ext.Component',
    requires: [
        'Ext.aria.FocusManager'
    ],
    /**
     * @cfg {String} [ariaRole] ARIA role for this Component, defaults to no role.
     * With no role, no other ARIA attributes are set.
     */
    /**
     * @cfg {String} [ariaLabel] ARIA label for this Component. It is best to use
     * {@link #ariaLabelledBy} option instead, because screen readers prefer
     * aria-labelledby attribute to aria-label. {@link #ariaLabel} and {@link #ariaLabelledBy}
     * config options are mutually exclusive.
     */
    /**
     * @cfg {String} [ariaLabelledBy] DOM selector for a child element that is to be used
     * as label for this Component, set in aria-labelledby attribute.
     * If the selector is by #id, the label element can be any existing element,
     * not necessarily a child of the main Component element.
     *
     * {@link #ariaLabelledBy} and {@link #ariaLabel} config options are mutually exclusive,
     * and ariaLabel has the higher precedence.
     */
    /**
     * @cfg {String} [ariaDescribedBy] DOM selector for a child element that is to be used
     * as description for this Component, set in aria-describedby attribute.
     * The selector works the same way as {@link #ariaLabelledBy}
     */
    /**
     * @cfg {Object} [ariaAttributes] An object containing ARIA attributes to be set
     * on this Component's ARIA element. Use this to set the attributes that cannot be
     * determined by the Component's state, such as `aria-live`, `aria-flowto`, etc.
     */
    /**
     * @cfg {Boolean} [ariaRenderAttributesToElement=true] ARIA attributes are usually
     * rendered into the main element of the Component using autoEl config option.
     * However for certain Components (form fields, etc.) the main element is
     * presentational and ARIA attributes should be rendered into child elements
     * of the Component markup; this is done using the Component templates.
     *
     * If this flag is set to `true` (default), the ARIA attributes will be applied
     * to the main element.
     * @private
     */
    ariaRenderAttributesToElement: true,
    statics: {
        ariaHighContrastModeCls: Ext.baseCSSPrefix + 'aria-highcontrast'
    },
    // Several of the attributes, like aria-controls and aria-activedescendant
    // need to refer to element ids which are not available at render time
    ariaApplyAfterRenderAttributes: function() {
        var me = this,
            role = me.ariaRole,
            attrs;
        if (role !== 'presentation') {
            attrs = me.ariaGetAfterRenderAttributes();
            me.ariaUpdate(attrs);
        }
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            role = me.ariaRole,
            attrs = {
                role: role
            };
        // It does not make much sense to set ARIA attributes
        // on purely presentational Component, or on a Component
        // with no ARIA role specified
        if (role === 'presentation' || role === undefined) {
            return attrs;
        }
        if (me.hidden) {
            attrs['aria-hidden'] = true;
        }
        if (me.disabled) {
            attrs['aria-disabled'] = true;
        }
        if (me.ariaLabel) {
            attrs['aria-label'] = me.ariaLabel;
        }
        Ext.apply(attrs, me.ariaAttributes);
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs = {},
            el;
        if (!me.ariaLabel && me.ariaLabelledBy) {
            el = me.ariaGetLabelEl(me.ariaLabelledBy);
            if (el) {
                attrs['aria-labelledby'] = el.id;
            }
        }
        if (me.ariaDescribedBy) {
            el = me.ariaGetLabelEl(me.ariaDescribedBy);
            if (el) {
                attrs['aria-describedby'] = el.id;
            }
        }
        return attrs;
    },
    /**
     * Updates the component's element properties
     * @private
     * @param {Ext.Element} [el] The element to set properties on
     * @param {Object[]} props Array of properties (name: value)
     */
    ariaUpdate: function(el, props) {
        // The one argument form updates the default ariaEl
        if (arguments.length === 1) {
            props = el;
            el = this.ariaGetEl();
        }
        if (!el) {
            return;
        }
        el.set(props);
    },
    /**
     * Return default ARIA element for this Component
     * @private
     * @return {Ext.Element} ARIA element
     */
    ariaGetEl: function() {
        return this.el;
    },
    /**
     * @private
     * Return default ARIA labelled-by element for this Component, if any
     *
     * @param {String} [selector] Element selector
     *
     * @return {Ext.Element} Label element, or null
     */
    ariaGetLabelEl: function(selector) {
        var me = this,
            el = null;
        if (selector) {
            if (/^#/.test(selector)) {
                selector = selector.replace(/^#/, '');
                el = Ext.get(selector);
            } else {
                el = me.ariaGetEl().down(selector);
            }
        }
        return el;
    },
    // Unlike getFocusEl, this one always returns Ext.Element
    ariaGetFocusEl: function() {
        var el = this.getFocusEl();
        while (el.isComponent) {
            el = el.getFocusEl();
        }
        return el;
    },
    onFocus: function(e, t, eOpts) {
        var me = this,
            mgr = Ext.aria.FocusManager,
            tip, el;
        me.callParent(arguments);
        if (me.tooltip && Ext.quickTipsActive) {
            tip = Ext.tip.QuickTipManager.getQuickTip();
            el = me.ariaGetEl();
            tip.cancelShow(el);
            tip.showByTarget(el);
        }
        if (me.hasFocus && mgr.enabled) {
            return mgr.onComponentFocus(me);
        }
    },
    onBlur: function(e, t, eOpts) {
        var me = this,
            mgr = Ext.aria.FocusManager;
        me.callParent(arguments);
        if (me.tooltip && Ext.quickTipsActive) {
            Ext.tip.QuickTipManager.getQuickTip().cancelShow(me.ariaGetEl());
        }
        if (!me.hasFocus && mgr.enabled) {
            return mgr.onComponentBlur(me);
        }
    },
    onDisable: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-disabled': true
        });
    },
    onEnable: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-disabled': false
        });
    },
    onHide: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-hidden': true
        });
    },
    onShow: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-hidden': false
        });
    }
}, function() {
    function detectHighContrastMode() {
        /* Absolute URL for test image
         * (data URIs are not supported by all browsers, and not properly removed when images are disabled in Firefox) */
        var imgSrc = "http://www.html5accessibility.com/tests/clear.gif",
            supports = {},
            div = document.createElement("div"),
            divEl = Ext.get(div),
            divStyle = div.style,
            img = document.createElement("img"),
            supports = {
                images: true,
                backgroundImages: true,
                borderColors: true,
                highContrastMode: false,
                lightOnDark: false
            };
        /* create div for testing if high contrast mode is on or images are turned off */
        div.id = "ui-helper-high-contrast";
        div.className = "ui-helper-hidden-accessible";
        divStyle.borderWidth = "1px";
        divStyle.borderStyle = "solid";
        divStyle.borderTopColor = "#F00";
        divStyle.borderRightColor = "#FF0";
        divStyle.backgroundColor = "#FFF";
        divStyle.width = "2px";
        /* For IE, div must be wider than the image inside it when hidden off screen */
        img.alt = "";
        div.appendChild(img);
        document.body.appendChild(div);
        divStyle.backgroundImage = "url(" + imgSrc + ")";
        img.src = imgSrc;
        var getColorValue = function(colorTxt) {
                var values = [],
                    colorValue = 0,
                    match;
                if (colorTxt.indexOf("rgb(") !== -1) {
                    values = colorTxt.replace("rgb(", "").replace(")", "").split(", ");
                } else if (colorTxt.indexOf("#") !== -1) {
                    match = colorTxt.match(colorTxt.length === 7 ? /^#(\S\S)(\S\S)(\S\S)$/ : /^#(\S)(\S)(\S)$/);
                    if (match) {
                        values = [
                            "0x" + match[1],
                            "0x" + match[2],
                            "0x" + match[3]
                        ];
                    }
                }
                for (var i = 0; i < values.length; i++) {
                    colorValue += parseInt(values[i]);
                }
                return colorValue;
            };
        var performCheck = function(event) {
                var bkImg = divEl.getStyle("backgroundImage"),
                    body = Ext.getBody();
                supports.images = img.offsetWidth === 1;
                supports.backgroundImages = !(bkImg !== null && (bkImg === "none" || bkImg === "url(invalid-url:)"));
                supports.borderColors = !(divEl.getStyle("borderTopColor") === divEl.getStyle("borderRightColor"));
                supports.highContrastMode = !supports.images || !supports.backgroundImages;
                supports.lightOnDark = getColorValue(divEl.getStyle("color")) - getColorValue(divEl.getStyle("backgroundColor")) > 0;
                if (Ext.isIE) {
                    div.outerHTML = "";
                } else /* prevent mixed-content warning, see http://support.microsoft.com/kb/925014 */
                {
                    document.body.removeChild(div);
                }
            };
        performCheck();
        return supports;
    }
    Ext.enableAria = true;
    Ext.onReady(function() {
        var supports = Ext.supports,
            flags, div;
        flags = Ext.isWindows ? detectHighContrastMode() : {};
        supports.HighContrastMode = !!flags.highContrastMode;
        if (supports.HighContrastMode) {
            Ext.getBody().addCls(Ext.Component.ariaHighContrastModeCls);
        }
    });
});

/** */
Ext.define('Ext.aria.Img', {
    override: 'Ext.Img',
    getElConfig: function() {
        var me = this,
            config;
        config = me.callParent();
        // Screen reader software requires images to have tabIndex
        config.tabIndex = -1;
        return config;
    },
    onRender: function() {
        var me = this;
        //<debugger>
        if (!me.alt) {
            Ext.log.warn('For ARIA compliance, IMG elements SHOULD have an alt attribute');
        }
        //</debugger>
        me.callParent();
    }
});

/** */
Ext.define('Ext.aria.button.Button', {
    override: 'Ext.button.Button',
    requires: [
        'Ext.aria.Component'
    ],
    showEmptyMenu: true,
    constructor: function(config) {
        // Don't warn if we're under the slicer
        if (config.menu && !Ext.theme) {
            this.ariaCheckMenuConfig(config);
        }
        this.callParent(arguments);
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            menu = me.menu,
            attrs;
        attrs = me.callParent(arguments);
        if (menu) {
            attrs['aria-haspopup'] = true;
            attrs['aria-owns'] = menu.id;
        }
        if (me.enableToggle) {
            attrs['aria-pressed'] = me.pressed;
        }
        return attrs;
    },
    toggle: function(state) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            "aria-pressed": me.pressed
        });
    },
    ariaGetLabelEl: function() {
        return this.btnInnerEl;
    },
    // ARIA requires that buttons with a menu react to
    // Space and Enter keys by showing the menu. This
    // behavior conflicts with the various handler
    // functions we support in Ext JS; to avoid problems
    // we check if we have the menu *and* handlers, or
    // `click` event listeners, and raise an error if we do
    ariaCheckMenuConfig: function(cfg) {
        var text = cfg.text || cfg.html || 'Unknown';
        if (cfg.enableToggle || cfg.toggleGroup) {
            Ext.log.error("According to WAI-ARIA 1.0 Authoring guide " + "(http://www.w3.org/TR/wai-aria-practices/#menubutton), " + "menu button '" + text + "'s behavior will conflict with " + "toggling");
        }
        if (cfg.href) {
            Ext.log.error("According to WAI-ARIA 1.0 Authoring guide " + "(http://www.w3.org/TR/wai-aria-practices/#menubutton), " + "menu button '" + text + "' cannot behave as a link");
        }
        if (cfg.handler || (cfg.listeners && cfg.listeners.click)) {
            Ext.log.error("According to WAI-ARIA 1.0 Authoring guide " + "(http://www.w3.org/TR/wai-aria-practices/#menubutton), " + "menu button '" + text + "' should display the menu " + "on SPACE or ENTER keys, which will conflict with the " + "button handler");
        }
    }
});

/** */
Ext.define('Ext.aria.button.Split', {
    override: 'Ext.button.Split',
    constructor: function(config) {
        var ownerCt = config.ownerCt;
        // Warn unless the button belongs to a date picker,
        // the user can't do anything about that
        // Also don't warn if we're under the slicer
        if (!Ext.theme && (!ownerCt || !ownerCt.isDatePicker)) {
            Ext.log.warn("Using Split buttons is not recommended in WAI-ARIA " + "compliant applications, because their behavior conflicts " + "with accessibility best practices. See WAI-ARIA 1.0 " + "Authoring guide: http://www.w3.org/TR/wai-aria-practices/#menubutton");
        }
        this.callParent(arguments);
    }
});

/** */
Ext.define('Ext.aria.button.Cycle', {
    override: 'Ext.button.Cycle',
    constructor: function(config) {
        // Don't warn if we're under the slicer
        if (!Ext.theme) {
            Ext.log.warn("Using Cycle buttons is not recommended in WAI-ARIA " + "compliant applications, because their behavior conflicts " + "with accessibility best practices. See WAI-ARIA 1.0 " + "Authoring guide: http://www.w3.org/TR/wai-aria-practices/#menubutton");
        }
        this.callParent(arguments);
    }
});

/** */
Ext.define('Ext.aria.panel.Tool', {
    override: 'Ext.panel.Tool',
    requires: [
        'Ext.aria.Component',
        'Ext.util.KeyMap'
    ],
    tabIndex: 0,
    destroy: function() {
        if (this.keyMap) {
            this.keyMap.destroy();
        }
        this.callParent();
    },
    ariaAddKeyMap: function(params) {
        var me = this;
        me.keyMap = new Ext.util.KeyMap(Ext.apply({
            target: me.el
        }, params));
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        if (me.tooltip && me.tooltipType === 'qtip') {
            attrs['aria-label'] = me.tooltip;
        }
        return attrs;
    }
});

Ext.define('ExtThemeNeptune.resizer.Splitter', {
    override: 'Ext.resizer.Splitter',
    size: 8
});

Ext.define('ExtThemeNeptune.toolbar.Toolbar', {
    override: 'Ext.toolbar.Toolbar',
    usePlainButtons: false,
    border: false
});

Ext.define('ExtThemeNeptune.layout.component.Dock', {
    override: 'Ext.layout.component.Dock',
    /**
     * This table contains the border removal classes indexed by the sum of the edges to
     * remove. Each edge is assigned a value:
     * 
     *  * `left` = 1
     *  * `bottom` = 2
     *  * `right` = 4
     *  * `top` = 8
     * 
     * @private
     */
    noBorderClassTable: [
        0,
        // TRBL
        Ext.baseCSSPrefix + 'noborder-l',
        // 0001 = 1
        Ext.baseCSSPrefix + 'noborder-b',
        // 0010 = 2
        Ext.baseCSSPrefix + 'noborder-bl',
        // 0011 = 3
        Ext.baseCSSPrefix + 'noborder-r',
        // 0100 = 4
        Ext.baseCSSPrefix + 'noborder-rl',
        // 0101 = 5
        Ext.baseCSSPrefix + 'noborder-rb',
        // 0110 = 6
        Ext.baseCSSPrefix + 'noborder-rbl',
        // 0111 = 7
        Ext.baseCSSPrefix + 'noborder-t',
        // 1000 = 8
        Ext.baseCSSPrefix + 'noborder-tl',
        // 1001 = 9
        Ext.baseCSSPrefix + 'noborder-tb',
        // 1010 = 10
        Ext.baseCSSPrefix + 'noborder-tbl',
        // 1011 = 11
        Ext.baseCSSPrefix + 'noborder-tr',
        // 1100 = 12
        Ext.baseCSSPrefix + 'noborder-trl',
        // 1101 = 13
        Ext.baseCSSPrefix + 'noborder-trb',
        // 1110 = 14
        Ext.baseCSSPrefix + 'noborder-trbl'
    ],
    // 1111 = 15
    /**
     * The numeric values assigned to each edge indexed by the `dock` config value.
     * @private
     */
    edgeMasks: {
        top: 8,
        right: 4,
        bottom: 2,
        left: 1
    },
    handleItemBorders: function() {
        var me = this,
            edges = 0,
            maskT = 8,
            maskR = 4,
            maskB = 2,
            maskL = 1,
            owner = me.owner,
            bodyBorder = owner.bodyBorder,
            ownerBorder = owner.border,
            collapsed = me.collapsed,
            edgeMasks = me.edgeMasks,
            noBorderCls = me.noBorderClassTable,
            dockedItemsGen = owner.dockedItems.generation,
            b, borderCls, docked, edgesTouched, i, ln, item, dock, lastValue, mask, addCls, removeCls;
        if (me.initializedBorders === dockedItemsGen) {
            return;
        }
        addCls = [];
        removeCls = [];
        borderCls = me.getBorderCollapseTable();
        noBorderCls = me.getBorderClassTable ? me.getBorderClassTable() : noBorderCls;
        me.initializedBorders = dockedItemsGen;
        // Borders have to be calculated using expanded docked item collection.
        me.collapsed = false;
        docked = me.getDockedItems();
        me.collapsed = collapsed;
        for (i = 0 , ln = docked.length; i < ln; i++) {
            item = docked[i];
            if (item.ignoreBorderManagement) {
                // headers in framed panels ignore border management, so we do not want
                // to set "satisfied" on the edge in question

                continue;
            }
            dock = item.dock;
            mask = edgesTouched = 0;
            addCls.length = 0;
            removeCls.length = 0;
            if (dock !== 'bottom') {
                if (edges & maskT) {
                    // if (not touching the top edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskT;
                    }
                }
                if (b === false) {
                    mask += maskT;
                }
            }
            if (dock !== 'left') {
                if (edges & maskR) {
                    // if (not touching the right edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskR;
                    }
                }
                if (b === false) {
                    mask += maskR;
                }
            }
            if (dock !== 'top') {
                if (edges & maskB) {
                    // if (not touching the bottom edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskB;
                    }
                }
                if (b === false) {
                    mask += maskB;
                }
            }
            if (dock !== 'right') {
                if (edges & maskL) {
                    // if (not touching the left edge)
                    b = item.border;
                } else {
                    b = ownerBorder;
                    if (b !== false) {
                        edgesTouched += maskL;
                    }
                }
                if (b === false) {
                    mask += maskL;
                }
            }
            if ((lastValue = item.lastBorderMask) !== mask) {
                item.lastBorderMask = mask;
                if (lastValue) {
                    removeCls[0] = noBorderCls[lastValue];
                }
                if (mask) {
                    addCls[0] = noBorderCls[mask];
                }
            }
            if ((lastValue = item.lastBorderCollapse) !== edgesTouched) {
                item.lastBorderCollapse = edgesTouched;
                if (lastValue) {
                    removeCls[removeCls.length] = borderCls[lastValue];
                }
                if (edgesTouched) {
                    addCls[addCls.length] = borderCls[edgesTouched];
                }
            }
            if (removeCls.length) {
                item.removeCls(removeCls);
            }
            if (addCls.length) {
                item.addCls(addCls);
            }
            // mask can use += but edges must use |= because there can be multiple items
            // on an edge but the mask is reset per item
            edges |= edgeMasks[dock];
        }
        // = T, R, B or L (8, 4, 2 or 1)
        mask = edgesTouched = 0;
        addCls.length = 0;
        removeCls.length = 0;
        if (edges & maskT) {
            // if (not touching the top edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskT;
            }
        }
        if (b === false) {
            mask += maskT;
        }
        if (edges & maskR) {
            // if (not touching the right edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskR;
            }
        }
        if (b === false) {
            mask += maskR;
        }
        if (edges & maskB) {
            // if (not touching the bottom edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskB;
            }
        }
        if (b === false) {
            mask += maskB;
        }
        if (edges & maskL) {
            // if (not touching the left edge)
            b = bodyBorder;
        } else {
            b = ownerBorder;
            if (b !== false) {
                edgesTouched += maskL;
            }
        }
        if (b === false) {
            mask += maskL;
        }
        if ((lastValue = me.lastBodyBorderMask) !== mask) {
            me.lastBodyBorderMask = mask;
            if (lastValue) {
                removeCls[0] = noBorderCls[lastValue];
            }
            if (mask) {
                addCls[0] = noBorderCls[mask];
            }
        }
        if ((lastValue = me.lastBodyBorderCollapse) !== edgesTouched) {
            me.lastBodyBorderCollapse = edgesTouched;
            if (lastValue) {
                removeCls[removeCls.length] = borderCls[lastValue];
            }
            if (edgesTouched) {
                addCls[addCls.length] = borderCls[edgesTouched];
            }
        }
        if (removeCls.length) {
            owner.removeBodyCls(removeCls);
        }
        if (addCls.length) {
            owner.addBodyCls(addCls);
        }
    },
    onRemove: function(item) {
        var lastBorderMask = item.lastBorderMask;
        if (!item.isDestroyed && !item.ignoreBorderManagement && lastBorderMask) {
            item.lastBorderMask = 0;
            item.removeCls(this.noBorderClassTable[lastBorderMask]);
        }
        this.callParent([
            item
        ]);
    }
});

Ext.define('ExtThemeNeptune.panel.Panel', {
    override: 'Ext.panel.Panel',
    border: false,
    bodyBorder: false,
    initBorderProps: Ext.emptyFn,
    initBodyBorder: function() {
        // The superclass method converts a truthy bodyBorder into a number and sets
        // an inline border-width style on the body element.  This prevents that from
        // happening if borderBody === true so that the body will get its border-width
        // the stylesheet.
        if (this.bodyBorder !== true) {
            this.callParent();
        }
    }
});

/** */
Ext.define('Ext.aria.panel.Panel', {
    override: 'Ext.panel.Panel',
    closeText: 'Close Panel',
    collapseText: 'Collapse Panel',
    expandText: 'Expand Panel',
    untitledText: 'Untitled Panel',
    onBoxReady: function() {
        var me = this,
            Event = Ext.event.Event,
            collapseTool = me.collapseTool,
            header, tools, i, len;
        me.callParent();
        if (collapseTool) {
            collapseTool.ariaUpdate({
                'aria-label': me.collapsed ? me.expandText : me.collapseText
            });
            collapseTool.ariaAddKeyMap({
                key: [
                    Event.ENTER,
                    Event.SPACE
                ],
                handler: me.toggleCollapse,
                scope: me
            });
        }
        if (me.closable) {
            toolBtn = me.down('tool[type=close]');
            if (toolBtn) {
                toolBtn.ariaUpdate({
                    'aria-label': me.closeText
                });
                toolBtn.ariaAddKeyMap({
                    key: [
                        Event.ENTER,
                        Event.SPACE
                    ],
                    handler: me.close,
                    scope: me
                });
            }
        }
        header = me.getHeader();
    },
    setTitle: function(newTitle) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-label': newTitle
        });
    },
    createReExpander: function(direction, defaults) {
        var me = this,
            Event = Ext.event.Event,
            opposite, result, tool;
        opposite = me.getOppositeDirection(direction);
        result = me.callParent(arguments);
        tool = result.down('tool[type=expand-' + opposite + ']');
        if (tool) {
            tool.on('boxready', function() {
                tool.ariaUpdate({
                    'aria-label': me.collapsed ? me.expandText : me.collapseText
                });
                tool.ariaAddKeyMap({
                    key: [
                        Event.ENTER,
                        Event.SPACE
                    ],
                    handler: me.toggleCollapse,
                    scope: me
                });
            }, {
                single: true
            });
        }
        return result;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.collapsible) {
            attrs['aria-expanded'] = !me.collapsed;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            newAttrs = {},
            attrs, toolBtn, textEl;
        attrs = me.callParent(arguments);
        if (me.ariaRole === 'presentation') {
            return attrs;
        }
        if (me.title) {
            textEl = me.ariaGetTitleTextEl();
            if (textEl) {
                newAttrs = {
                    'aria-labelledby': textEl.id
                };
            } else {
                newAttrs = {
                    'aria-label': me.title
                };
            }
        } else if (me.ariaLabel) {
            newAttrs = {
                'aria-label': me.ariaLabel
            };
        }
        Ext.apply(attrs, newAttrs);
        return attrs;
    },
    ariaGetTitleTextEl: function() {
        var header = this.header;
        return header && header.titleCmp && header.titleCmp.textEl || null;
    },
    afterExpand: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': true
        });
        if (me.collapseTool) {
            me.ariaUpdate(me.collapseTool.getEl(), {
                'aria-label': me.collapseText
            });
        }
    },
    afterCollapse: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': false
        });
        if (me.collapseTool) {
            me.ariaUpdate(me.collapseTool.getEl(), {
                'aria-label': me.expandText
            });
        }
    }
});

Ext.define('ExtThemeNeptune.container.ButtonGroup', {
    override: 'Ext.container.ButtonGroup',
    usePlainButtons: false
});

/** */
Ext.define('Ext.aria.container.Viewport', {
    override: 'Ext.container.Viewport',
    initComponent: function() {
        var me = this,
            items = me.items,
            layout = me.layout,
            i, len, item, el;
        if (items && layout === 'border' || (Ext.isObject(layout) && layout.type === 'border')) {
            for (i = 0 , len = items.length; i < len; i++) {
                item = items[i];
                if (item.region) {
                    Ext.applyIf(item, {
                        ariaRole: 'region',
                        headerRole: 'heading'
                    });
                }
            }
        }
        me.callParent();
    },
    ariaGetAfterRenderAttributes: function() {
        var attrs = this.callParent();
        // Viewport's role attribute is applied to the element that is never rendered,
        // so we have to do it post factum
        attrs.role = this.ariaRole;
        // Viewport should not have a label, document title should be announced instead
        delete attrs['aria-label'];
        delete attrs['aria-labelledby'];
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.window.Window', {
    override: 'Ext.window.Window',
    requires: [
        'Ext.aria.panel.Panel',
        'Ext.util.ComponentDragger',
        'Ext.util.Region',
        'Ext.EventManager',
        'Ext.aria.FocusManager'
    ],
    closeText: 'Close Window',
    moveText: 'Move Window',
    resizeText: 'Resize Window',
    deltaMove: 10,
    deltaResize: 10,
    initComponent: function() {
        var me = this,
            tools = me.tools;
        // Add buttons to move and resize the window,
        // unless it's a Toast
        if (!tools) {
            me.tools = tools = [];
        }
        //TODO: Create new tools
        if (!me.isToast) {
            tools.unshift({
                type: 'resize',
                tooltip: me.resizeText
            }, {
                type: 'move',
                tooltip: me.moveText
            });
        }
        me.callParent();
    },
    onBoxReady: function() {
        var me = this,
            EO = Ext.event.Event,
            toolBtn;
        me.callParent();
        if (me.isToast) {
            return;
        }
        if (me.draggable) {
            toolBtn = me.down('tool[type=move]');
            if (toolBtn) {
                me.ariaUpdate(toolBtn.getEl(), {
                    'aria-label': me.moveText
                });
                toolBtn.keyMap = new Ext.util.KeyMap({
                    target: toolBtn.el,
                    key: [
                        EO.UP,
                        EO.DOWN,
                        EO.LEFT,
                        EO.RIGHT
                    ],
                    handler: me.moveWindow,
                    scope: me
                });
            }
        }
        if (me.resizable) {
            toolBtn = me.down('tool[type=resize]');
            if (toolBtn) {
                me.ariaUpdate(toolBtn.getEl(), {
                    'aria-label': me.resizeText
                });
                toolBtn.keyMap = new Ext.util.KeyMap({
                    target: toolBtn.el,
                    key: [
                        EO.UP,
                        EO.DOWN,
                        EO.LEFT,
                        EO.RIGHT
                    ],
                    handler: me.resizeWindow,
                    scope: me
                });
            }
        }
    },
    onEsc: function(k, e) {
        var me = this;
        if (e.within(me.el)) {
            e.stopEvent();
            me.close();
        }
    },
    onShow: function() {
        var me = this;
        me.callParent(arguments);
        Ext.aria.FocusManager.addWindow(me);
    },
    afterHide: function() {
        var me = this;
        Ext.aria.FocusManager.removeWindow(me);
        me.callParent(arguments);
    },
    moveWindow: function(keyCode, e) {
        var me = this,
            delta = me.deltaMove,
            pos = me.getPosition(),
            EO = Ext.event.Event;
        switch (keyCode) {
            case EO.RIGHT:
                pos[0] += delta;
                break;
            case EO.LEFT:
                pos[0] -= delta;
                break;
            case EO.UP:
                pos[1] -= delta;
                break;
            case EO.DOWN:
                pos[1] += delta;
                break;
        }
        me.setPagePosition(pos);
        e.stopEvent();
    },
    resizeWindow: function(keyCode, e) {
        var me = this,
            delta = me.deltaResize,
            width = me.getWidth(),
            height = me.getHeight(),
            EO = Ext.event.Event;
        switch (keyCode) {
            case EO.RIGHT:
                width += delta;
                break;
            case EO.LEFT:
                width -= delta;
                break;
            case EO.UP:
                height -= delta;
                break;
            case EO.DOWN:
                height += delta;
                break;
        }
        me.setSize(width, height);
        e.stopEvent();
    }
});

/** */
Ext.define('Ext.aria.form.field.Base', {
    override: 'Ext.form.field.Base',
    requires: [
        'Ext.util.Format',
        'Ext.aria.Component'
    ],
    /**
     * @cfg {String} formatText The text to use for the field format announcement
     * placed in the `title` attribute of the input field. This format will not
     * be used if the title attribute is configured explicitly.
     */
    ariaRenderAttributesToElement: false,
    msgTarget: 'side',
    // use this scheme because it is the only one working for now
    getSubTplData: function() {
        var me = this,
            fmt = Ext.util.Format.attributes,
            data, attrs;
        data = me.callParent(arguments);
        attrs = me.ariaGetRenderAttributes();
        // Role is rendered separately
        delete attrs.role;
        data.inputAttrTpl = [
            data.inputAttrTpl,
            fmt(attrs)
        ].join(' ');
        return data;
    },
    ariaGetEl: function() {
        return this.inputEl;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            readOnly = me.readOnly,
            formatText = me.formatText,
            attrs;
        attrs = me.callParent();
        if (readOnly != null) {
            attrs['aria-readonly'] = !!readOnly;
        }
        if (formatText && !attrs.title) {
            attrs.title = Ext.String.format(formatText, me.format);
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            labelEl = me.labelEl,
            attrs;
        attrs = me.callParent();
        if (labelEl) {
            attrs['aria-labelledby'] = labelEl.id;
        }
        return attrs;
    },
    setReadOnly: function(readOnly) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': readOnly
        });
    },
    markInvalid: function(f, isValid) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': true
        });
    },
    clearInvalid: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': false
        });
    }
});

/** */
Ext.define('Ext.aria.form.field.Text', {
    override: 'Ext.form.field.Text',
    requires: [
        'Ext.aria.form.field.Base'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.allowBlank !== undefined) {
            attrs['aria-required'] = !me.allowBlank;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.form.field.TextArea', {
    override: 'Ext.form.field.TextArea',
    requires: [
        'Ext.aria.form.field.Text'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-multiline'] = true;
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.window.MessageBox', {
    override: 'Ext.window.MessageBox',
    requires: [
        'Ext.aria.window.Window',
        'Ext.aria.form.field.Text',
        'Ext.aria.form.field.TextArea',
        'Ext.aria.form.field.Display',
        'Ext.aria.button.Button'
    ]
});

/** */
Ext.define('Ext.aria.form.FieldContainer', {
    override: 'Ext.form.FieldContainer',
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        if (me.fieldLabel && me.labelEl) {
            attrs['aria-labelledby'] = me.labelEl.id;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.form.field.Checkbox', {
    override: 'Ext.form.field.Checkbox',
    requires: [
        'Ext.aria.form.field.Base'
    ],
    /**
     * @cfg {Boolean} [required=false] Set to `true` to make screen readers announce this
     * checkbox as required. Note that no field validation is performed, and this option
     * only affects ARIA attributes set for this field.
     */
    isFieldLabelable: false,
    hideLabel: true,
    ariaGetEl: function() {
        return this.inputEl;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        attrs['aria-checked'] = me.getValue();
        if (me.required) {
            attrs['aria-required'] = true;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            boxLabelEl = me.boxLabelEl,
            attrs;
        attrs = me.callParent();
        if (me.boxLabel && !me.fieldLabel && boxLabelEl) {
            attrs['aria-labelledby'] = boxLabelEl.id;
        }
        return attrs;
    },
    onChange: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-checked': me.getValue()
        });
    }
});

/** */
Ext.define('Ext.aria.form.CheckboxGroup', {
    override: 'Ext.form.CheckboxGroup',
    requires: [
        'Ext.aria.form.FieldContainer',
        'Ext.aria.form.field.Base'
    ],
    msgTarget: 'side',
    setReadOnly: function(readOnly) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': !!readOnly
        });
    },
    markInvalid: function(f, isValid) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': !!isValid
        });
    },
    clearInvalid: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-invalid': false
        });
    }
});

/** */
Ext.define('Ext.aria.form.FieldSet', {
    override: 'Ext.form.FieldSet',
    expandText: 'Expand',
    collapseText: 'Collapse',
    onBoxReady: function() {
        var me = this,
            checkboxCmp = me.checkboxCmp,
            toggleCmp = me.toggleCmp,
            legend = me.legend,
            el;
        me.callParent(arguments);
        if (!legend) {
            return;
        }
        // mark the legend and the checkbox or drop down inside the legend immune to collapse
        // so when they get focus, isVisible(deep) will not return true for them when the fieldset is collapsed
        legend.collapseImmune = true;
        legend.getInherited().collapseImmune = true;
        if (checkboxCmp) {
            checkboxCmp.collapseImmune = true;
            checkboxCmp.getInherited().collapseImmune = true;
            checkboxCmp.getActionEl().set({
                title: me.expandText + ' ' + me.title
            });
        }
        if (toggleCmp) {
            toggleCmp.collapseImmune = true;
            toggleCmp.getInherited().collapseImmune = true;
            // The toggle component is missing a key map to respond to enter and space
            toggleCmp.keyMap = new Ext.util.KeyMap({
                target: toggleCmp.el,
                key: [
                    Ext.event.Event.ENTER,
                    Ext.event.Event.SPACE
                ],
                handler: function(key, e, eOpt) {
                    e.stopEvent();
                    me.toggle();
                },
                scope: me
            });
            el = toggleCmp.getActionEl();
            if (me.collapsed) {
                el.set({
                    title: me.expandText + ' ' + me.title
                });
            } else {
                el.set({
                    title: me.collapseText + ' ' + me.title
                });
            }
        }
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        attrs['aria-expanded'] = !me.collapsed;
        return attrs;
    },
    setExpanded: function(expanded) {
        var me = this,
            toggleCmp = me.toggleCmp,
            el;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': expanded
        });
        // Update the title
        if (toggleCmp) {
            el = toggleCmp.getActionEl();
            if (!expanded) {
                el.set({
                    title: me.expandText + ' ' + me.title
                });
            } else {
                el.set({
                    title: me.collapseText + ' ' + me.title
                });
            }
        }
    }
});

/** */
Ext.define('Ext.aria.form.RadioGroup', {
    override: 'Ext.form.RadioGroup',
    requires: [
        'Ext.aria.form.CheckboxGroup'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.allowBlank !== undefined) {
            attrs['aria-required'] = !me.allowBlank;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.labelEl) {
            attrs['aria-labelledby'] = me.labelEl.id;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.form.field.Picker', {
    override: 'Ext.form.field.Picker',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-haspopup'] = true;
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs, picker;
        attrs = me.callParent();
        picker = me.getPicker();
        if (picker) {
            attrs['aria-owns'] = picker.id;
        }
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.view.View', {
    override: 'Ext.view.View',
    initComponent: function() {
        var me = this,
            selModel;
        me.callParent();
        selModel = me.getSelectionModel();
        selModel.on({
            scope: me,
            select: me.ariaSelect,
            deselect: me.ariaDeselect
        });
        me.on({
            scope: me,
            refresh: me.ariaInitViewItems,
            itemadd: me.ariaItemAdd,
            itemremove: me.ariaItemRemove
        });
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs, mode;
        attrs = me.callParent();
        mode = me.getSelectionModel().getSelectionMode();
        if (mode !== 'SINGLE') {
            attrs['aria-multiselectable'] = true;
        }
        if (me.title) {
            attrs['aria-label'] = me.title;
        }
        return attrs;
    },
    // For Views, we have to apply ARIA attributes to the list items
    // post factum, because we have no control over the template
    // that is used to create the items.
    ariaInitViewItems: function() {
        var me = this,
            updateSize = me.pageSize || me.store.buffered,
            pos = me.store.requestStart + 1,
            nodes, node, size, i, len;
        nodes = me.getNodes();
        size = me.store.getTotalCount();
        for (i = 0 , len = nodes.length; i < len; i++) {
            node = nodes[i];
            if (!node.id) {
                node.setAttribute('id', Ext.id());
            }
            node.setAttribute('role', me.itemAriaRole);
            node.setAttribute('aria-selected', false);
            if (updateSize) {
                node.setAttribute('aria-setsize', size);
                node.setAttribute('aria-posinset', pos + i);
            }
        }
    },
    ariaSelect: function(selModel, record) {
        var me = this,
            node;
        node = me.getNode(record);
        if (node) {
            node.setAttribute('aria-selected', true);
            me.ariaUpdate({
                'aria-activedescendant': node.id
            });
        }
    },
    ariaDeselect: function(selModel, record) {
        var me = this,
            node;
        node = me.getNode(record);
        if (node) {
            node.removeAttribute('aria-selected');
            me.ariaUpdate({
                'aria-activedescendant': undefined
            });
        }
    },
    ariaItemRemove: function(records, index, nodes) {
        if (!nodes) {
            return;
        }
        var me = this,
            ariaSelected, i, len;
        ariaSelected = me.el.getAttribute('aria-activedescendant');
        for (i = 0 , len = nodes.length; i < len; i++) {
            if (ariaSelected === nodes[i].id) {
                me.ariaUpdate({
                    'aria-activedescendant': undefined
                });
                break;
            }
        }
    },
    ariaItemAdd: function(records, index, nodes) {
        this.ariaInitViewItems(records, index, nodes);
    },
    setTitle: function(title) {
        var me = this;
        me.title = title;
        me.ariaUpdate({
            'aria-label': title
        });
    }
});

/** */
Ext.define('Ext.aria.view.BoundListKeyNav', {
    override: 'Ext.view.BoundListKeyNav',
    requires: [
        'Ext.aria.view.View'
    ],
    focusItem: function(item) {
        var me = this,
            boundList = me.view;
        if (typeof item === 'number') {
            item = boundList.all.item(item);
        }
        if (item) {
            boundList.ariaUpdate({
                'aria-activedescendant': Ext.id(item, me.id + '-')
            });
            me.callParent([
                item
            ]);
        }
    }
});

/** */
Ext.define('Ext.aria.form.field.Number', {
    override: 'Ext.form.field.Number',
    ariaGetRenderAttributes: function() {
        var me = this,
            min = me.minValue,
            max = me.maxValue,
            attrs, v;
        attrs = me.callParent(arguments);
        v = me.getValue();
        // Skip the defaults
        if (min !== Number.NEGATIVE_INFINITY) {
            attrs['aria-valuemin'] = isFinite(min) ? min : 'NaN';
        }
        if (max !== Number.MAX_VALUE) {
            attrs['aria-valuemax'] = isFinite(max) ? max : 'NaN';
        }
        attrs['aria-valuenow'] = v !== null && isFinite(v) ? v : 'NaN';
        return attrs;
    },
    onChange: function(f) {
        var me = this,
            v;
        me.callParent(arguments);
        v = me.getValue();
        me.ariaUpdate({
            'aria-valuenow': v !== null && isFinite(v) ? v : 'NaN'
        });
    },
    setMinValue: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-valuemin': isFinite(me.minValue) ? me.minValue : 'NaN'
        });
    },
    setMaxValue: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-valuemax': isFinite(me.maxValue) ? me.maxValue : 'NaN'
        });
    }
});

Ext.define('ExtThemeNeptune.toolbar.Paging', {
    override: 'Ext.toolbar.Paging',
    defaultButtonUI: 'plain-toolbar',
    inputItemWidth: 40
});

/** */
Ext.define('Ext.aria.view.BoundList', {
    override: 'Ext.view.BoundList',
    onHide: function() {
        this.ariaUpdate({
            "aria-activedescendant": Ext.emptyString
        });
        // Maintainer: onHide takes arguments
        this.callParent(arguments);
    }
});

/** */
Ext.define('Ext.aria.form.field.ComboBox', {
    override: 'Ext.form.field.ComboBox',
    requires: [
        'Ext.aria.form.field.Picker'
    ],
    createPicker: function() {
        var me = this,
            picker;
        picker = me.callParent(arguments);
        if (picker) {
            // update aria-activedescendant whenever the picker highlight changes
            me.mon(picker, {
                highlightitem: me.ariaUpdateActiveDescendant,
                scope: me
            });
        }
        return picker;
    },
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-readonly'] = !!(!me.editable || me.readOnly);
        attrs['aria-expanded'] = !!me.isExpanded;
        attrs['aria-autocomplete'] = "list";
        return attrs;
    },
    setReadOnly: function(readOnly) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': me.readOnly
        });
    },
    setEditable: function(editable) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-readonly': !me.editable
        });
    },
    onExpand: function() {
        var me = this,
            selected = me.picker.getSelectedNodes();
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': true,
            'aria-activedescendant': (selected.length ? selected[0].id : undefined)
        });
    },
    onCollapse: function() {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-expanded': false,
            'aria-activedescendant': undefined
        });
    },
    ariaUpdateActiveDescendant: function(list) {
        this.ariaUpdate({
            'aria-activedescendant': list.highlightedItem ? list.highlightedItem.id : undefined
        });
    }
});

Ext.define('ExtThemeNeptune.picker.Month', {
    override: 'Ext.picker.Month',
    // Monthpicker contains logic that reduces the margins of the month items if it detects
    // that the text has wrapped.  This can happen in the classic theme  in certain
    // locales such as zh_TW.  In order to work around this, Month picker measures
    // the month items to see if the height is greater than "measureMaxHeight".
    // In neptune the height of the items is larger, so we must increase this value.
    // While the actual height of the month items in neptune is 24px, we will only 
    // determine that the text has wrapped if the height of the item exceeds 36px.
    // this allows theme developers some leeway to increase the month item size in
    // a neptune-derived theme.
    measureMaxHeight: 36
});

/** */
Ext.define('Ext.aria.form.field.Date', {
    override: 'Ext.form.field.Date',
    requires: [
        'Ext.aria.form.field.Picker'
    ],
    formatText: 'Expected date format {0}',
    /**
     * @private
     * Override because we do not want to focus the field if the collapse
     * was because of a tab key. Tab should move the focus to the next field.
     * Before collapsing the field will set doCancelFieldFocus based on the pressed key
     */
    onCollapse: function() {
        var me = this;
        if (!me.doCancelFieldFocus) {
            me.focus(false, 60);
        }
    }
});

/** */
Ext.define('Ext.aria.form.field.Display', {
    override: 'Ext.form.field.Display',
    requires: [
        'Ext.aria.form.field.Base'
    ],
    msgTarget: 'none',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-readonly'] = true;
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.tip.QuickTip', {
    override: 'Ext.tip.QuickTip',
    showByTarget: function(targetEl) {
        var me = this,
            target, size, xy, x, y;
        target = me.targets[targetEl.id];
        if (!target) {
            return;
        }
        me.activeTarget = target;
        me.activeTarget.el = Ext.get(targetEl).dom;
        me.anchor = me.activeTarget.anchor;
        size = targetEl.getSize();
        xy = targetEl.getXY();
        me.showAt([
            xy[0],
            xy[1] + size.height
        ]);
    }
});

/** */
Ext.define('Ext.aria.picker.Color', {
    override: 'Ext.picker.Color',
    requires: [
        'Ext.aria.Component'
    ],
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
    },
    //\\ TODO: set up KeyNav
    ariaGetEl: function() {
        return this.innerEl;
    },
    onColorSelect: function(picker, cell) {
        var me = this;
        if (cell && cell.dom) {
            me.ariaUpdate(me.eventEl, {
                'aria-activedescendant': cell.dom.id
            });
        }
    },
    privates: {
        getFocusEl: function() {
            return this.el;
        }
    }
});

Ext.define('ExtThemeNeptune.form.field.HtmlEditor', {
    override: 'Ext.form.field.HtmlEditor',
    defaultButtonUI: 'plain-toolbar'
});

/** */
Ext.define('Ext.aria.form.field.Time', {
    override: 'Ext.form.field.Time',
    requires: [
        'Ext.aria.form.field.ComboBox'
    ],
    // The default format for the time field is 'g:i A',
    // which is hardly informative
    formatText: 'Expected time format HH:MM AM or PM'
});

Ext.define('ExtThemeNeptune.panel.Table', {
    override: 'Ext.panel.Table',
    initComponent: function() {
        var me = this;
        if (!me.hasOwnProperty('bodyBorder') && !me.hideHeaders) {
            me.bodyBorder = true;
        }
        me.callParent();
    }
});

/** */
Ext.define('Ext.aria.grid.NavigationModel', {
    override: 'Ext.grid.NavigationModel',
    // WAI-ARIA recommends no wrapping around row ends in navigation mode
    preventWrap: true
});

/** */
Ext.define('Ext.aria.view.Table', {
    override: 'Ext.view.Table',
    requires: [
        'Ext.aria.view.View'
    ],
    ariaGetRenderAttributes: function() {
        var me = this,
            plugins = me.plugins,
            readOnly = true,
            attrs, i, len;
        attrs = me.callParent();
        if (plugins) {
            for (i = 0 , len = plugins.length; i < len; i++) {
                // Both CellEditor and RowEditor have 'editing' property
                if ('editing' in plugins[i]) {
                    readOnly = false;
                    break;
                }
            }
        }
        attrs['aria-readonly'] = readOnly;
        return attrs;
    },
    // Table Views are rendered from templates that are rarely overridden,
    // so we can render ARIA attributes in the templates instead of applying
    // them after the fact.
    ariaItemAdd: Ext.emptyFn,
    ariaItemRemove: Ext.emptyFn,
    ariaInitViewItems: Ext.emptyFn,
    ariaFindNode: function(selModel, record, row, column) {
        var me = this,
            node;
        if (selModel.isCellModel) {
            // When column is hidden, its index will be -1
            if (column > -1) {
                node = me.getCellByPosition({
                    row: row,
                    column: column
                });
            } else {
                node = me.getCellByPosition({
                    row: row,
                    column: 0
                });
            }
        } else {
            node = Ext.fly(me.getNode(record));
        }
        return node;
    },
    ariaSelect: function(selModel, record, row, column) {
        var me = this,
            node;
        node = me.ariaFindNode(selModel, record, row, column);
        if (node) {
            node.set({
                'aria-selected': true
            });
            me.ariaUpdate({
                'aria-activedescendant': node.id
            });
        }
    },
    ariaDeselect: function(selModel, record, row, column) {
        var me = this,
            node;
        node = me.ariaFindNode(selModel, record, row, column);
        if (node) {
            node.set({
                'aria-selected': undefined
            });
            me.ariaUpdate({
                'aria-activedescendant': undefined
            });
        }
    },
    renderRow: function(record, rowIdx, out) {
        var me = this,
            rowValues = me.rowValues;
        rowValues.ariaRowAttr = 'role="row"';
        return me.callParent(arguments);
    },
    renderCell: function(column, record, recordIndex, rowIndex, columnIndex, out) {
        var me = this,
            cellValues = me.cellValues;
        cellValues.ariaCellAttr = 'role="gridcell"';
        cellValues.ariaCellInnerAttr = '';
        return me.callParent(arguments);
    },
    collectData: function(records, startIndex) {
        var me = this,
            data;
        data = me.callParent(arguments);
        Ext.applyIf(data, {
            ariaTableAttr: 'role="presentation"',
            ariaTbodyAttr: 'role="rowgroup"'
        });
        return data;
    }
});

Ext.define('ExtThemeNeptune.grid.RowEditor', {
    override: 'Ext.grid.RowEditor',
    buttonUI: 'default-toolbar'
});

/** */
Ext.define('Ext.aria.grid.header.Container', {
    override: 'Ext.grid.header.Container',
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        delete attrs['aria-label'];
        return attrs;
    }
});

/** */
Ext.define('Ext.aria.grid.column.Column', {
    override: 'Ext.grid.column.Column',
    ariaSortStates: {
        ASC: 'ascending',
        DESC: 'descending'
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            sortState = me.sortState,
            states = me.ariaSortStates,
            attr;
        attr = me.callParent();
        attr['aria-sort'] = states[sortState];
        return attr;
    },
    setSortState: function(sorter) {
        var me = this,
            states = me.ariaSortStates,
            oldSortState = me.sortState,
            newSortState;
        me.callParent(arguments);
        newSortState = me.sortState;
        if (oldSortState !== newSortState) {
            me.ariaUpdate({
                'aria-sort': states[newSortState]
            });
        }
    }
});

Ext.define('ExtThemeNeptune.grid.column.RowNumberer', {
    override: 'Ext.grid.column.RowNumberer',
    width: 25
});

/** */
Ext.define('Ext.aria.menu.Item', {
    override: 'Ext.menu.Item',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        if (me.menu) {
            attrs['aria-haspopup'] = true;
        }
        return attrs;
    },
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            menu = me.menu,
            attrs;
        attrs = me.callParent();
        if (menu && menu.rendered) {
            attrs['aria-controls'] = menu.ariaGetEl().id;
        }
        if (me.plain) {
            attrs['aria-label'] = me.text;
        } else {
            attrs['aria-labelledby'] = me.textEl.id;
        }
        return attrs;
    },
    doExpandMenu: function() {
        var me = this,
            menu = me.menu;
        me.callParent();
        if (menu && menu.rendered) {
            me.ariaUpdate({
                'aria-controls': menu.ariaGetEl().id
            });
        }
    }
});

/** */
Ext.define('Ext.aria.menu.CheckItem', {
    override: 'Ext.menu.CheckItem',
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-checked'] = me.menu ? 'mixed' : !!me.checked;
        return attrs;
    },
    setChecked: function(checked, suppressEvents) {
        this.callParent([
            checked,
            suppressEvents
        ]);
        this.ariaUpdate({
            'aria-checked': checked
        });
    }
});

Ext.define('ExtThemeNeptune.menu.Separator', {
    override: 'Ext.menu.Separator',
    border: true
});

Ext.define('ExtThemeNeptune.menu.Menu', {
    override: 'Ext.menu.Menu',
    showSeparator: false
});

/** */
Ext.define('Ext.aria.slider.Thumb', {
    override: 'Ext.slider.Thumb',
    move: function(v, animate) {
        var me = this,
            el = me.el,
            slider = me.slider,
            styleProp = slider.vertical ? 'bottom' : slider.horizontalProp,
            to, from;
        v += '%';
        if (!animate) {
            el.dom.style[styleProp] = v;
            slider.fireEvent('move', slider, v, me);
        } else {
            to = {};
            to[styleProp] = v;
            if (!Ext.supports.GetPositionPercentage) {
                from = {};
                from[styleProp] = el.dom.style[styleProp];
            }
            new Ext.fx.Anim({
                target: el,
                duration: 350,
                from: from,
                to: to,
                callback: function() {
                    slider.fireEvent('move', slider, v, me);
                }
            });
        }
    }
});

/** */
Ext.define('Ext.aria.slider.Tip', {
    override: 'Ext.slider.Tip',
    init: function(slider) {
        var me = this,
            timeout = slider.tipHideTimeout;
        me.onSlide = Ext.Function.createThrottled(me.onSlide, 50, me);
        me.hide = Ext.Function.createBuffered(me.hide, timeout, me);
        me.callParent(arguments);
        slider.on({
            scope: me,
            change: me.onSlide,
            move: me.onSlide,
            changecomplete: me.hide
        });
    }
});

// There is no clear way to support multi-thumb sliders
// in accessible applications, so we default to support
// only single-slider ones
/** */
Ext.define('Ext.aria.slider.Multi', {
    override: 'Ext.slider.Multi',
    /**
     * @cfg {Number} [tipHideTimeout=1000] Timeout in ms after which
     * the slider tip will be hidden.
     */
    tipHideTimeout: 1000,
    animate: false,
    tabIndex: 0,
    ariaGetRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent();
        attrs['aria-minvalue'] = me.minValue;
        attrs['aria-maxvalue'] = me.maxValue;
        attrs['aria-valuenow'] = me.getValue(0);
        return attrs;
    },
    getSubTplData: function() {
        var me = this,
            fmt = Ext.util.Format.attributes,
            data, attrs;
        data = me.callParent(arguments);
        attrs = me.ariaGetRenderAttributes();
        // Role is rendered separately
        delete attrs.role;
        data.inputAttrTpl = fmt(attrs);
        return data;
    },
    onKeyDown: function(e) {
        var me = this,
            key, value;
        if (me.disabled || me.thumbs.length !== 1) {
            e.preventDefault();
            return;
        }
        key = e.getKey();
        switch (key) {
            case e.HOME:
                e.stopEvent();
                me.setValue(0, me.minValue, undefined, true);
                return;
            case e.END:
                e.stopEvent();
                me.setValue(0, me.maxValue, undefined, true);
                return;
            case e.PAGE_UP:
                e.stopEvent();
                value = me.getValue(0) - me.keyIncrement * 10;
                me.setValue(0, value, undefined, true);
                return;
            case e.PAGE_DOWN:
                e.stopEvent();
                value = me.getValue(0) + me.keyIncrement * 10;
                me.setValue(0, value, undefined, true);
                return;
        }
        me.callParent(arguments);
    },
    setMinValue: function(value) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-minvalue': value
        });
    },
    setMaxValue: function(value) {
        var me = this;
        me.callParent(arguments);
        me.ariaUpdate({
            'aria-maxvalue': value
        });
    },
    setValue: function(index, value) {
        var me = this;
        me.callParent(arguments);
        if (index === 0) {
            me.ariaUpdate({
                'aria-valuenow': value
            });
        }
    }
});

/** */
Ext.define('Ext.aria.tab.Tab', {
    override: 'Ext.tab.Tab',
    //<locale>
    closeText: 'closable',
    //</locale>
    ariaGetAfterRenderAttributes: function() {
        var me = this,
            attrs;
        attrs = me.callParent(arguments);
        attrs['aria-selected'] = !!me.active;
        if (me.card && me.card.getEl()) {
            attrs['aria-controls'] = me.card.getEl().id;
        }
        return attrs;
    },
    activate: function(suppressEvent) {
        this.callParent([
            suppressEvent
        ]);
        this.ariaUpdate({
            'aria-selected': true
        });
    },
    deactivate: function(suppressEvent) {
        this.callParent([
            suppressEvent
        ]);
        this.ariaUpdate({
            'aria-selected': false
        });
    }
});

/** */
Ext.define('Ext.aria.tab.Bar', {
    override: 'Ext.tab.Bar',
    requires: [
        'Ext.aria.tab.Tab'
    ],
    findNextActivatable: function(toClose) {
        var me = this,
            next;
        next = me.callParent(arguments);
        // If the default algorithm can't find the next tab to activate,
        // fall back to the currently active tab. We need to have a focused
        // tab at all times.
        if (!next) {
            next = me.activeTab;
        }
        return next;
    }
});

/** */
Ext.define('Ext.aria.tab.Panel', {
    override: 'Ext.tab.Panel',
    requires: [
        'Ext.layout.container.Card',
        'Ext.aria.tab.Bar'
    ],
    isTabPanel: true,
    onAdd: function(item, index) {
        item.ariaRole = 'tabpanel';
        this.callParent(arguments);
    },
    setActiveTab: function(card) {
        var me = this,
            items, item, isActive, i, len;
        me.callParent(arguments);
        items = me.getRefItems();
        for (i = 0 , len = items.length; i < len; i++) {
            item = items[i];
            if (item.ariaRole === 'tabpanel') {
                isActive = item === card;
                item.ariaUpdate({
                    'aria-expanded': isActive,
                    'aria-hidden': !isActive
                });
            }
        }
    },
    ariaIsOwnTab: function(cmp) {
        return cmp.isTab && cmp.isGroupedBy.ownerCt === this;
    }
});

/** */
Ext.define('Ext.aria.window.Toast', {
    override: 'Ext.window.Toast',
    initComponent: function() {
        // Close tool is not really helpful to blind users
        // when Toast window is set to auto-close on timeout
        if (this.autoClose) {
            this.closable = false;
        }
        this.callParent();
    }
});