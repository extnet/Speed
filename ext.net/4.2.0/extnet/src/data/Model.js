Ext.data.Model.override({
    inheritableStatics: {
        replaceFields: function (newFields, removeFields) {
            var me = this,
                proto = me.prototype,
                Field = Ext.data.field.Field,
                fields = me.fields,
                fieldsMap = me.fieldsMap,
                ordinals = me.fieldOrdinals,
                field, i, idField, len, name, ordinal;

            if (removeFields === true) {
                fields.length = 0;
                me.fieldsMap = fieldsMap = {};
                me.fieldOrdinals = ordinals = {};
            } else if (removeFields) {
                for (i = removeFields.length; i-- > 0;) {
                    name = removeFields[i];
                    if (name in ordinals) {
                        delete ordinals[name];
                        delete fieldsMap[name];
                    }
                }

                for (i = 0, len = fields.length; i < len; ++i) {
                    name = (field = fields[i]).name;

                    if (name in ordinals) {
                        ordinals[name] = i;
                    } else {
                        // This field is being removed (it is no longer in ordinals).
                        fields.splice(i, 1);
                        --i;
                        --len;
                        // we need to do this forwards so that ordinals don't become
                        // invalid due to a splice
                    }
                }
            }

            for (i = 0, len = newFields ? newFields.length : 0; i < len; i++) {
                name = (field = newFields[i]).name;

                if (!(name in ordinals)) {
                    ordinals[name] = ordinal = fields.length; // 0-based
                    fields.push(field = Field.create(field));

                    fieldsMap[name] = field;
                    field.ordinal = ordinal;
                    field.definedBy = field.owner = this; // Ext.data.NodeInterface
                }
            }

            if (!(idField = fieldsMap[proto.idProperty])) {
                idField = new Field(proto.idProperty);
                ordinal = fields.length;
                fields[ordinal] = idField;
                ordinals[proto.idProperty] = ordinal;
                fieldsMap[proto.idProperty] = idField;
                idField.definedBy = this;
                idField.ordinal = ordinal;
                idField.generated = true;
            }

            // The idField could have been replaced, so reacquire it.
            me.idField = proto.idField = idField = fieldsMap[proto.idProperty];
            idField.allowNull = idField.critical = idField.identifier = true;
            idField.defaultValue = null;

            // In case we've created the initializer we need to zap it so we recreate it
            // next time. Likewise with field ranking.
            me.initializeFn = me.rankedFields = me.transientFields = me.criticalFields = null;
        }
    }
});