Ext.net.FieldNote = {
    autoFitIndicator: true,
    useHiddenField: false,
    includeHiddenStateToSubmitData: true,
    submitEmptyHiddenState: true,
    overrideSubmiDataByHiddenState: false,
    isIndicatorActive: false,

    initHiddenFieldState: function () {
        this.initName();
        if (this.useHiddenField) {
            this.on("change", this.syncHiddenState, this);
        }
    },

    onFieldMutation: function () {
        this.callParent(arguments);

        if (this.useHiddenField) {
            this.syncHiddenState();
        }
    },

    syncHiddenState: function () {
        if (this.hiddenField) {
            var val = this.getHiddenState(this.getValue());

            this.hiddenField.dom.value = val !== null ? val : "";

            this.checkHiddenStateName();
        }
        else {
            this.hiddenValue = this.getHiddenState(this.getValue());
        }
    },

    initName: function () {
        if (!this.name) {
            this.name = this.id || this.getInputId();
        }
    },

    getHiddenStateName: function () {
        return "_" + this.getName() + "_state";
    },

    getSubmitData: function () {
        var me = this,
            data = null,
            val;

        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();

            if (val !== null) {
                data = {};

                data[me.getName()] = val;

                val = me.getHiddenState(val);
                if (this.useHiddenField && this.includeHiddenStateToSubmitData && val !== null) {
                    data[this.getHiddenStateName()] = val;
                }
            }
        }
        return data;
    },

    checkHiddenStateName: function () {
        if (this.hiddenField && this.submitEmptyHiddenState === false) {

            if (Ext.isEmpty(this.hiddenField.dom.value)) {
                this.hiddenField.dom.name = "";
                this.hiddenField.dom.removeAttribute("name");
            } else {
                this.hiddenField.set({ name: this.getHiddenStateName() });
            }
        }
    },

    getHiddenState: function (value) {
        return value;
    },

    clear: function () {
        this.setValue("");
    },

    beforeSubTpl: [
        '<tpl if="noteAlign==\'top\'">',
            '<div id="{id}-note" class="x-field-note {noteCls}">{noteHtml}</div>',
        '</tpl>',
    ],

    afterSubTpl: [
        '<tpl if="noteAlign==\'down\'">',
            '<div id="{id}-note" class="x-field-note {noteCls}">{noteHtml}</div>',
        '</tpl>',
    ],

    indicatorTpl: [
        '<div id="{id}-indicator" style="position:relative;display:table-cell;">',
            '<div class="x-field-indicator {indicatorCls} {indicatorIconCls}">{indicatorHtml}</div>',
        '</div>'
    ],


    hideNote: function () {
        if (!Ext.isEmpty(this.note, false) && this.noteEl) {
            this.noteEl.addCls("x-hide-" + this.hideMode);
        }
    },

    showNote: function () {
        if (!Ext.isEmpty(this.note, false) && this.noteEl) {
            this.noteEl.removeCls("x-hide-" + this.hideMode);
        }
    },

    setNote: function (t, encode) {
        this.note = t;

        if (this.rendered) {
            this.noteEl.dom.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
        }
    },

    setNoteCls: function (cls) {
        if (this.rendered) {
            this.noteEl.removeCls(this.noteCls);
            this.noteEl.addCls(cls);
        }

        this.noteCls = cls;
    },

    isIndicatorEmpty: function () {
        return Ext.isEmpty(this.indicatorText) && Ext.isEmpty(this.indicatorCls) && Ext.isEmpty(this.indicatorIconCls);
    },

    clearIndicator: function (preventLayout, holder) {
        holder = holder || {};
        this.setIndicator(holder.indicatorText || "", false, true);
        this.setIndicatorCls(holder.indicatorCls || "", true);
        this.setIndicatorIconCls(holder.indicatorIconCls || "", true);
        this.setIndicatorTip(holder.indicatorTip || "", true);

        if (preventLayout !== true) {
            this.isIndicatorActive = true;
            this.needIndicatorRelayout = false;
            this.updateLayout();
        }
        else {
            this.needIndicatorRelayout = true;
        }
        this.isIndicatorActive = false;
    },

    saveIndicator: function (name, ignoreExists) {
        this._indicators = this._indicators || {};

        if (ignoreExists && this._indicators[name || "default"]) {
            return;
        }

        var holder = this._indicators[name || "default"] || {};
        holder.indicatorText = this.indicatorText;
        holder.indicatorCls = this.indicatorCls;
        holder.indicatorIconCls = this.indicatorIconCls;
        holder.indicatorTip = this.indicatorTip;

        this._indicators[name || "default"] = holder;
    },

    restoreIndicator: function (name, remove) {
        if (!this._indicators) {
            return;
        }

        var holder = this._indicators[name || "default"];
        this.clearIndicator(false, holder);

        if (remove !== false && holder) {
            delete this._indicators[name || "default"];
        }

        return holder;
    },

    setIndicator: function (t, encode, preventLayout) {
        this.indicatorText = t;

        if (this.indicatorEl) {
            this.isIndicatorActive = true;
            this.indicatorEl.dom.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;

            if (preventLayout !== true) {
                if (this.autoFitIndicator) {
                    this.indicatorEl.setStyle("width", "");
                }

                this.needIndicatorRelayout = false;
                this.updateLayout();
            }
            else {
                this.needIndicatorRelayout = true;
            }
        }
    },

    setIndicatorCls: function (cls, preventLayout) {
        if (this.indicatorEl) {
            this.indicatorEl.removeCls(this.indicatorCls);
            this.indicatorEl.addCls(cls);
            if (preventLayout !== true) {
                this.needIndicatorRelayout = false;
                this.updateLayout();
            }
            else {
                this.needIndicatorRelayout = true;
            }
        }

        this.indicatorCls = cls;
    },

    setIndicatorIconCls: function (cls, preventLayout) {
        if (this.indicatorEl) {
            this.isIndicatorActive = true;
            this.indicatorEl.removeCls(this.indicatorIconCls);

            cls = cls.indexOf('#') === 0 ? X.net.RM.getIcon(cls.substring(1)) : cls;

            this.indicatorEl.addCls(cls);

            if (preventLayout !== true) {
                this.needIndicatorRelayout = false;
                this.updateLayout();
            }
            else {
                this.needIndicatorRelayout = true;
            }
        }

        this.indicatorIconCls = cls;
    },

    initIndicatorTip: function () {
        if (this.indicatorTip) {
            if (Ext.isString(this.indicatorTip)) {
                this.indicatorTip = { text: this.indicatorTip };
            }
            Ext.tip.QuickTipManager.register(
                Ext.apply({
                    target: this.indicatorEl
                }, this.indicatorTip)
            );
            //this.indicatorEl.set({ "data-qtip": this.indicatorTip.text });
        }
    },

    setIndicatorTip: function (tip) {
        this.indicatorTip = Ext.apply(this.indicatorTip || {}, { text: tip });

        if (!this.indicatorEl) {
            this.initIndicator();
        } else {
            if (Ext.QuickTips.getQuickTip().targets[this.indicatorEl.id]) {
                Ext.QuickTips.getQuickTip().targets[this.indicatorEl.id].text = tip;
            } else {
                this.initIndicatorTip();
            }
        }

        if (this.indicatorEl) {
            this.isIndicatorActive = true;

            if (Ext.QuickTips.getQuickTip().targets[this.indicatorEl.id]) {
                Ext.QuickTips.getQuickTip().targets[this.indicatorEl.id].text = tip;
            } else {
                this.initIndicatorTip();
            }
        }
    },

    showIndicator: function (preventLayout) {
        if (Ext.isObject(preventLayout)) {
            var cfg = preventLayout;
            preventLayout = cfg.preventLayout;

            this.setIndicatorTip(cfg.tip || "", true);
            this.setIndicatorIconCls(cfg.iconCls || "", true);
            this.setIndicatorCls(cfg.cls || "", true);
            this.setIndicator(cfg.text || "", cfg.encode || false, true);
        }

        if (this.indicatorEl && (this.indicatorHidden !== false || this.needIndicatorRelayout)) {
            if (this.preserveIndicatorIcon) {
                this.indicatorEl.fixDisplay();
            }

            this.indicatorHidden = false;

            if (preventLayout !== true) {
                if (this.autoFitIndicator) {
                    this.indicatorEl.setStyle("width", "");
                }
                this.updateLayout();
            }
        }
    },

    hideIndicator: function (preventLayout) {
        if (this.indicatorEl && this.indicatorHidden !== true) {
            var errorSide = this.msgTarget == "side" && this.hasActiveError();
            if (this.preserveIndicatorIcon && !errorSide) {
                this.indicatorEl.fixDisplay();
            }

            this.indicatorHidden = true;
            this.errorSideHide = false;

            if (preventLayout !== true) {
                this.needIndicatorRelayout = false;
                this.updateLayout();
            }
            else {
                this.needIndicatorRelayout = true;
            }
        }
    },

    onIndicatorIconClick: function () {
        this.fireEvent("indicatoriconclick", this, this.indicatorEl);
    },

    getInsertionRenderData: function (data, names) {
        var indicatorIconCls = this.indicatorIconCls && this.indicatorIconCls.indexOf('#') === 0 ? X.net.RM.getIcon(this.indicatorIconCls.substring(1)) : this.indicatorIconCls;
        this.indicatorIconCls = indicatorIconCls;
        this.note = this.noteEncode ? Ext.util.Format.htmlEncode(this.note) : this.note;
        this.isIndicatorActive = !this.isIndicatorEmpty();

        data = Ext.apply(data, {
            noteCls: this.noteCls || "",
            noteAlign: this.note ? (this.noteAlign || "down") : "",
            indicatorCls: this.indicatorCls || "",
            indicatorIconCls: indicatorIconCls || "",
            indicatorHtml: this.indicatorText || "",
            noteHtml: this.note || ""
        });
        return this.callParent([data, names]);
    },

    afterRender: function () {
        this.callParent(arguments);

        if (!this.isIndicatorWasUpdated) {
            this.updateIndicator();
        }
    },

    updateIndicator: function () {
        if (!this.indicatorEl) {
            return;
        }

        if (!this.isIndicatorWasUpdated) {
            this.isIndicatorWasUpdated = true;
        }

        var errorSide = this.msgTarget == "side" && this.hasActiveError(),
            isTopNote = this.noteAlign == "top",
            hideIndicator,
            w,
            h;

        if (isTopNote) {
            h = this.noteEl.getHeight();

            if (this.labelAlign !== "top") {
                this.labelEl.setStyle("padding-top", (h + 4) + "px");
            }

            this.indicatorEl.setStyle("top", h + "px");

            if (this.errorEl && this.msgTarget == "side") {
                this.errorEl.parent().setStyle("padding-top", h + "px");
            }
        }

        if (!this.isIndicatorActive && !this.preserveIndicatorIcon) {
            this.hideIndicator(true);
            this.indicatorEl.parent().setStyle("display", "none");
            this.errorSideHide = errorSide;
            return;
        }

        if (errorSide) {
            this.hideIndicator(true);
            this.indicatorEl.parent().setStyle("display", "none");
            this.errorSideHide = true;
        } else {
            if (this.errorSideHide) {
                this.showIndicator(true);                
            }

            hideIndicator = (this.isIndicatorEmpty() || this.indicatorHidden);

            this.indicatorEl.parent().setStyle("display", (hideIndicator && !this.preserveIndicatorIcon) ? "none" : "table-cell");

            this.indicatorEl.setStyle("padding-left", this.indicatorIconCls ? "18px" : "0px");

            if (this.autoFitIndicator) {
                w = Ext.isIE7 ? this.indicatorEl.getPadding("lr") : 0;
                w = hideIndicator ? (this.preserveIndicatorIcon ? 18 : 0) : (this.indicatorEl.getWidth() - w);
                this.indicatorEl.parent().setStyle("width", w + "px");
                //this.indicatorEl.parent().setStyle("height", this.inputEl ? (this.inputEl.getHeight() + "px") : "22px");
                this.indicatorEl.setStyle("width", w + "px");
            }
        }
    },

    updateLayout: function () {
        this.updateIndicator();
        this.callParent(arguments);
    },

    initIndicatorElements : function () {
        var me = this;
        me.noteEl = Ext.get(me.id + "-note");
        me.indicatorEl = Ext.get(me.id + "-indicator");
        if (me.indicatorEl) {
            me.indicatorEl = me.indicatorEl.down(".x-field-indicator");
        }

        if (!me.indicatorEl) {
            return;
        }

        if (me.indicatorTip) {
            me.initIndicatorTip();
        }

        me.indicatorEl.on("click", me.onIndicatorIconClick, me);

        if (me.initialConfig.listeners && me.initialConfig.listeners.indicatoriconclick ||
            me.initialConfig.directEvents && me.initialConfig.directEvents.indicatoriconclick) {

            me.indicatorEl.applyStyles("cursor: pointer;");
        }

        if (this.useHiddenField) {
            this.hiddenField = this.bodyEl.createChild({
                tag: 'input',
                type: 'hidden',
                name: this.getHiddenStateName()
            });

            var val = Ext.isDefined(this.hiddenValue) ? this.hiddenValue : this.getHiddenState(this.getValue());

            this.hiddenField.dom.value = !Ext.isEmpty(val) ? val : "";

            this.checkHiddenStateName();

            this.on("beforedestroy", function () {
                this.hiddenField.destroy();
            }, this);
        }
    },

    onRender: function () {
        this.callParent(arguments);
        this.initIndicatorElements();
    }

    /*privates: {
        applyRenderSelectors: function () {
            var me = this;

            me.callParent();

            this.initIndicatorElements();
        }
    }*/
};

