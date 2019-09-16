Ext.define('Ext.ux.grid.column.ProgressBar', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.progressbarcolumn',
    cls: 'x-progress-column',
    progressCls: 'x-progress',
    progressText: '{0} %',
    hideIfEmpty: false,

    constructor: function () {
        var me = this;
        me.callParent(arguments);
        me.renderer = Ext.Function.bind(me.renderer, me);
        me.on("resize", this.onColumnResize);
    },

    initRenderData: function () {
        var me = this;
        me.gridRef = me.up('tablepanel');
        me.view = me.gridRef.getView();

        return me.callParent(arguments);
    },

    renderer: function (value, meta) {
        var me = this,
            text,
            cls = me.progressCls,
            pCls,
            cWidth = me.getWidth(true) - 2;

        if (me.hideIfEmpty && (!value && value !== 0 || value < 0)) {
            return "";
        }

        value = value || 0;

        text = Ext.String.format(me.progressText, Math.round(value * 100));

        pCls = cls + ' ' + cls + '-' + me.ui;
        meta.tdCls = "x-progress-column-cell";
        meta.style = "padding:0px;margin:0px;";
        v = '<div class="' + pCls + '" style="margin:1px 1px 1px 1px;width:' + cWidth + 'px;"><div class="' + cls + '-text ' + cls + '-text-back" style="width:' + (cWidth - 2) + 'px;">' +
                text +
            '</div>' +
            '<div class="' + cls + '-bar ' + cls + '-bar-' + me.ui + '" style="width: ' + value * 100 + '%;">' +
                '<div class="' + cls + '-text" style="width:' + (cWidth - 2) + 'px;">' +
                    '<div>' + text + '</div>' +
                '</div>' +
            '</div></div>'
        return v;
    },

    getCellSelector: function () {
        return '.' + Ext.baseCSSPrefix + 'grid-cell-' + this.getItemId();
    },

    onColumnResize: function () {
        var me = this,
            cls = me.progressCls,
            cWidth = me.getWidth(true) - 2,
            view = me.view;

        view.el.select(view.getCellInnerSelector(this) + " > div." + cls).setWidth(cWidth);
        view.el.select(view.getCellInnerSelector(this) + " div." + cls + "-text").setWidth(cWidth - 2);
    }
});