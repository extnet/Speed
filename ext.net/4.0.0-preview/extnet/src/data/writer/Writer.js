Ext.data.writer.Writer.override({
    $configStrict: false,

    constructor: function () {
        this.callParent(arguments);
        Ext.net.reconfigure(this, this.initialConfig, {
            writeAllFields: true
        });
    },

    write: function (request) {
        var operation = request.getOperation(),
            record,
            records = operation.getRecords() || [],
            len = records.length,
            i = 0,
            data = [];

        for (; i < len; i++) {
            record = records[i];

            if (this.filterRecord && this.filterRecord(record) === false) {
                continue;
            }

            data.push(this.getRecordData(record, operation));
        }
        return this.writeRecords(request, data);
    },

    isSimpleField: function (f) {
        var type = f ? f.getType() : "";

        return type === "int" || type === "float" || type === "boolean" || type === "date";
    },

    getRecordData: function (record, operation) {
        var me = this,
            nameProperty = me.getNameProperty(),
            mapping = nameProperty !== 'name',
            idField = record.self.idField,
            key = idField[nameProperty] || idField.name, // setup for idField first
            value = record.id,
            writeAll = me.getWriteAllFields(),
            phantom = record.phantom,
            ret, dateFormat, phantom,
            options, clientIdProperty,
            fieldsMap, data, field;

        if (idField.serialize) {
            value = idField.serialize(value);
        }

        if (!writeAll && operation && operation.isDestroyOperation) {
            ret = {};
            ret[key] = value;
        } else {
            dateFormat = me.getDateFormat();
            options = (phantom || writeAll) ? me.getAllDataOptions() : me.getPartialDataOptions();
            clientIdProperty = phantom && me.getClientIdProperty();
            fieldsMap = record.getFieldsMap();

            options.serialize = false; // we must take over this here
            data = record.getData(options);

            // If we are mapping we need to pour data into a new object, otherwise we do
            // our work in-place:
            ret = mapping ? {} : data;

            if (clientIdProperty) { // if (phantom and have clientIdProperty)
                ret[clientIdProperty] = value; // must read data and write ret
                delete data[key];  // in case ret === data (must not send "id")
            }
            else if (!me.getWriteRecordId()) {
                delete data[key];
            }

            for (key in data) {
                value = data[key];

                if (this.filterField && this.filterField(record, fieldsMap[key], key, value) === false) {
                    delete ret[key];
                    continue;
                }

                if (!(field = fieldsMap[key])) {
                    // No defined field, so clearly no nameProperty to look up for this field
                    // but if we are mapping we need to copy over the value. Also there is no
                    // serializer to call in this case.
                    if (mapping) {
                        ret[key] = value;
                    }
                } else {
                    // Allow this Writer to take over formatting date values if it has a
                    // dateFormat specified. Only check isDate on fields declared as dates
                    // for efficiency.
                    if (field.isDateField && dateFormat && Ext.isDate(value)) {
                        value = Ext.Date.format(value, dateFormat);
                    } else if (field.serialize) {
                        value = field.serialize(value, record);
                    }

                    if (mapping) {
                        key = field[nameProperty] || key;
                    }

                    if (Ext.isEmpty(value, false) && this.isSimpleField(field)) {
                        switch (field.submitEmptyValue) {
                            case "null":
                                value = null;
                                break;
                            case "emptystring":
                                value = "";
                                break;
                        }
                    } else {
                        value = this.htmlEncode || field.htmlEncode ? Ext.util.Format.htmlEncode(value) : value;
                    }

                    ret[key] = value;
                }
            }
        }

        if ((this.excludeId && ret.hasOwnProperty(idField.name)) ||
           (this.skipIdForPhantomRecords !== false && ret.hasOwnProperty(idField.name) && phantom)) {
            delete ret[idField.name];
        }

        if (this.skipPhantomId && phantom && ret.hasOwnProperty(me.getClientIdProperty())) {
            delete ret[record.clientIdProperty];
        }

        return ret;
    }
});