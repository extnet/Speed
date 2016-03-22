
// @source core/form/BasicForm.js

Ext.form.action.Load.override({
    onSuccess: function (response) {
        var result = this.processResponse(response),
            form = this.form,
            formActive = form && !form.destroying && !form.destroyed;

        if (result === true || !result.success || !result.data) {
            if (this.simpleObject && result !== true) {
                result = {data: result};
            } else {
                this.failureType = Ext.form.action.Action.LOAD_FAILURE;

                if (formActive) {
                    form.afterAction(this, false);
                }

                return;
            }
        }

        if (formActive) {
            form.clearInvalid();
            form.setValues(result.data);
            form.afterAction(this, true);
        }
    }
});

Ext.form.action.Submit.override({
    onSuccess: function(response){
        if (this.allowNoContent && response.status === 204 || response.status === 202 || response.status === 1223) {
            this.form.afterAction(this, true);
        } else {
            this.callParent(arguments);
        }
    }
});

Ext.form.Basic.override({
    prefixRegex : /[^.]+$/,

    onFieldAdd: function (field) {
        var me = this;
        me.mon(field, 'change', me.fireFieldChange, me);
        me.callParent(arguments);
    }, 

    onFieldRemove: function (field) {
        var me = this;
        me.mun(field, 'change', me.fireFieldChange, me);
        me.callParent(arguments);
    },

    fireFieldChange: function (field, newValue, oldValue) {
        var me = this;
        me.owner.fireEvent('fieldchange', me.owner, field, newValue, oldValue);
    },

    removePrefix : function (name) {
        if (Ext.isEmpty(name) || !Ext.net.ResourceMgr.isMVC) {
            return name;
        }

        var match = name.match(this.prefixRegex);
        return match ? match[0] : name;
    },
    
    findField: function (id) {
        var withoutPrefixId = this.removePrefix(id);
        return this.getFields().findBy(function (f) {            
            return (
                f.getItemId() === id || f.getName() === id 
                || (f.dataIndex && (id.indexOf(".") > -1 ? (f.dataIndex === id) : (f.dataIndex.split(".")[0] === id))) 
                || this.removePrefix(f.getName()) === withoutPrefixId);
        }, this);
    },

    findMappingFields: function (id) {        
        var fields = [];
        this.getFields().each(function (f) {            
            if(f.dataIndex && f.dataIndex.split(".")[0] === id) {
                fields.push(f);
            }
        }, this);

        return fields;
    },

    getFieldValues: function (dirtyOnly, removePrefix, disableMapping) {
        return this.getValues(false, dirtyOnly, false, true, removePrefix, disableMapping);
    },

    setValues: function (values) {
        var me = this,
            v, vLen, val;

        function setVal(fieldId, val) {
            var field = me.findField(fieldId),
                map_fields,
                notFound,
                v;

            if (field) {
                var mapping = field.dataIndex && field.dataIndex.split(".");
                if (mapping && mapping[0] === fieldId) {
                    map_fields = me.findMappingFields(fieldId);
                    
                    for ( var f = 0; f < map_fields.length; f++ ) {
                        field = map_fields[f];
                        mapping = field.dataIndex && field.dataIndex.split(".");
                        v = val;
                        notFound = false;

                        for (var i = 1; i < mapping.length; i++ ) {
                            if (v.hasOwnProperty(mapping[i])) {
                                v = v[mapping[i]];
                            }
                            else {
                                notFound = true;
                                break;
                            }
                        }

                        if(!notFound) {
                            field.setValue(v);

                            if (me.trackResetOnLoad) {
                                field.resetOriginalValue();
                            }
                        }
                    }                    
                }
                else {                
                    field.setValue(val);

                    if (me.trackResetOnLoad) {
                        field.resetOriginalValue();
                    }
                }
            }
        }

        Ext.suspendLayouts();
        if (Ext.isArray(values)) {            
            vLen = values.length;

            for (v = 0; v < vLen; v++) {
                val = values[v];

                setVal(val.id, val.value);
            }
        } else {        
            Ext.iterate(values, setVal);
        }
        Ext.resumeLayouts(true);
        return this;
    },

    getValues: function (asString, dirtyOnly, includeEmptyText, useDataValues, isSubmitting, removePrefix, disableMapping) {
        var values  = {},
            fields  = this.getFields().items,
            f,
            fLen    = fields.length,
            isArray = Ext.isArray,
            mapping,
            obj_holder,
            field, data, val, bucket, name, withoutPrefixName;

        for (f = 0; f < fLen; f++) {
            field = fields[f];

            if (!dirtyOnly || field.isDirty()) {
                data = field[useDataValues ? 'getModelData' : 'getSubmitData'](includeEmptyText, isSubmitting);

                if (Ext.isObject(data)) {
                    for (name in data) {
                        if (data.hasOwnProperty(name)) {
                            val = data[name];

                            if (includeEmptyText && val === '') {
                                val = field.emptyText || '';
                            }

                            withoutPrefixName = removePrefix === true ? this.removePrefix(name) : name;

                            if (useDataValues && disableMapping !== true && field.dataIndex) {
                                mapping = field.dataIndex.split(".");
                                obj_holder = values;

                                for (var i = 0; i < mapping.length - 1; i++) {
                                    if (!obj_holder.hasOwnProperty(mapping[i])) {
                                        obj_holder[mapping[i]] = {};
                                    }

                                    obj_holder = obj_holder[mapping[i]];
                                }

                                obj_holder[mapping[mapping.length - 1]] = val;
                            }
                            else {
                                if (!field.isRadio) {
                                    if (values.hasOwnProperty(withoutPrefixName)) {
                                        bucket = values[withoutPrefixName];

                                        if (!isArray(bucket)) {
                                            bucket = values[withoutPrefixName] = [bucket];
                                        }

                                        if (isArray(val)) {
                                            values[withoutPrefixName] = values[withoutPrefixName] = bucket.concat(val);
                                        } else {
                                            bucket.push(val);
                                        }
                                    } else {
                                        values[withoutPrefixName] = val;
                                    }
                                } else {
                                    values[withoutPrefixName] = values[withoutPrefixName] || val;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (asString) {
            values = Ext.Object.toQueryString(values);
        }
        return values;
    },

    updateRecord : function (record, disableMapping) {
        if (!record) {
            record = this._record;
        }

        var fields = record.self.fields,
            values = this.getFieldValues(false, true, disableMapping),
            obj = {},
            i = 0,
            len = fields.length,
            name;

        for (; i < len; ++i) {
            name  = fields[i].name;

            if (values.hasOwnProperty(name)) {
                obj[name] = values[name];
            }
        }

        record.beginEdit();
        record.set(obj);
        record.endEdit();

        return this;
    },

    afterAction: function (action, success) {
        this.callParent(arguments);

        if (action.result && action.result.script && action.result.script.length > 0) {
            if (window.execScript) {
                window.execScript(action.result.script);
            } else {
                window.eval.call(window, action.result.script);
            }
        }
    },

    getBoundRecord : function () {
        return this._record;
    }
});