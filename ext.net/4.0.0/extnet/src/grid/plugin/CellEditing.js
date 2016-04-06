
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
            editor = editors.getByKey(editorId);

        if (!editor) {
            editor = column.getEditor(record);
            if (!editor) {
                return false;
            }

            // Allow them to specify a CellEditor in the Column
            if (editor instanceof Ext.grid.CellEditor) {
                Ext.applyIf(editor, {
                    floating: true,
                    editorId: editorId
                });
            }
            // But if it's just a Field, wrap it.
             else {
                editor = new Ext.grid.CellEditor({
                    floating: true,
                    editorId: editorId,
                    field: editor
                });
            }

            // Add the Editor as a floating child of the grid
            // Prevent this field from being included in an Ext.form.Basic
            // collection, if the grid happens to be used inside a form
            editor.field.excludeForm = true;

            // If the editor is new to this grid, then add it to the grid, and ensure it tells us about its life cycle.
            if (editor.column !== column) {
                editor.column = column;
                editor.on({
                    scope: me,
                    complete: me.onEditComplete,
                    canceledit: me.cancelEdit
                });
                column.on('removed', me.onColumnRemoved, me);
            }
            editors.add(editor);
        }

        // Inject an upward link to its owning grid even though it is not an added child.
        editor.ownerCmp = me.grid.ownerGrid;
        
        if (column.isTreeColumn) {
            editor.isForTree = column.isTreeColumn;
            editor.addCls(Ext.baseCSSPrefix + 'tree-cell-editor');
        }

        // Set the owning grid.
        // This needs to be kept up to date because in a Lockable assembly, an editor
        // needs to swap sides if the column is moved across.
        editor.setGrid(me.grid);

        // Keep upward pointer correct for each use - editors are shared between locking sides
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