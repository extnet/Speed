Ext.define("Ext.net.GridPrinter", {

    requires: 'Ext.XTemplate',

    statics: {
        //stylesheets: null,

        title: "",

        printStyle: "html,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,form,fieldset,input,p,blockquote,th,td{margin:0;padding:0}html,img,body{border:0}address,caption,cite,code,dfn,em,strong,th,var{font-style:normal;font-weight:400}ol,ul{list-style:none}caption,th{text-align:left}h1,h2,h3,h4,h5,h6{font-size:100%}q:before,q:after{content:''}table{width:100%;text-align:left;font-size:11px;font-family:arial;border-collapse:collapse;table-layout:fixed;}table th{font-weight:700;padding:4px 3px 4px 5px;border:1px solid #d0d0d0;border-left-color:#eee;background-color:#ededed}table tr.odd{background-color:#fff}table tr.even{background-color:#f9f9f9}table td{padding:4px 3px 4px 5px;border-style:none solid solid;border-width:1px;border-color:#ededed;text-overflow: ellipsis;overflow:hidden;white-space:nowrap;}@media print{body{margin:0;padding:0}}.group-header{border-bottom:2px solid #000;font-size:14px;}.group-header td{padding-top:15px;}",
        headerTpl: [
            '<tpl for=".">',
                '<th>{text}</th>',
            '</tpl>'
        ],

        bodyTpl: [
            '<tpl for=".">',
                '<tpl if="values.dataIndex">',
                    '<td>\{{[Ext.String.createVarName(values.dataIndex)]}\}</td>',
                '<tpl else>',
                    '<td>\{{[Ext.String.createVarName(values.id)]}\}</td>',
                '</tpl>',
            '</tpl>'
        ],

        //config: 
        // - columnFilter 
        // - columnFilterScope
        // - includeHidden
        // - copyStylesheets
        // - ignoreRowBody
        // - includeGroupField
        // - currentPageOnly
        // - stylesheets
        // - printStyle
        // - gridWidth
        // - columnsWidth
        // - userStyle
        print: function (grid, config) {
            if (!grid) {
                throw "Grid is undefined";
            }

            config = config || {};

            var groupingFeature = grid.groupingFeature,
                groupField = groupingFeature && groupingFeature.getGroupField(),
                isGrouped = grid.store.isGrouped(),
                rowBodyFeature = grid.view.rowBodyFeature,
                rowBody,
                columns = grid.headerCt.getGridColumns(),
                data,
                resPath,
                stylesheets,
                parent_ss,
                tableHeader,
                body;

            columns = this.getColumns(columns);
            columns = this.filterColumns(columns, isGrouped, groupField, config);
            data = this.convertData(grid, columns, config);
            resPath = Ext.net.ResourceMgr.cdnPath || Ext.net.ResourceMgr.resourcePath;
            stylesheets = [];
            stylesheets = stylesheets.concat(this.stylesheets || []);
            stylesheets = stylesheets.concat(config.stylesheets || []);

            if (this.get("copyStylesheets", config) !== false) {
                parent_ss = this.getStylesheets();
            }

            tableHeader = this.getTableHeader(columns);

            if (rowBodyFeature && this.get("ignoreRowBody", config) !== true) {
                rowBody = this.getRowBody(rowBodyFeature, columns);
            }

            body = this.getBody(grid, columns, data, rowBody);

            this.doPrint(this.getHtml(grid, parent_ss, tableHeader, body, rowBody, isGrouped, config, columns, {
                data: data,
                stylesheets: stylesheets,
                title: grid.title || this.title
            }));
        },

        getColumns: function (gridColumns) {
            var i,
                c,
                len,
                columns = [];

            for (i = 0, len = gridColumns.length; i < len; i++) {
                c = gridColumns[i];
                if (c.items.length > 0 && !c.isComponentHeader) {
                    columns = columns.concat(c.items.items);
                } else {
                    columns.push(c);
                }
            }

            return columns;
        },

        filterColumns: function (columns, isGrouped, groupField, config) {
            var temp = [],
                i,
                len,
                result,
                c,
                includeHidden = this.get("includeHidden", config),
                includeGroupField = this.get("includeGroupField", config),
                columnFilter = this.get("columnFilter", config),
                columnFilterScope = this.get("columnFilterScope", config);

            for (i = 0, len = columns.length; i < len; i++) {
                c = columns[i];

                if (columnFilter) {
                    result = columnFilter.call(columnFilterScope, c);
                    if (Ext.isDefined(result)) {
                        if (result === true) {
                            temp.push(c);
                        }
                        continue;
                    }
                }

                if (c.isXType("commandcolumn") ||
                    c.isXType("componentcolumn") ||
                    c.isXType("imagecommandcolumn") ||
                    c.isXType("actioncolumn")) {
                    continue;
                }

                if (c.dataIndex &&
                    (!c.hidden || includeHidden) &&
                    (!isGrouped || c.dataIndex !== groupField || includeGroupField)) {
                    temp.push(c);
                }
                else if (c.isXType("templatecolumn")) {
                    temp.push(c);
                }
                else if (c.isXType("rownumberer")) {
                    c.text = "№";
                    temp.push(c);
                }
            }
            return temp;
        },

        convertData: function (grid, columns, config) {
            var data = [];
            Ext.each(this.get("currentPageOnly", config) ? grid.store.getRange() : grid.store.getAllRange(), function (record, index) {
                var item = Ext.apply({}, record.data),
                    i,
                    len,
                    c,
                    meta,
                    value;

                for (i = 0, len = columns.length; i < len; i++) {
                    c = columns[i];

                    if (c.dataIndex) {
                        value = record.data[c.dataIndex];
                        meta = { tdCls: "", tdAttr: "", style: "" };

                        value = c.renderer ? c.renderer.call(c, value, meta, record, index, i, grid.store, grid.view) : value;
                        item[Ext.String.createVarName(c.dataIndex)] = value;
                    }
                    else if (c.isXType("rownumberer")) {
                        meta = { tdCls: "", tdAttr: "", style: "" };
                        item[Ext.String.createVarName(c.id)] = c.renderer.call(c, null, meta, record, index, i, grid.store, grid.view); //index + 1;
                    }
                    else if (column.isXType("templatecolumn")) {
                        value = c.tpl ? c.tpl.apply(record.data) : value;
                        item[Ext.String.createVarName(c.id)] = value;
                    }
                }
                item.__internalId = record.internalId;
                data.push(item);
            });

            return data;
        },

        getStylesheets: function () {
            var doc_ss = document.styleSheets,
                ss,
                parent_ss = [],
                i,
                g,
                len;

            for (i = 0; i < doc_ss.length; i++) {
                ss = doc_ss[i];

                if (ss.id == "ext-theme" ||
                    ss.id == "extnet-styles" ||
                    ss.id == "extnet-resetstyles" ||
                    ss.id == "extnet-resources") {
                    continue;
                }

                try {
                    if (!Ext.isIE) {
                        for (g = 0, len = ss.cssRules.length; g < len; g++) {
                            parent_ss.push(ss.cssRules[g].cssText);
                        }
                    } else {
                        parent_ss.push(ss.cssText);
                    }
                }
                catch (e) {
                }
            }

            return parent_ss.join("");
        },

        getRowBody: function (rowBodyFeature, columns) {
            return '{[ this.getBodyContent(this.view, values, xindex, this.colSpan) ]}';
        },

        getBodyContent: function (view, data, index, colSpan) {
            var values = {};
            view.rowBodyFeature.setupRowData(data.__internalId ? view.store.getByInternalId(data.__internalId) : data, index, values);

            return ([
                '<td colspan="' + colSpan + '" class="' + (values.rowBodyCls || "") + '">',
                    '<div class="x-grid-rowbody ' + (values.rowBodyDivCls || "") + '">' + (values.rowBody || "") + '</div>',
                '</td>'
            ].join(""));
        },

        get: function (name, config) {
            return Ext.isDefined(config[name]) ? config[name] : this[name];
        },

        doPrint: function (html) {
            var win = window.open('', 'printgrid');
            win.document.open();
            win.document.write(html);
            win.document.close();
            win.print();
            win.close();
        },

        getTableHeader: function (columns) {
            return Ext.create('Ext.XTemplate', this.headerTpl).apply(columns);
        },

        getTableDefinition: function (grid, columns, config) {
            var buffer = ["<table"],
                gridWidth = this.get("gridWidth", config),
                columnsWidth = this.get("columnsWidth", config);

            if (!Ext.isDefined(gridWidth) && columnsWidth) {
                gridWidth = true;
            }

            if (gridWidth) {
                buffer.push(" style=\"width:");
                buffer.push(grid.getWidth());
                buffer.push("px;\"");
            }

            buffer.push(">");

            if (columnsWidth) {
                for (var i = 0; i < columns.length; i++) {
                    buffer.push("<colgroup><col style=\"width: ");
                    buffer.push(columns[i].getWidth());
                    buffer.push("px;\"></colgroup>");
                }
            }

            return buffer.join("");
        },

        getHtml: function (grid, styles, headers, body, rowBody, isGrouped, config, columns, data) {
            var printStyle = this.get("printStyle", config),
                userStyle = this.get("userStyle", config),

                stylesheets = Ext.create('Ext.XTemplate', [
                    '<tpl for=".">',
                        '<link href="{.}" rel="stylesheet" type="text/css" media="screen,print" />',
                    '</tpl>',
                ]).apply(data.stylesheets),

                tableDefinition = this.getTableDefinition(grid, columns, config),

                table = isGrouped ?
                    [
                        tableDefinition,
                          '<tr>',
                            headers,
                          '</tr>',
                           body,
                        '</table>'
                    ].join("") :

                    Ext.create('Ext.XTemplate', [
                        tableDefinition,
                          '<tr>',
                            headers,
                          '</tr>',
                            '<tpl for=".">',
                               '<tr class="{[xindex % 2 === 0 ? "even" : "odd"]}">',
                                  body,
                               '</tr>',
                               '<tr class="{[xindex % 2 === 0 ? "even" : "odd"]}">',
                               (rowBody || ""),
                               '</tr>',
                            '</tpl>',
                        '</table>',
                        {
                            view: grid.view,
                            getBodyContent: this.getBodyContent,
                            colSpan: columns.length
                        }
                    ]).apply(data.data);


            return [
                '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
                '<html>',
                  '<head>',
                    '<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />',
                    '<title>' + (data.title || "") + '</title>',
                    (stylesheets || ""),
                    '<style type="text/css">',
                        (styles || ""),
                        (printStyle || ""),
                        (userStyle || ""),
                    '</style>',
                  '</head>',
                  '<body>',
                    (this.get("beforeBody", config) || ""),
                    (table || ""),
                    (this.get("afterBody", config) || ""),
                  '</body>',
                '</html>'
            ].join("");
        },

        getBody: function (grid, columns, data, rowBody) {

            var groups,
                fields = grid.store.getModel().getFields(),
                groupField,
                header,
                feature,
                body;

            if (grid.store.isGrouped()) {
                groups = grid.store.getGroups();
                feature = grid.groupingFeature;
                header = feature.refreshData.header;
                groupField = feature.getGroupField();

                if (!fields || !groupField) {
                    return;
                }

                //fields = fields.filter( function(field) {
                //    return !!Ext.Array.findBy(columns, function (c) {
                //        return c.dataIndex == field.name;
                //    });
                //});

                var bodyTpl = [
                    '<tpl for=".">',
                        '<tr class="group-header">',
                            '<td colspan="{[this.colSpan]}">',
                              (feature.groupHeaderTpl.html || ''),
                            '</td>',
                        '</tr>',
                        '<tpl for="items">',
                            '<tr class="{[xindex % 2 === 0 ? "even" : "odd"]}">',
                                '<tpl for="this.columns">',
                                    '<td>',
                                      '{[ this.getValue(parent, Ext.String.createVarName(values.dataIndex || values.id)) ]}',
                                    '</td>',
                                '</tpl>',
                            '</tr>',
                            '<tr class="{[xindex % 2 === 0 ? "even" : "odd"]}">',
                                 (rowBody || ""),
                            '</tr>',
                        '</tpl>',
                    '</tpl>',
                    {
                        getBodyContent: this.getBodyContent,
                        view: grid.view,
                        columns: columns,
                        fields: fields,
                        colSpan: columns.length,
                        getValue: function (record, name) {
                            return record.convertedData[name];
                        }
                    }
                ];

                groups.each(function (group) {
                    group.groupField = groupField;
                    group.groupValue = group.getGroupKey();
                    group.name = group.getGroupKey();
                    group.columnName = header ? header.text : groupField;
                    group.rows = group.items;

                    Ext.each(group.items, function (record) {
                        var i, len;

                        for (i = 0, len = data.length; i < len; i++) {
                            if (data[i].__internalId == record.internalId) {
                                record.convertedData = data[i];
                                return;
                            }
                        }
                    });
                });

                body = Ext.create('Ext.XTemplate', bodyTpl).apply(groups.items);

                groups.each(function (group) {
                    delete group.groupField;
                    delete group.groupValue;
                    delete group.columnName;
                    delete group.name;
                    delete group.rows;

                    Ext.each(group.items, function (record) {
                        delete record.convertedData;
                    });
                });
            }
            else {
                body = Ext.create('Ext.XTemplate', this.bodyTpl).apply(columns);
            }

            return body;
        }
    }
});