Ext.form.field.Base.override(Ext.net.FieldNote);
Ext.form.FieldContainer.override(Ext.net.FieldNote);

// Do not replace with .callParent()
Ext.form.field.Base.prototype.initComponent = Ext.Function.createInterceptor(Ext.form.field.Base.prototype.initComponent, Ext.net.FieldNote.initHiddenFieldState);
Ext.form.FieldContainer.prototype.initComponent = Ext.Function.createInterceptor(Ext.form.FieldContainer.prototype.initComponent, Ext.net.FieldNote.initHiddenFieldState);

(function (cls) {
    for (var c = 0; c < cls.length; c++) {
        var me = cls[c],
            tpl = me.labelableRenderTpl,
            i,
            len,
            beforeStr,
            beforeIndex;

        if (tpl && Ext.isArray(tpl)) {
            beforeStr = '<tpl if="renderError">';
            if (tpl[24] == beforeStr) {
                beforeIndex = 24;
            }
            else {
                for (i = 0, len = tpl.length; i < len; i++) {
                    if (tpl[i] == beforeStr) {
                        beforeIndex = i;
                        break;
                    }
                }
            }

            Ext.Array.insert(tpl, beforeIndex, "{indicatorTpl}");

            me.labelableInsertions.push("indicatorTpl");
        }
    }
})([Ext.form.field.Base.prototype]);