// @source core/form/Hyperlink.js

Ext.define("Ext.net.Hyperlink", {
    extend: "Ext.net.Label",
    alias: 'widget.nethyperlink',
    url: "#",

    renderTpl: [
        '<tpl if="iconAlign == \'left\'">',
           '<img src="{[Ext.BLANK_IMAGE_URL]}" class="' + Ext.baseCSSPrefix + 'label-icon',
           '<tpl if="!Ext.isEmpty(iconCls)"> {iconCls}</tpl>',
           '"/>',
        '</tpl>',
        '<a style="vertical-align:middle;"',
        '<tpl if="!Ext.isEmpty(hrefCls)"> class="{hrefCls}"</tpl>',
        '<tpl if="!Ext.isEmpty(href)"> href="{href}"</tpl>',
        '>',
        '</a>',
        '<tpl if="iconAlign == \'right\'">',
           '<img src="{[Ext.BLANK_IMAGE_URL]}" class="' + Ext.baseCSSPrefix + 'label-icon',
           '<tpl if="!Ext.isEmpty(iconCls)"> {iconCls}</tpl>',
           '"/>',
        '</tpl>',
    ],

    getElConfig: function () {
        var me = this;
        return Ext.apply(me.callParent(), {
            tag: 'span',
            id: me.id
        });
    },

    beforeRender: function () {
        var me = this;

        me.callParent();

        Ext.apply(me.renderData, {
            iconAlign: me.iconAlign,
            iconCls: me.iconCls || "",
            hrefCls: this.hrefCls,
            href: this.url
        });

        Ext.apply(me.childEls, {
            imgEl: { select: '.' + Ext.baseCSSPrefix + 'label-icon' },
            textEl: { select: 'a' }
        });
    },

    afterRender: function () {
        Ext.net.Hyperlink.superclass.afterRender.call(this);

        if (!Ext.isEmpty(this.target, false)) {
            this.textEl.set({ "target": this.target });
        }

        if (this.imageUrl) {
            this.textEl.setHtml('<img src="' + this.imageUrl + '" />');
        } else {
            this.textEl.setHtml(this.text ? Ext.util.Format.htmlEncode(this.text) : (this.html || ""));
        }
    },

    onDisable : function() {
        this.textEl.set({ 
            href: undefined
        });
        this.textEl.setStyle({
            "text-decoration": "none"
        });
    },

    onEnable : function() {
        this.textEl.set({
            href: this.url
        });
        this.textEl.setStyle({
            "text-decoration": undefined
        });
    },

    setImageUrl: function (imageUrl) {
        this.imageUrl = imageUrl;
        this.textEl.setHtml('<img style="border:0px;" src="' + this.imageUrl + '" />');
    },

    setUrl: function (url) {
        this.url = url;
        this.textEl.set({ "href": this.url });
    },

    setTarget: function (target) {
        this.target = target;
        this.textEl.set({ "target": this.target });
    }
});