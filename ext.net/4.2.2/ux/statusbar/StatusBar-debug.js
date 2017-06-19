
Ext.define('Ext.ux.statusbar.ValidationStatus', {
    extend: 'Ext.Component',
    alias: 'plugin.validationstatus',
    requires: ['Ext.util.MixedCollection'],
    
    errorIconCls : 'x-status-error',
    
    errorListCls : 'x-status-error-list',
    
    validIconCls : 'x-status-valid',

    
    showText : 'The form has errors (click for details...)',
    
    hideText : 'Click again to hide the error list',
    
    submitText : 'Saving...',

    
    init : function(sb) {
        var me = this;

        me.statusBar = sb;
        sb.on({
            single: true,
            scope: me,
            render: me.onStatusbarRender
        });
        sb.on({
            click: {
                element: 'el',
                fn: me.onStatusClick,
                scope: me,
                buffer: 200
            }
        });
    },

    onStatusbarRender: function(sb) {
        var me = this,
            startMonitor = function() {
                me.monitor = true;
            };

        me.monitor = true;
        me.errors = Ext.create('Ext.util.MixedCollection');
        me.listAlign = (sb.statusAlign === 'right' ? 'br-tr?' : 'bl-tl?');

        if (me.form) {
            // Allow either an id, or a reference to be specified as the form name.
            me.formPanel = Ext.getCmp(me.form) || me.statusBar.lookupController().lookupReference(me.form);
            me.basicForm = me.formPanel.getForm();
            me.startMonitoring();
            me.basicForm.on({
                beforeaction: function(f, action) {
                    if (action.type === 'submit') {
                        // Ignore monitoring while submitting otherwise the field validation
                        // events cause the status message to reset too early
                        me.monitor = false;
                    }
                }
            });
            me.formPanel.on({
                beforedestroy: me.destroy,
                scope: me
            });
            me.basicForm.on('actioncomplete', startMonitor);
            me.basicForm.on('actionfailed', startMonitor);
        }
   },

    
    startMonitoring : function() {
        this.basicForm.getFields().each(function(f) {
            f.on('validitychange', this.onFieldValidation, this);
        }, this);
    },

    
    stopMonitoring : function() {
        var form = this.basicForm;

        if (!form.destroyed) {
            form.getFields().each(function(f) {
                f.un('validitychange', this.onFieldValidation, this);
            }, this);
        }
    },

    doDestroy: function() {
        Ext.destroy(this.msgEl);
        this.stopMonitoring();
        this.statusBar.statusEl.un('click', this.onStatusClick, this);
        this.callParent();
    },

    
    onFieldValidation : function(f, isValid) {
        var me = this,
            msg;

        if (!me.monitor) {
            return false;
        }
        msg = f.getErrors()[0];
        if (msg) {
            me.errors.add(f.id, {field:f, msg:msg});
        } else {
            me.errors.removeAtKey(f.id);
        }
        this.updateErrorList();
        if (me.errors.getCount() > 0) {
            if (me.statusBar.getText() !== me.showText) {
                me.statusBar.setStatus({
                    text: me.showText,
                    iconCls: me.errorIconCls
                });
            }
        } else {
            me.statusBar.clearStatus().setIcon(me.validIconCls);
        }
    },

    
    updateErrorList : function() {
        var me = this,
            msg,
            msgEl = me.getMsgEl();

        if (me.errors.getCount() > 0) {
            msg = ['<ul>'];
            this.errors.each(function(err) {
                msg.push('<li id="x-err-', err.field.id, '"><a href="#">', err.msg, '</a></li>');
            });
            msg.push('</ul>');
            msgEl.update(msg.join(''));
        } else {
            msgEl.update('');
        }
        // reset msgEl size
        msgEl.setSize('auto', 'auto');
    },

    
    getMsgEl : function() {
        var me = this,
            msgEl = me.msgEl,
            t;

        if (!msgEl) {
            msgEl = me.msgEl = Ext.DomHelper.append(Ext.getBody(), {
                cls: me.errorListCls
            }, true);
            msgEl.hide();
            msgEl.on('click', function(e) {
                t = e.getTarget('li', 10, true);
                if (t) {
                    Ext.getCmp(t.id.split('x-err-')[1]).focus();
                    me.hideErrors();
                }
            }, null, {stopEvent: true}); // prevent anchor click navigation
        }
        return msgEl;
    },

    
    showErrors : function() {
        var me = this;

        me.updateErrorList();
        me.getMsgEl().alignTo(me.statusBar.getEl(), me.listAlign).slideIn('b', {duration: 300, easing: 'easeOut'});
        me.statusBar.setText(me.hideText);
        me.formPanel.body.on('click', me.hideErrors, me, {single:true}); // hide if the user clicks directly into the form
    },

    
    hideErrors : function() {
        var el = this.getMsgEl();
        if (el.isVisible()) {
            el.slideOut('b', {duration: 300, easing: 'easeIn'});
            this.statusBar.setText(this.showText);
        }
        this.formPanel.body.un('click', this.hideErrors, this);
    },

    
    onStatusClick : function() {
        if (this.getMsgEl().isVisible()) {
            this.hideErrors();
        } else if (this.errors.getCount() > 0) {
            this.showErrors();
        }
    }
});

