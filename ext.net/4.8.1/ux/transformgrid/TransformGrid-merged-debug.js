
Ext.define('Ext.ux.grid.TransformGrid', {
    extend: 'Ext.grid.Panel',

    
    constructor: function(table, config) {
        config = Ext.apply({}, config);
        table = this.table = Ext.get(table);

        // eslint-disable-next-line vars-on-top
        var configFields = config.fields || [],
            configColumns = config.columns || [],
            fields = [],
            cols = [],
            headers = table.query("thead th"),
            i = 0,
            len = headers.length,
            data = table.dom,
            width, height, col, text, name;

        for (; i < len; ++i) {
            col = headers[i];

            text = col.innerHTML;
            name = 'tcol-' + i;

            fields.push(Ext.applyIf(configFields[i] || {}, {
                name: name,
                mapping: 'td:nth(' + (i + 1) + ')/@innerHTML'
            }));

            cols.push(Ext.applyIf(configColumns[i] || {}, {
                text: text,
                dataIndex: name,
                width: col.offsetWidth,
                tooltip: col.title,
                sortable: true
            }));
        }

        if (config.width) {
            width = config.width;
        }
        else {
            width = table.getWidth() + 1;
        }

        if (config.height) {
            height = config.height;
        }

        Ext.applyIf(config, {
            store: {
                data: data,
                fields: fields,
                proxy: {
                    type: 'memory',
                    reader: {
                        record: 'tbody tr',
                        type: 'xml'
                    }
                }
            },
            columns: cols,
            width: width,
            height: height
        });

        this.callParent([config]);

        if (config.remove !== false) {
            // Don't use table.remove() as that destroys the row/cell data in the table in
            // IE6-7 so it cannot be read by the data reader.
            data.parentNode.removeChild(data);
        }
    },

    doDestroy: function() {
        this.table.remove();
        this.tabl = null;
        this.callParent();
    }
});

// @source: transformgrid/TransformGrid-overrides.js
Ext.define('Ext.ux.grid.TransformGrid', {
    override: 'Ext.ux.grid.TransformGrid',

    alias: 'widget.transformgrid',

    constructor: function (config) {
        var me = this,
            origRemove = config.remove,
            delayRemove = origRemove !== false;

        // If 'remove' was not specified 'false', then temporarily mark
        // it as 'false' so that the original constructor does not try
        // and remove it before we call its render() method.
        if (delayRemove) {
            config.remove = false;
        }

        // Original constructor call, pass forward
        if (arguments.length > 1) {
            me.callParent(arguments)
        } else {
            var table = config.table;

            delete config.table;

            // Undefine the columns if the list is an empty object.
            if (config.columns && typeof config.columns == "object" &&
                Object.keys(config.columns).length < 1) {
                delete config.columns;
            }
            me.callParent([table, config]);
        }

        if (config.remove !== false) {
            delayRemove = true;
        }

        me.render(me.table.dom.parentNode, me.table.dom);

        // restore the 'remove' config and remove it if it applies.
        if (delayRemove) {
            config.remove = origRemove;
            me.table.dom.parentNode.removeChild(me.table.dom);
        }
    },

    doDestroy: function () {
        this.table.remove();
        this.tabl = null;
        this.callParent();
    }
});
