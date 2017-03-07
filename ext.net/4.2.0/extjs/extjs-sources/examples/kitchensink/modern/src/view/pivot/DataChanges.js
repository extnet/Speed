/**
 *
 * This example shows that the pivot grid recalculates when store data has been changed.
 *
 * Use the buttons add/update/remove/clear store data.
 */
Ext.define('KitchenSink.view.pivot.DataChanges', {
    extend: 'Ext.pivot.Grid',

    requires: [
        'KitchenSink.view.pivot.DataChangesController',
        'KitchenSink.model.Sale'
    ],

    //<example>
    otherContent: [{
        type: 'Controller',
        path: 'modern/src/view/pivot/DataChangesController.js'
    },{
        type: 'Model',
        path: 'modern/src/model/Sale.js'
    }],
    //</example>

    controller: 'datachangespivot',

    cls: 'demo-solid-background',
    shadow: true,

    matrix: {
        type: 'local',
        store: {
            autoLoad: true,
            autoDestroy: true,
            model: 'KitchenSink.model.Sale',

            proxy: {
                // load using HTTP
                type: 'memory',
                // the return will be JSON, so lets set up a reader
                reader: {
                    type: 'json'
                }
            }
        },
        // Configure the aggregate dimensions. Multiple dimensions are supported.
        aggregate: [{
            dataIndex: 'value',
            header: 'Total',
            aggregator: 'sum'
        },{
            dataIndex: 'value',
            header: 'Count',
            aggregator: 'count'
        }],

        // Configure the left axis dimensions that will be used to generate the grid rows
        leftAxis: [{
            dataIndex: 'year',
            header: 'Year'
        }, {
            dataIndex: 'person',
            header: 'Person'
        }],

        /**
         * Configure the top axis dimensions that will be used to generate the columns.
         * When columns are generated the aggregate dimensions are also used. If multiple aggregation dimensions
         * are defined then each top axis result will have in the end a column header with children
         * columns for each aggregate dimension defined.
         */
        topAxis: [{
            dataIndex: 'country',
            header: 'Country'
        }]
    },

    items: [{
        docked: 'top',
        xtype: 'toolbar',
        items: [{
            xtype: 'button',
            text: 'Add data',
            handler: 'onAddData'
        },{
            text: 'Update data',
            handler: 'onUpdateData'
        },{
            text: 'Remove data',
            handler: 'onRemoveData'
        },{
            text: 'Clear all data',
            handler: 'onClearData'
        }]
    }]
});
