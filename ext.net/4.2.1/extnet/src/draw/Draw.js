Ext.draw.sprite.Composite.override({
    constructor: function (config) {
        var sprites = config.sprites;
        this.callParent(arguments);

        if (sprites) {
            this.addAll(sprites);
        }
    }
});

Ext.draw.sprite.Sprite.override({
    setAttributes: function (changes, bypassNormalization, avoidCopy) {
        if (changes) {
            var duration = Ext.isDefined(changes.duration),
                easing = Ext.isDefined(changes.easing);

            if (duration) {
                this.fx.setDuration(changes.duration);
            }

            if (easing) {
                this.fx.setEasing(changes.easing);
            }
        }

        this.callParent(arguments);
    }
});

Ext.chart.series.Pie.override({
    provideLegendInfo: function (target) {
        var me = this,
            store = me.getStore();

        if (store) {
            var items = store.getData().items,
                labelField = me.getLabel().getTemplate().getField(),
                xField = me.getXField(),
                hidden = me.getHidden(),
                titles = Ext.Array.from(me.getTitle()), // #876
                i, style, fill;

            for (i = 0; i < items.length; i++) {
                style = me.getStyleByIndex(i);
                fill = style.fillStyle;

                if (Ext.isObject(fill)) {
                    fill = fill.stops && fill.stops[0].color;
                }

                target.push({
                    name: titles[i] || (labelField ? String(items[i].get(labelField)) : xField + ' ' + i), // #876
                    mark: fill || style.strokeStyle || 'black',
                    disabled: hidden[i],
                    series: me.getId(),
                    index: i
                });
            }
        }
    }
});