Ext.define('Ext.ux.statusbar.StatusBar', {
    extend: 'Ext.toolbar.Toolbar',
    alternateClassName: 'Ext.ux.StatusBar',
    alias: 'widget.statusbar',
    requires: ['Ext.toolbar.TextItem'],
    
    
    
    
    

    
    cls : 'x-statusbar',
    
    busyIconCls : 'x-status-busy',
    
    busyText : 'Loading...',
    
    autoClear : 5000,

    
    emptyText : '&#160;',

    
    activeThreadId : 0,

    initComponent: function() {
        var right = this.statusAlign === 'right';

        this.callParent(arguments);
        this.currIconCls = this.iconCls || this.defaultIconCls;
        this.statusEl = Ext.create('Ext.toolbar.TextItem', {
            cls: 'x-status-text ' + (this.currIconCls || ''),
            text: this.text || this.defaultText || ''
        });

        if (right) {
            this.cls += ' x-status-right';
            this.add('->');
            this.add(this.statusEl);
        } else {
            this.insert(0, this.statusEl);
            this.insert(1, '->');
        }
    },

    
    setStatus: function(o) {
        var me = this;

        o = o || {};
        Ext.suspendLayouts();
        if (Ext.isString(o)) {
            o = {text:o};
        }
        if (o.text !== undefined) {
            me.setText(o.text);
        }
        if (o.iconCls !== undefined) {
            me.setIcon(o.iconCls);
        }

        if (o.clear) {
            var c = o.clear,
                wait = me.autoClear,
                defaults = {useDefaults: true, anim: true};

            if (Ext.isObject(c)) {
                c = Ext.applyIf(c, defaults);
                if (c.wait) {
                    wait = c.wait;
                }
            } else if (Ext.isNumber(c)) {
                wait = c;
                c = defaults;
            } else if (Ext.isBoolean(c)) {
                c = defaults;
            }

            c.threadId = this.activeThreadId;
            Ext.defer(me.clearStatus, wait, me, [c]);
        }
        Ext.resumeLayouts(true);
        return me;
    },

    
    clearStatus : function(o) {
        o = o || {};

        var me = this,
            statusEl = me.statusEl;

        if (me.destroyed || o.threadId && o.threadId !== me.activeThreadId) {
            // this means the current call was made internally, but a newer
            // thread has set a message since this call was deferred.  Since
            // we don't want to overwrite a newer message just ignore.
            return me;
        }

        var text = o.useDefaults ? me.defaultText : me.emptyText,
            iconCls = o.useDefaults ? (me.defaultIconCls ? me.defaultIconCls : '') : '';

        if (o.anim) {
            // animate the statusEl Ext.Element
            statusEl.el.puff({
                remove: false,
                useDisplay: true,
                callback: function() {
                    statusEl.el.show();
                    me.setStatus({
                        text: text,
                        iconCls: iconCls
                    });
                }
            });
        } else {
             me.setStatus({
                 text: text,
                 iconCls: iconCls
             });
        }
        return me;
    },

    
    setText : function(text) {
        var me = this;
        me.activeThreadId++;
        me.text = text || '';
        if (me.rendered) {
            me.statusEl.setText(me.text);
        }
        return me;
    },

    
    getText : function(){
        return this.text;
    },

    
    setIcon : function(cls) {
        var me = this;

        me.activeThreadId++;
        cls = cls || '';

        if (me.rendered) {
            if (me.currIconCls) {
                me.statusEl.removeCls(me.currIconCls);
                me.currIconCls = null;
            }
            if (cls.length > 0) {
                me.statusEl.addCls(cls);
                me.currIconCls = cls;
            }
        } else {
            me.currIconCls = cls;
        }
        return me;
    },

    
    showBusy : function(o){
        if (Ext.isString(o)) {
            o = { text: o };
        }
        o = Ext.applyIf(o || {}, {
            text: this.busyText,
            iconCls: this.busyIconCls
        });
        return this.setStatus(o);
    }
});

// @source: statusbar/StatusBar-overrides.js
Ext.define('Ext.ux.statusbar.StatusBar', {
    override: 'Ext.ux.statusbar.StatusBar',

    // Adds support for specifying the specificed icon width
    // By default forces a 20px space for icons (should work with most)
    setIcon: function (cls, iconWidth) {
        var me = this,
            retVal = me.callParent(arguments);

        if (!cls) {
            // make it inherit
            me.statusEl.el.setStyle('padding-left');
        } else {
            // give space for the icon
            me.statusEl.el.setStyle('padding-left', iconWidth || '20px');
        }

        return retVal;
    },

    // Adds support to clearIcon config option.
    setStatus: function (o) {
        var me = this;

        if (o && o.clearIcon) {
            o.iconCls = "";
        }

        return me.callParent(arguments);
    }
});
