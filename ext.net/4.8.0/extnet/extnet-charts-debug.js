/*
 * @version   : 4.8.0 - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2019-02-23
 * @copyright : Copyright (c) 2008-2019, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/.
 */


// @source charts/legend/SpriteLegend.js

Ext.define('gh1543', {
    override: 'Ext.chart.legend.SpriteLegend',
    performLayout: function () {
        var me = this,
            sprites = me.getSprites(),
            surface = me.getSurface(),
            surfaceRect = surface.getRect(),
            // gap is 4x for the theme-driven borders
            gap = 4 * me.getPadding(),
            i, sprite, bbox, rec, name;

        if (!surface || !surfaceRect) {
            return false;
        }

        var docked = me.getDocked(),
            surfaceWidth = surfaceRect[2],
            legendMaxWidth = surfaceWidth - gap,
            surfaceHeight = surfaceRect[3],
            bboxes = [];

        Ext.each(sprites, function (sprite) {
            bboxes.push(sprite.getBBox());
        })

        switch (docked) {
            case 'bottom':
            case 'top':
                if (!surfaceWidth) {
                    return false;
                }

                // Parses every legend sprite, cropping text until it fits the current chart
                // canvas space.
                for (i = 0; i < bboxes.length; i++) {
                    bbox = bboxes[i];
                    sprite = sprites[i];

                    while (bbox.width > legendMaxWidth) {
                        rec = sprite.getRecord();
                        name = rec.get('name');
                        name = name.substr(0, name.length - 1);
                        rec.set('name', name);

                        // Reduced the record string to a minimum yet it does not fit.
                        if (name.length < 1) {
                            Ext.Error.raise("Chart is way too narrow to draw any legend text at all.");
                        }

                        sprite.getBBox();
                    }
                }

                break;
        }

        return me.callParent(arguments);
    }
});

Ext.define('gh1606', {
    override: 'Ext.chart.legend.SpriteLegend',
    isXType: function () {
        // This does not have a xtype definition, so always return false.
        return false;
    }
});
// @source charts/series/cartesian.js
Ext.define('gh1486', {
    override: 'Ext.chart.series.Cartesian',

    // This will enable data gaps handling, implemented by issue #1486.
    dataGapsHandling: false,

    getYRange: function () {
        var me = this;

        if (me.dataGapsHandling) {
            return (me.dataRange[1] === null || me.dataRange[3] === null)
                ? null : [me.dataRange[1], me.dataRange[3]];
        } else {
            return me.callParent(arguments);
        }
        
    },
    getRangeOfData: function (data, range) {
        var me = this;

        if (me.dataGapsHandling) {
            var i, length = data.length,
                value, min = range.min, max = range.max;

            for (i = 0; i < length; i++) {
                value = data[i];

                if (Ext.isNumeric(value)) {
                    if (value < min) {
                        min = value;
                    }
                    if (value > max) {
                        max = value;
                    }
                }
            }

            range.min = min;
            range.max = max;
        } else {
            return me.callParent(arguments);
        }
    },
    coordinateData: function (items, field, axis) {
        var me = this;

        if (me.dataGapsHandling) {
            var data = this.callParent(arguments),
                lim = data.length,
                i;

            for (i = 0; i < lim; i++) {
                if (!Ext.isNumeric(data[i])) {
                    data[i] = NaN;
                }
            }

            return data;
        } else {
            return me.callParent(arguments);
        }
    }
});
// @source charts/series/cartesian.js
Ext.define('gh1497', {
    override: 'Ext.chart.series.Pie3D',
    coordinateX: function () {
        var me = this,
            retVal = me.callParent(arguments),
            chart = me.getChart();

        // 'refreshLegendStore' will attemp to grab the 'series',
        // which are still configuring at this point.
        // The legend store will be refreshed inside the chart.series
        // updater anyway.
        if (!chart.isConfiguring) {
            chart.refreshLegendStore();
        };

        return retVal;
    }
});
