
// @source src/grid/Column/HyperlinkColumn.js

Ext.define('Ext.grid.column.Hyperlink', {
    extend: 'Ext.grid.column.Column',
    alias: ['widget.hyperlinkcolumn'],

    defaultRenderer: function (value, metadata, record) {        
        var me = this,
            data = {
                text: value,
                href: record.data[me.dataIndexHref]
            };

        if (!me.patternTpl) {
            me.updatePatternTpl();
        }

        return me.patternTpl.apply(data);
    },

    updatePatternTpl: function() {
        var me = this,
            html = "<a href='{0}' target='{1}'>{2}</a>";

        if (me.patternTpl) {
            me.patternTpl.destroy();
        }

        html = Ext.String.format(html, me.hrefPattern || "{href}", me.hrefTarget || "_blank", me.textPattern || "{text}");
        me.patternTpl = new Ext.Template(html, {
            compiled: true
        });
    }
});

