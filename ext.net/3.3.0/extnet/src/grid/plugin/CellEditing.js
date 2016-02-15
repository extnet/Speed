// @source grid/plugin/CellEditing.js

Ext.grid.plugin.CellEditing.override({
    getColumnField: function (columnHeader, defaultField, record) {
        if (columnHeader instanceof Ext.grid.column.Check
           || columnHeader instanceof Ext.grid.column.Action
           || columnHeader instanceof Ext.grid.RowNumberer
           /*|| columnHeader instanceof Ext.grid.column.CommandColumn
           || columnHeader instanceof Ext.grid.column.ComponentColumn
           || columnHeader instanceof Ext.grid.column.ImageCommand*/) {
            return;
        }

        var field = columnHeader.field;

        if (!field && columnHeader.editor) {
            field = columnHeader.editor;
            delete columnHeader.editor;
        }

        if (!field && defaultField) {
            field = defaultField;
        }

        if (!field || this.fieldFromEditors) {
            if (columnHeader.editors) {
                field = this.getFromEditors(record, columnHeader, columnHeader.editors, columnHeader.editorStrategy, columnHeader);
                this.fieldFromEditors = false;
            }

            if ((!field || this.fieldFromEditors) && this.grid.editors) {
                field = this.getFromEditors(record, columnHeader, this.grid.editors, this.grid.editorStrategy, this.grid);
            }

            this.fieldFromEditors = true;
        }

        if (field) {
            if (Ext.isString(field)) {
                field = { xtype: field };
            }
            if (!field.isFormField) {
                field = Ext.ComponentManager.create(field, this.defaultFieldXType);
            }
            columnHeader.field = field;

            Ext.apply(field, {
                name: columnHeader.dataIndex
            });

            columnHeader.activeEditorId = field instanceof Ext.grid.CellEditor ? field.field.getItemId() : field.getItemId();

            return field;
        }
    },

    getFromEditors: function (record, column, editors, editorStrategy, scope) {
        var editor,
            index;

        if (editorStrategy) {
            editor = editorStrategy.call(scope, record, column, editors, this.grid);

            if (Ext.isNumber(editor)) {
                index = editor;
                editor = editors[index];
            }

            index = Ext.Array.indexOf(editors, editor);
        } else {
            editor = editors[0];
            index = 0;
        }

        if (editor && !(editor instanceof Ext.grid.CellEditor)) {
            if (!(editor instanceof Ext.form.field.Base)) {
                editor = Ext.ComponentManager.create(editor, 'textfield');
            }
            editor = editors[index] = new Ext.grid.CellEditor({
                field: editor,
                floating: true
            });
        }

        if (editor) {
            Ext.applyIf(editor, {
                editorId: editor.field.getItemId(),
                editingPlugin: this,
                //ownerCt: this.grid,
                floating: true
            });
        }

        return editor;
    },

    getEditor: function (record, column) {
        var me = this,
            editors = me.editors,
            editorId = me.getEditorId(column),
            editor = editors.getByKey(editorId),
            // Add to top level grid if we are editing one side of a locking system
            editorOwner = column.getView();

        if (!editor) {
            editor = column.getEditor(record);
            if (!editor) {
                return false;
            }

            // Allow them to specify a CellEditor in the Column
            if (!(editor instanceof Ext.grid.CellEditor)) {
                editor = new Ext.grid.CellEditor({
                    floating: true,
                    editorId: editorId,
                    field: editor
                });
            } else {
                Ext.applyIf(editor, {
                    floating: true,
                    editorId: editorId
                });
            }

            // Add the Editor as a floating child of the grid
            editor.field.excludeForm = true;

            if (editor.ownerCmp !== editorOwner) {
                editor.ownerCmp = editorOwner;
                editor.on({
                    scope: me,
                    specialkey: me.onSpecialKey,
                    complete: me.onEditComplete,
                    canceledit: me.cancelEdit
                });
                column.on('removed', me.onColumnRemoved, me);
            }
            editors.add(editor);
        }

        if (column.isTreeColumn) {
            editor.isForTree = column.isTreeColumn;
            editor.addCls(Ext.baseCSSPrefix + 'tree-cell-editor');
        }
        editor.setGrid(me.grid);

        editor.editingPlugin = me;
        return editor;
    },

    initFieldAccessors: function (columns) {
        if (columns.isGroupHeader) {
            columns = columns.getGridColumns();
        }
        else if (!Ext.isArray(columns)) {
            columns = [columns];
        }

        var me = this,
            c,
            cLen = columns.length,
            column;

        for (c = 0; c < cLen; c++) {
            column = columns[c];

            if (!column.getEditor) {
                column.getEditor = function (record, defaultField) {
                    return me.getColumnField(this, defaultField, record);
                };
            }
            if (!column.hasEditor) {
                column.hasEditor = function () {
                    return me.hasColumnField(this);
                };
            }
            if (!column.setEditor) {
                column.setEditor = function (field) {
                    me.setColumnField(this, field);
                };
            }
        }
    },

    getEditorId: function (column) {
        return column.activeEditorId || column.getItemId();
    }
});