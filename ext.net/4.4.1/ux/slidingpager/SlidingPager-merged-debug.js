
Ext.define('Ext.ux.SlidingPager', {
    alias: 'plugin.ux-slidingpager',

    requires: [
        'Ext.slider.Single',
        'Ext.slider.Tip'
    ],

    
    constructor : function(config) {
        if (config) {
            Ext.apply(this, config);
        }
    },

    init : function(pbar){
        var idx = pbar.items.indexOf(pbar.child("#inputItem")),
            slider;

        Ext.each(pbar.items.getRange(idx - 2, idx + 2), function(c){
            c.hide();
        });

        slider = Ext.create('Ext.slider.Single', {
            width: 114,
            minValue: 1,
            maxValue: 1,
            hideLabel: true,
            tipText: function(thumb) {
                return Ext.String.format('Page <b>{0}</b> of <b>{1}</b>', thumb.value, thumb.slider.maxValue);
            },
            listeners: {
                changecomplete: function(s, v){
                    pbar.store.loadPage(v);
                }
            }
        });

        pbar.insert(idx + 1, slider);

        pbar.on({
            change: function(pb, data){
                slider.setMaxValue(data.pageCount);
                slider.setValue(data.currentPage);
            }
        });
    }
});

// @source slidingpager/SlidingPager-overrides.js
Ext.define('Ext.ux.SlidingPager', {
    override: 'Ext.ux.SlidingPager',
    init: function (pbar) {
        var idx = pbar.items.indexOf(pbar.child("#inputItem")),
            slider;

        Ext.each(pbar.items.getRange(idx - 2, idx + 2), function (c) {
            c.hide();
        });

        var lastPage = pbar.getPageData().pageCount;

        if (lastPage < 1) {
            lastPage = 1;
        }

        slider = Ext.create('Ext.slider.Single', {
            width: 114,
            minValue: 1,
            maxValue: pbar.getPageData().pageCount,
            hideLabel: true,
            tipText: function (thumb) {
                return Ext.String.format('Page <b>{0}</b> of <b>{1}</b>', thumb.value, thumb.slider.maxValue);
            },
            listeners: {
                changecomplete: function (s, v) {
                    pbar.store.loadPage(v);
                }
            }
        });

        pbar.insert(idx + 1, slider);

        pbar.on({
            change: function (pb, data) {
                slider.setMaxValue(data.pageCount);
                slider.setValue(data.currentPage);
            }
        });
    }
});
