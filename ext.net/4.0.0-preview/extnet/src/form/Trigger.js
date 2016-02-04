Ext.form.trigger.Trigger.getIcon = function (icon) {
    var iconName = icon.toLowerCase(),
        key = "x-form-" + iconName + "-trigger";

    if (iconName !== "combo" && iconName !== "clear" && iconName !== "date" && iconName !== "search") {
        if (!this.registeredIcons) {
            this.registeredIcons = {};
        }

        if (!this.registeredIcons[key]) {
            this.registeredIcons[key] = true;

            var sepName = Ext.net.ResourceMgr.toCharacterSeparatedFileName(icon, "-"),
                template = "/{0}extnet/resources/images/triggerfield/{1}-gif/ext.axd",
                appName = Ext.isEmpty(Ext.net.ResourceMgr.appName, false) ? "" : (Ext.net.ResourceMgr.appName + "/"),
                url,
                url1 = "",
                css = ".{0}{background-image:url({1});cursor:pointer;}";

            if (Ext.net.ResourceMgr.theme == "gray" && (icon == "Ellipsis" || icon == "Empty")) {
                template = "/{0}extnet/resources/images/triggerfield/gray/{1}-gif/ext.axd";
            }

            if (Ext.net.ResourceMgr.theme == "neptune" ||
                Ext.net.ResourceMgr.theme == "crisp" ||
                Ext.net.ResourceMgr.theme == "neptunetouch" ||
                Ext.net.ResourceMgr.theme == "crisptouch") {
                template = "/{0}extnet/resources/images/triggerfield/neptune/{1}-png/ext.axd";
            }

            url = Ext.net.StringUtils.format(template, appName, sepName);

            css = Ext.net.StringUtils.format(css, key, url, url1);
            Ext.net.ResourceMgr.registerCssClass("trigger_" + key, css);
        }
    }

    return key;
};

Ext.define('Ext.form.trigger.Trigger.extnet', {
    override: "Ext.form.trigger.Trigger",

    onFieldRender: function () {
        this.callParent(arguments);

        if (this.qTip || this.qTipCfg) {
            if (!this.qTipCfg) {
                this.qTipCfg = {};
            }

            if (this.qTip) {
                this.qTipCfg.text = this.qTip;
            }

            Ext.tip.QuickTipManager.register(Ext.apply({
                target: this.el.id
            }, this.qTipCfg));
        }
    },

    removeBorderIfSimple: function (field) {
        var first,
            i,
            triggers,
            len,            
            isSimple = false;

        field = field || this.field,

        triggers = field.orderedTriggers;

        if (!triggers || !field.rendered) {
            return;
        }

        len = triggers.length;

        for (i = 0; i < len; i++) {
            first = triggers[i];
            if (first.isVisible()) {
                if (Ext.net.StringUtils.startsWith(first.cls || "", "x-form-simple")) {
                    isSimple = true;
                }
                break;
            }
        }

        if (isSimple && !field.hideTrigger && !field.readOnly) {
            field.inputWrap.setStyle({ "border-right-width": "0px" });
        } else {
            field.inputWrap.setStyle({ "border-right-width": "1px" });
        }
    },

    show: function () {
        this.callParent(arguments);
        this.removeBorderIfSimple();
    },

    hide: function () {
        this.callParent(arguments);
        this.removeBorderIfSimple();
    },

    renderTrigger: function (fieldData) {
        var me = this,
            width = me.width,
            triggerStyle = me.hidden ? 'display:none;' : '',
            triggers,
            len,
            isNotLast,
            isTouchTheme,
            forceSimple;

        isTouchTheme = Ext.net.ResourceMgr.theme == "neptunetouch" || Ext.net.ResourceMgr.theme == "crisptouch";
        if (isTouchTheme) {
            if (me.cls == "x-form-ellipsis-trigger" || me.cls == "x-form-empty-trigger") {
                forceSimple = true;
            }
        }

        if (forceSimple || Ext.net.StringUtils.startsWith(me.cls || "", "x-form-simple")) {
            if (isTouchTheme) {
                this.focusCls += "22";
                this.overCls += "22";
                this.clickCls += "22";
            }

            triggers = this.field.orderedTriggers;
            len = triggers.length;
            isNotLast = triggers[len - 1] != this;
            if (isNotLast && (Ext.net.ResourceMgr.theme === "blue" || Ext.net.ResourceMgr.theme === "gray")) {
                width = 16;
            }

            if (triggers[0] == this) {
                if (this.field.inputWrap) {
                    this.field.inputWrap.setStyle({ "border-right-width": "0px" });
                }
                else {
                    this.field.on("afterrender", function () {
                        this.inputWrap.setStyle({ "border-right-width": "0px" });
                    }, this.field, { single: true });
                }
            }

            if (Ext.net.ResourceMgr.theme == "neptune" ||
                Ext.net.ResourceMgr.theme == "crisp" ||
                Ext.net.ResourceMgr.theme == "neptunetouch" ||
                Ext.net.ResourceMgr.theme == "crisptouch") {
                width = forceSimple && !isNotLast ? 22 : 18;
            }
        }

        if (width) {
            triggerStyle += 'width:' + width + "px";
        }

        return Ext.XTemplate.getTpl(me, 'renderTpl').apply({
            $trigger: me,
            fieldData: fieldData,
            ui: fieldData.ui,
            childElCls: fieldData.childElCls,
            triggerId: me.domId = me.field.id + '-trigger-' + me.id,
            cls: me.cls,
            triggerStyle: triggerStyle,
            extraCls: me.extraCls,
            baseCls: me.baseCls
        });
    },

    isCustomTrigger : function () {
        return !((this.handler == "onTriggerClick" || this.handler == this.field.onTriggerClick) &&
               (this.scope == "this" || this.scope == this.field));
    },

    onCustomClick : function () {
        if (!this.field.readOnly && this.isFieldEnabled() && this.isCustomTrigger()) {
            this.field.onCustomTriggerClick(this, this.clickRepeater ? arguments[1] : arguments[0]);
        }
    },

    onClick: function () {
        this.callParent(arguments);

        this.onCustomClick.apply(this, arguments);
    }
});

Ext.define('Ext.form.trigger.Spinner.extnet', {
    override: "Ext.form.trigger.Spinner",

    onCustomClick: Ext.emptyFn
});