// @source src/grid/Column/CheckColumn.js

Ext.grid.column.Check.override({
    processEvent: function (type, view, cell, recordIndex, cellIndex, e, record, row) {
        var me = this,
            key = type === "keydown" && e.getKey(),
            mousedown = type === "mousedown";

        // Flag event to tell SelectionModel not to process it.
        e.stopSelection = !key && me.stopSelection;

        if (!me.disabled && !!me.editable && (mousedown || (key === e.ENTER || key === e.SPACE))) {
            var store = view.panel.store,
                dataIndex = me.dataIndex,
                checked = !me.isRecordChecked(record),
                eventTarget = view.panel.editingPlugin || view.panel;

            var ev = {
                grid   : view.panel,
                record : record,
                field  : dataIndex,
                value  : !checked,
                row    : row,
                column : me,
                rowIdx : recordIndex,
                colIdx : cellIndex,
                cancel : false
            };

            // Allow apps to hook beforecheckchange, beforeedit
            if (me.fireEvent("beforecheckchange", me, recordIndex, record, checked) === false
	            || eventTarget.fireEvent("beforeedit", eventTarget, ev) === false
		        || ev.cancel === true) {

                return;
            }

            ev.originalValue = ev.value;
            ev.value = checked;

            if (eventTarget.fireEvent("validateedit", eventTarget, ev) === false || ev.cancel === true) {
                return;
            }

            if (me.singleSelect) {
                store.suspendEvents();

                store.each(function (record, i) {
                    var value = (i == recordIndex);

                    if (value != me.isRecordChecked(record)) {
                        record.set(dataIndex, value);
                    }
                });

                store.resumeEvents();
                store.fireEvent("datachanged", store);
            } else {
                me.setRecordCheck(record, checked, cell, row, e);
            }

            me.fireEvent("checkchange", me, recordIndex, record, checked);
            eventTarget.fireEvent("edit", eventTarget, ev);
        } else {
            return this.callSuper(arguments);
        }
    }
});

