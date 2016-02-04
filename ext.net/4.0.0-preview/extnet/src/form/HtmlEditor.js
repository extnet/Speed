// @source core/form/HtmlEditor.js

Ext.form.field.HtmlEditor.override({
    escapeValue: true,

    componentTpl: [
        '{beforeTextAreaTpl}',
        '<textarea id="{id}-textareaEl" data-ref="textareaEl" name="{name}" tabindex="-1" {inputAttrTpl}',
                 ' class="{textareaCls}" autocomplete="off">',
            '{[ this.owner.escapeValue ? escape(values.value || "") : Ext.util.Format.htmlEncode(values.value) ]}', // #880
        '</textarea>',
        '{afterTextAreaTpl}',
        '{beforeIFrameTpl}',
        '<iframe id="{id}-iframeEl" data-ref="iframeEl" name="{iframeName}" frameBorder="0" {iframeAttrTpl}',
               ' src="{iframeSrc}" class="{iframeCls}"></iframe>',
        '{afterIFrameTpl}',
        {
            disableFormats: true
        }
    ],

    initComponent: function () {
        if (this.initialConfig && this.initialConfig.buttonTips) {
            this.buttonTips = Ext.Object.merge(Ext.clone(Ext.form.field.HtmlEditor.prototype.buttonTips), this.buttonTips);
        }

        if (!this.name) {
            this.name = this.id || this.inputId || Ext.id();
        }
        this.callParent(arguments);
    },

    syncValue: function () {
        var me = this,
            body, changed, html, bodyStyle, match, textElDom;
        if (me.initialized) {
            body = me.getEditorBody();
            html = body.innerHTML;
            textElDom = me.textareaEl.dom;
            if (Ext.isWebKit) {
                bodyStyle = body.getAttribute('style'); // Safari puts text-align styles on the body element!
                match = bodyStyle.match(me.textAlignRE);

                if (match && match[1]) {
                    html = '<div style="' + match[0] + '">' + html + '</div>';
                }
            }
            html = me.cleanHtml(html);
            if (me.fireEvent('beforesync', me, html) !== false) {

                // Gecko inserts single <br> tag when input is empty
                // and user toggles source mode. See https://sencha.jira.com/browse/EXTJSIV-8542
                if (Ext.isGecko && textElDom.value === '' && html === '<br>') {
                    html = '';
                }

                if (textElDom.value !== html) {
                    textElDom.value = this.escapeValue ? escape(html) : html;
                    changed = true;
                }

                me.fireEvent('sync', me, html);

                if (changed && !me.inSync) {
                    // we have to guard this to avoid infinite recursion because getValue
                    // calls this method...
                    me.inSync = true;
                    me.checkChange();
                    delete me.isSync;
                }
            }
        }
    },

    setValue: function (value) {
        var me = this,
            textarea = me.textareaEl;

        if (value === null || value === undefined) {
            value = '';
        }

        if (me.value !== value) {
            if (textarea) {
                textarea.dom.value = this.escapeValue ? escape(value) : value;
            }

            me.pushValue();

            if (!me.rendered && me.inputCmp) {
                me.inputCmp.data.value = value;
            }

            me.mixins.field.setValue.call(me, value);
        }

        return me;
    },


    getValue: function () {
        var me = this,
            value;
        if (!me.sourceEditMode) {
            me.syncValue();
        }
        value = me.rendered ? me.textareaEl.dom.value : me.value;
        me.value = value;

        return this.escapeValue ? unescape(value) : value;
    },

    toggleSourceEdit: function (sourceEditMode) {
        var me = this,
            iframe = me.iframeEl,
            textarea = me.textareaEl,
            hiddenCls = Ext.baseCSSPrefix + 'hidden',
            btn = me.getToolbar().getComponent('sourceedit');

        if (!Ext.isBoolean(sourceEditMode)) {
            sourceEditMode = !me.sourceEditMode;
        }
        me.sourceEditMode = sourceEditMode;

        if (btn.pressed !== sourceEditMode) {
            btn.toggle(sourceEditMode);
        }
        if (sourceEditMode) {
            me.disableItems(true);
            me.syncValue();
            if (this.escapeValue) {
                textarea.dom.value = unescape(this.textareaEl.dom.value);
            }
            iframe.addCls(hiddenCls);
            textarea.removeCls(hiddenCls);
            textarea.dom.removeAttribute('tabIndex');
            textarea.focus();
            me.inputEl = textarea;
        }
        else {
            if (me.initialized) {
                me.disableItems(me.readOnly);
            }
            me.pushValue();
            if (this.escapeValue) {
                textarea.dom.value = escape(this.textareaEl.dom.value);
            }
            iframe.removeCls(hiddenCls);
            textarea.addCls(hiddenCls);
            textarea.dom.setAttribute('tabIndex', -1);
            me.deferFocus();
            me.inputEl = iframe;
        }
        me.fireEvent('editmodechange', me, sourceEditMode);
        me.updateLayout();
    },

    pushValue: function () {
        var me = this,
           v;
        if (me.initialized) {
            v = (me.escapeValue ? unescape(me.textareaEl.dom.value) : me.textareaEl.dom.value) || "";
            if (!me.activated && v.length < 1) {
                v = me.defaultValue;
            }
            if (me.fireEvent('beforepush', me, v) !== false) {
                me.getEditorBody().innerHTML = v;
                if (Ext.isGecko) {
                    // Gecko hack, see: https://bugzilla.mozilla.org/show_bug.cgi?id=232791#c8
                    me.setDesignMode(false);  //toggle off first
                    me.setDesignMode(true);
                }
                me.fireEvent('push', me, v);
            }
        }
    },

    // Appends the text.
    // Options:
    //      text - a string to append.
    //      (optional) appendLine - appends a new line if true. Defaults to false.
    append: function (text, appendLine) {
        this.setValue([this.getValue(), text, appendLine === true ? "<br/>" : ""].join(""), false);
    },

    // Appends the text and a new line.
    // Options:
    //      text - a string to append.
    appendLine: function (text) {
        this.append(text, true);
    },

    setReadOnly: function (readOnly) {
        this.callParent(arguments);
        this[!!readOnly ? 'addCls' : 'removeCls'](this.readOnlyCls); // #887
    }
});

Ext.layout.component.field.HtmlEditor.override({
    finishedLayout: function () { // #885
        var body;

        this.callParent(arguments);
        body = this.owner.getDoc().body;

        if (body) {
            body.style[Ext.isIE8 ? "height" : "minHeight"] = this.owner.iframeEl.getHeight() + "px";;
        }
    }
});