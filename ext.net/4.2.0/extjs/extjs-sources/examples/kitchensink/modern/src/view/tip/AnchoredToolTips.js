Ext.define('KitchenSink.view.tip.AnchoredToolTips', {
    extend: 'Ext.Container',

    // <example>
    requires: [
        'KitchenSink.view.tip.AnchoredToolTipsController',
        'KitchenSink.data.ToolTips'
    ],

    otherContent: [{
        type: 'Controller',
        path: 'modern/src/view/tip/AnchoredToolTipsController.js'
    }],
    // <example>

    cls: 'demo-solid-background',
    shadow: true,
    width: '90%',

    controller: 'anchored-tooltips',
    padding: 20,
    layout: {
        type: 'hbox',
        align: 'start',
        pack: 'center'
    },

    defaultType: 'button',
    margin: '0 0 50 0',
    defaults: {
        margin: '0 15 0 0',
        minWidth: 150
    },

    items: [{
        text: 'Basic Tip',
        tooltip: {
            html: 'A simple tooltip'
        }
    }, {
        text: 'Ajax Tip',
        tooltip: {
            autoCreate: true,
            showOnTap: Ext.supports.Touch,
            anchorToTarget: false,
            width: 200,
            dismissDelay: 15000,
            listeners: {
                beforeshow: 'beforeAjaxTipShow'
            }
        }
    }, {
        text: 'Anchor below',
        tooltip: {
            html: 'The anchor is centered',
            anchorToTarget: true,
            align: 'tc-bc',
            anchor: true
        }
    }]
});
