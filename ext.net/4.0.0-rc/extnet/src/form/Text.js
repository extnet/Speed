// @source core/form/TextField.js

Ext.override(Ext.form.field.Text, {
    leftButtonsShowMode: "always",
    rightButtonsShowMode: "always",

    isIconIgnore: function () {
        return !!this.el.up(".x-menu-list-item");
    },

    initComponent: function () {
        this.setButtonsHiddenNonBuffered = this.setButtonsHidden;
        this.setButtonsHidden = Ext.Function.createBuffered(this.setButtonsHidden, 250, this);

        if (this.selectOnFocus) { // #890
            this.selectOnFocus = false;
            this.on("focus", this.selectOnFocusFix, null, { delay: 1 });
        }

        this.callParent(arguments);

        if (Ext.isNumeric(this.triggerIndexOnEnter) || this.triggerTagOnEnter) {
            this.on("specialkey", this.onSpecialKey);
        }
    },

    // #890
    selectOnFocusFix: function () {
        this.inputEl.dom.select();
    },

    onSpecialKey: function (field, e) {
        if (e.getKey() === e.ENTER) {
            var index = field.triggerIndexOnEnter,
                tag = field.triggerTagOnEnter,
                trigger = field.getTrigger(tag || index);

            if (trigger && trigger.isVisible()) {                        
                trigger.onClick(e, e);
            }
        }
    },

    getTrigger: function (id) {
        if (Ext.isNumeric(id)) {
            return this.orderedTriggers[id];
        }

        return this.getTriggers()[id];
    },

    toggleTrigger: function (index, state) {
        var trigger = this.getTrigger(index);

        if (!Ext.isBoolean(state)) {
            state = !trigger.isVisible();
        }

        trigger[state ? "show" : "hide"]();
    },

    onCustomTriggerClick: function (trigger, e) {
        if (!this.disabled) {
            var index = Ext.Array.indexOf(this.orderedTriggers, trigger);
            this.fireEvent("triggerclick", this, trigger, index, trigger.tag, e);
        }
    },

    //private
    renderIconEl: function () {
        var rtl = this.getInherited().rtl,
            renderTo = this.inputWrap || this.bodyEl;
        this.inputEl.addCls("x-textfield-icon-input");

        renderTo.setStyle("position", "relative");
        this.icon = Ext.core.DomHelper.append(renderTo, {
            tag: "div",
            style: "position:absolute;margin:0px;padding:0px;border:0px;top:0px;float:" + (rtl ? "right;" : "left;"),
            children: [{
                tag: "div",
                style: "position:absolute"
            }]
        }, true);

        this.icon = this.icon.first();

        this.icon.on("click", function (e, t) {
            this.fireEvent("iconclick", this, e, t);
        }, this);
    },

    setIconCls: function (cls) {
        if (this.isIconIgnore()) {
            return;
        }

        if (!this.icon) {
            this.renderIconEl();
        }

        if (Ext.isEmpty(cls)) {
            this.inputEl.removeCls("x-textfield-icon-input");
            this.inputEl.repaint();
            this.restoreIconCls = true;
            this.iconCls = "";
            this.icon.dom.className = "";
        } else {
            if (this.restoreIconCls) {
                delete this.restoreIconCls;
                this.inputEl.addCls("x-textfield-icon-input");
                this.inputEl.repaint();
            }

            cls = cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls;
            this.iconCls = cls;
            this.icon.dom.className = "x-textfield-icon " + cls;
        }
    },

    getErrors: function (value) {
        value = arguments.length ? (value == null ? '' : value) : this.processRawValue(this.getRawValue());

        var me = this,
            errors = Ext.form.field.Text.superclass.getErrors.apply(this, [value]),
            regex = me.regex,
            format = Ext.String.format,
            msg,
            trimmed, isBlank;        

        trimmed = me.allowOnlyWhitespace ? value : Ext.String.trim(value);

        if (trimmed.length < 1 || (value === me.emptyText && me.valueContainsPlaceholder)) {
            if (!me.allowBlank) {
                errors.push(me.blankText);
            }

            // If we are not configured to validate blank values, there cannot be any additional errors
            if (!me.validateBlank) {
                return errors;
            }
            isBlank = true;
        }

        // If a blank value has been allowed through, then exempt it dfrom the minLength check.
        // It must be allowed to hit the vtype validation.
        if (!isBlank && value.length < me.minLength) {
            errors.push(format(me.minLengthText, me.minLength));
        }

        if (value.length > me.maxLength) {
            errors.push(format(me.maxLengthText, me.maxLength));
        }

        if (regex && !regex.test(value)) {
            errors.push(me.regexText || me.invalidText);
        }

        return errors;
    },

    afterRender: function () {
        this.callParent(arguments);

        if (this.iconCls) {
            var iconCls = this.iconCls;
            delete this.iconCls;
            this.setIconCls(iconCls);
        }

        if (this.removeClearTrigger) {
            this.inputEl.addCls("x-clear-field");
        }

        if (this.removeShowPasswordTrigger) {
            this.inputEl.addCls("x-showpassword-field");
        }

        Ext.form.trigger.Trigger.prototype.removeBorderIfSimple.call(this, this);

        if (!this.isButtonsInit) { // Added because of #873
            this.initButtons();
        }
    },

    initButtons: function (updateLayout) {
        this.isButtonsInit = true;

        if (this.leftButtons) {
            this.leftButtons = this.initButtonsSide(this.leftButtons, "left");
        }

        if (this.rightButtons) {
            this.rightButtons = this.initButtonsSide(this.rightButtons, "right");
        }

        if (this.leftButtonsShowMode == "mouseover" || this.leftButtonsShowMode == "mouseovernonblank" || this.leftButtonsShowMode == "mouseoverorfocus" ||
            this.rightButtonsShowMode == "mouseover" || this.rightButtonsShowMode == "mouseovernonblank" || this.rightButtonsShowMode == "mouseoverorfocus") {

            this.bodyEl.on({
                mouseover: this.onMouseOver,
                mouseout: this.onMouseOut,
                scope: this
            });
        }

        if (updateLayout !== false && (this.leftButtons || this.rightButtons)) {
            this.updateLayout();
        }
    },

    isButtonsVisible: function (side) {
        var mode = this[side + "ButtonsShowMode"];
        switch (mode) {
            case "focus":
                return this.hasFocus;
            case "mouseover":
                return this.hasMouse;
            case "nonblank":
                return this.getRawValue().length > 0;
            case "mouseovernonblank":
                return this.hasMouse && this.getRawValue().length > 0;
            case "mouseoverorfocus":
                return this.hasMouse || this.hasFocus;
            case "always":
            default:
                return true;
        }
    },

    addButton: function (button, side, updateLayout) {
        var ct,
            ctRef,
            renderTo;

        side = side || "right";
        ctRef = side + "ButtonsCt";
        if (!Ext.isDefined(button.flat)) {
            button.flat = true;
        }
        button.height = this.inputEl.getHeight();

        if (this[side + "ButtonsShowMode"] != "always") {
            button.hidden = !this.isButtonsVisible(side);
        }

        ct = this[ctRef];
        if (!ct) {
            renderTo = this.inputWrap || this.bodyEl;
            this[ctRef] = Ext.core.DomHelper.append(renderTo, {
                tag: "div",
                cls: "x-form-text-default",
                style: "position:absolute;margin:0px;padding:0px;border:0px;top:0px;background-repeat: repeat-x;" + side + ": 0px;"
            }, true);
            ct = this[ctRef];

            renderTo.setStyle("position", "relative");
        }

        var btn = Ext.ComponentManager.create(button, "button");

        btn.field = this;
        btn.fieldSide = side;
        btn.ownerCt = this;

        btn.on("destroy", function (btn) {
            if (this.isDestroying) {
                return;
            }

            Ext.Array.remove(btn.fieldSide === "right" ? this.rightButtons : this.leftButtons, btn);
            Ext.defer(this.updateLayout, 1, this);
        }, this);

        btn.on({
            show: this.updateFieldPadding,
            hide: this.updateFieldPadding,
            resize: this.updateFieldPadding,
            scope: this
        });

        btn.render(ct, side == "right" ? ct.first() : undefined);

        if (updateLayout !== false) {
            this.updateLayout();
        }

        return btn;
    },

    removeButton: function (button) {
        button.destroy();
    },

    initButtonsSide: function (buttons, side) {
        var i,
            len;

        if (side == "right") {
            len = buttons.length;
            i = len - 1;
            for (; i >= 0; i--) {
                buttons[i] = this.addButton(buttons[i], side, false);
            }
        }
        else {
            for (i = 0, len = buttons.length; i < len; i++) {
                buttons[i] = this.addButton(buttons[i], side, false);
            }
        }

        return buttons;
    },

    destroy: function () {
        this.isDestroying = true;
        if (this.leftButtons) {
            Ext.each(this.leftButtons, function (btn) {
                if (btn.destroy) {
                    btn.destroy();
                }
            });
            delete this.leftButtons;
        }

        if (this.rightButtons) {
            Ext.each(this.rightButtons, function (btn) {
                if (btn.destroy) {
                    btn.destroy();
                }
            });
            delete this.rightButtons;
        }

        if (this.leftButtonsCt) {
            this.leftButtonsCt.destroy();
            this.leftButtonsCt = null;
        }

        if (this.rightButtonsCt) {
            this.rightButtonsCt.destroy();
            this.rightButtonsCt = null;
        }

        this.callParent(arguments);
    },

    setButtonsDisabled: function (disabled, side) {
        if (this.leftButtons && (!Ext.isDefined(side) || side == "left")) {
            Ext.each(this.leftButtons, function (btn) {
                if (btn.setDisabled) {
                    btn.setDisabled(disabled);
                } else {
                    btn.disabled = disabled;
                }
            });
        }

        if (this.rightButtons && (!Ext.isDefined(side) || side == "right")) {
            Ext.each(this.rightButtons, function (btn) {
                if (btn.setDisabled) {
                    btn.setDisabled(disabled);
                } else {
                    btn.disabled = disabled;
                }
            });
        }
    },

    setButtonsHidden: function (hidden, side) {
        var method = !hidden ? "show" : "hide";

        this.bulkButtonsUpdate = true;

        if (this.leftButtons && (!Ext.isDefined(side) || side.indexOf("left") > -1)) {
            Ext.each(this.leftButtons, function (btn) {
                if (!btn.hiddenPin) {
                    btn[method](false);
                }
            });
        }

        if (this.rightButtons && (!Ext.isDefined(side) || side.indexOf("right") > -1)) {
            Ext.each(this.rightButtons, function (btn) {
                if (!btn.hiddenPin) {
                    btn[method](false);
                }
            });
        }
        this.bulkButtonsUpdate = false;

        if (this.needUpdateAfterBulk) {
            delete this.needUpdateAfterBulk;
            this.updateFieldPadding();
        }
    },

    //private
    onDisable: function () {
        this.callParent();
        this.setButtonsDisabled(true);
    },

    //private
    onEnable: function () {
        this.callParent();
        this.setButtonsDisabled(false);
    },

    getButtonsSide: function (left, right) {
        var side = "";

        if (left) {
            side += "left";
        }

        if (right) {
            side += "right";
        }

        return side;
    },

    onFocus: function () {
        this.callParent(arguments);
        this.setButtonsHidden(false, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "focus" || this.leftButtonsShowMode == "mouseoverorfocus"),
                                                         this.rightButtons && (this.rightButtonsShowMode == "focus" || this.rightButtonsShowMode == "mouseoverorfocus")));
    },

    onFocusLeave: function () {
        this.callParent(arguments);
        this.setButtonsHidden(true, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "focus" || (this.leftButtonsShowMode == "mouseoverorfocus" && !this.hasMouse)),
                                                         this.rightButtons && (this.rightButtonsShowMode == "focus" || (this.rightButtonsShowMode == "mouseoverorfocus" && !this.hasMouse))));
    },

    onMouseOver: function () {
        this.hasMouse = true;
        this.setButtonsHidden(false, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "mouseover" || this.leftButtonsShowMode == "mouseoverorfocus" || (this.leftButtonsShowMode == "mouseovernonblank" && this.getRawValue().length > 0)),
                                                         this.rightButtons && (this.rightButtonsShowMode == "mouseover" || this.rightButtonsShowMode == "mouseoverorfocus" || (this.rightButtonsShowMode == "mouseovernonblank" && this.getRawValue().length > 0))));

    },

    onMouseOut: function () {
        this.hasMouse = false;
        this.setButtonsHidden(true, this.getButtonsSide(this.leftButtons && (this.leftButtonsShowMode == "mouseover" || (this.leftButtonsShowMode == "mouseoverorfocus" && !this.hasFocus) || this.leftButtonsShowMode == "mouseovernonblank"),
                                                        this.rightButtons && (this.rightButtonsShowMode == "mouseover" || (this.rightButtonsShowMode == "mouseoverorfocus" && !this.hasFocus) || this.rightButtonsShowMode == "mouseovernonblank")));

    },

    onChange: function () {
        var nonEmpty;

        this.callParent(arguments);

        if (this.leftButtons && (this.leftButtonsShowMode == "nonblank" || this.leftButtonsShowMode == "mouseovernonblank")) {
            nonEmpty = this.getRawValue().length > 0;

            if ((this.leftButtonsShowMode == "nonblank" && nonEmpty) ||
                (this.leftButtonsShowMode == "mouseovernonblank" && nonEmpty && this.hasMouse)) {
                this.setButtonsHiddenNonBuffered(false, "left");
            }
            else {
                this.setButtonsHiddenNonBuffered(true, "left");
            }
        }

        if (this.rightButtons && (this.rightButtonsShowMode == "nonblank" || this.rightButtonsShowMode == "mouseovernonblank")) {
            nonEmpty = this.getRawValue().length > 0;

            if ((this.rightButtonsShowMode == "nonblank" && nonEmpty) ||
                (this.rightButtonsShowMode == "mouseovernonblank" && nonEmpty && this.hasMouse)) {
                this.setButtonsHiddenNonBuffered(false, "right");
            }
            else {
                this.setButtonsHiddenNonBuffered(true, "right");
            }
        }
    },

    updateFieldPadding: function () {
        if (this.bulkButtonsUpdate) {
            this.needUpdateAfterBulk = true;
            return;
        }

        var field = this,
            pad,
            w,
            inputEl,
            inputElDom,
            updateValue,
            selectionStart,
            selectionEnd;

        if (field.leftButtons || field.rightButtons) {
            if (!field.isButtonsInit) {
                field.initButtons(false);
            }

            inputEl = field.inputEl;

            if (field.leftButtonsCt) {
                pad = inputEl.getPadding("l");
                w = field.leftButtonsCt.getWidth() + 3;

                if (pad != w) {
                    inputEl.setStyle("padding-left", w + "px");
                    updateValue = true;
                }
            }

            if (field.rightButtonsCt) {
                pad = inputEl.getPadding("r");
                w = field.rightButtonsCt.getWidth() + 3;

                if (pad != w) {
                    inputEl.setStyle("padding-right", w + "px");
                    updateValue = true;
                }
            }

            if (updateValue) {
                inputElDom = inputEl.dom;

                if (Ext.isIE) { // #884
                    selectionStart = inputElDom.selectionStart;
                    selectionEnd = inputElDom.selectionEnd;
                }

                inputElDom.value = inputElDom.value;

                if (Ext.isIE && inputElDom.setSelectionRange && field.hasFocus) { // #884, corrected in #1224
                    inputElDom.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }
    },

    updateLayout: function () {
        this.callParent(arguments);
        this.updateFieldPadding();
    }
});