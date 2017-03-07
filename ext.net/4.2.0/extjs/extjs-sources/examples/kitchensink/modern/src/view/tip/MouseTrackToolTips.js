Ext.define('KitchenSink.view.tip.MouseTrackToolTips', {
    extend: 'Ext.Container',

    cls: 'demo-solid-background',
    shadow: true,

    padding: 20,
    layout: {
        type: 'hbox',
        align: 'start',
        pack: 'center'
    },
    width: '90%',

    defaultType: 'button',
    margin: '0 0 50 0',
    defaults: {
        margin: '0 15 0 0',
        minWidth: 150
    },

    items: [{
        text: 'Mouse Track',
        tooltip: {
            title: 'Mouse Track',
            html: 'This tip will follow the mouse while it is over the element',
            trackMouse: true
        }
    }, {
        text: 'Anchor with tracking',
        tooltip: {
            html: 'Following the mouse with an anchor',
            trackMouse: true,
            align: 'l-r',
            anchor: true
        }
    }]
});
