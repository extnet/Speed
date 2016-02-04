// @source core/form/Field.js

Ext.form.field.Base.override({
    isRemoteValidation: false,
    remoteValidatingMessage: "Validating...",

    initComponent: function () {
        this.callParent(arguments);

        this.remoteValidationSuccess = Ext.Function.bind(this.remoteValidationSuccess, this);
        this.remoteValidationFailure = Ext.Function.bind(this.remoteValidationFailure, this);

        if (this.isRemoteValidation) {
            this.activateRemoteValidation();
        }
    },

    getName : function () {
        if (this.name) {
            return this.name;
        } else if (this.hasId()) {
            return this.id;
        }
    },

    onRender: function (el) {
        this.callParent(arguments);
        if (this.inputEl && this.submitValue === false) {
            this.inputEl.dom.name = "";
            this.inputEl.dom.removeAttribute('name');
        }
    },

    onBlur: function () {
        if (this.inEditor && this.surpressBlur) {
            return;
        }

        this.callParent(arguments);
    },

    getRawValue: function () {
        var me = this,
            v = (me.inputEl ? me.inputEl.getValue() : Ext.valueFrom(me.rawValue || me.value, ''));
        me.rawValue = v;
        return v;
    },

    getErrors: function (value) {
        var me = this,
            errors = [],
            validator = me.validator,
            vtype = me.vtype,
            vtypes = Ext.form.field.VTypes,
            validationField = this.getValidationField(),
            validation = this.getValidation(),
            msg, trimmed, isStr, result;

        if (validationField) {
            result = validationField.validate(value);
            if (result !== true) {
                errors.push(result);
            }
        }

        if (validation && validation !== true) {
            errors.push(validation);
        }

        value = (value || value === 0) ? value : me.getRawValue();

        if (Ext.isFunction(validator)) {
            msg = validator.call(me, value, me.vtypeParams);
            if (msg !== true) {
                errors.push(Ext.isString(msg) ? msg : (me.validatorText || "Value is invalid"));
            }
        }

        isStr = Ext.isString(value);
        trimmed = (me.allowOnlyWhitespace || !isStr) ? value : Ext.String.trim(value);

        if (!me.validateBlank && ((isStr && trimmed.length < 1) || (value === me.emptyText && me.valueContainsPlaceholder))) {
            return errors;
        }

        if (vtype) {
            if (!vtypes[vtype](value, me, me.vtypeParams)) {
                errors.push(me.vtypeText || vtypes[vtype + 'Text']);
            }
        }

        return errors;
    },

    /***Remote validation**********/

    activateRemoteValidation: function () {
        this.originalIsValid = this.isValid;
        this.originalValidate = this.validate;

        this.isValid = this.rv_isValid;
        this.validate = this.rv_validate;

        this.rvConfig = Ext.apply({
            remoteValidated: false,
            remoteValid: false,
            validationEvent: "change",
            eventOwner: "field",
            validationBuffer: 500,
            showBusy: true,
            busyIconCls: "x-loading-indicator",
            busyTip: "Validating...",
            initValueValidation: "valid",
            errorMessage: "Invalid",
            responseFields: {
                success: "valid",
                message: "message",
                returnValue: "value"
            }
        }, this.remoteValidationOptions || {});

        var fn = function () {
            this.rvTask = new Ext.util.DelayedTask(this.remoteValidate, this);

            if (this.rvConfig.validationEvent && this.rvConfig.validationEvent.indexOf(",") > 0) {
                this.rvConfig.validationEvent = this.rvConfig.validationEvent.split(",");
            }

            if (Ext.isArray(this.rvConfig.validationEvent)) {
                Ext.each(this.rvConfig.validationEvent, function (event) {
                    (this.rvConfig.eventOwner == "input" ? this.inputEl : this).on(event, this.performRemoteValidation, this);
                }, this);
            }
            else {
                (this.rvConfig.eventOwner == "input" ? this.inputEl : this).on(this.rvConfig.validationEvent, this.performRemoteValidation, this);
            }
        };

        if (this.rendered) {
            fn.call(this);
        } else {
            this.on("render", fn);

            this.on("afterrender", function () {
                //if (this.value !== undefined) {
                switch (this.rvConfig.initValueValidation) {
                    case "valid":
                        this.markAsValid();
                        break;
                    case "invalid":
                        // do nothing
                        break;
                    case "validate":
                        this.remoteValidate();
                        break;
                }
                //}
            });
        }
    },

    // private, does not work for all fields
    append: function (v) {
        this.setValue([this.getValue(), v].join(''));
    },

    deactivateRemoteValidation: function () {
        this.isValid = this.originalIsValid;
        this.validate = this.originalValidate;

        if (this.rvTask) {
            this.rvTask.cancel();
        }

        if (Ext.isArray(this.rvConfig.validationEvent)) {
            Ext.each(this.rvConfig.validationEvent, function (event) {
                (this.rvConfig.eventOwner == "input" ? this.inputEl : this).un(event, this.performRemoteValidation, this);
            }, this);
        }
        else {
            (this.rvConfig.eventOwner == "input" ? this.inputEl : this).un(this.rvConfig.validationEvent, this.performRemoteValidation, this);
        }

        delete this.originalIsValid;
        delete this.originalValidate;
    },

    // this method is used with remote validation only
    markAsValid: function (abortRequest) {
        if (!this.isRemoteValidation) {
            return;
        }

        this.rvConfig.validating = false;
        this.rvConfig.remoteValidated = true;
        this.rvConfig.remoteValid = true;

        if (this.validationId && abortRequest !== false) {
            Ext.net.DirectEvent.abort(this.validationId);
        }
    },

    rv_isValid: function () {
        if (this.disabled) {
            return true;
        }

        if (this.rvConfig.validating) {
            preventMark = true;
        }

        return this.originalIsValid.call(this) && !this.rvConfig.validating && this.rvConfig.remoteValidated && this.rvConfig.remoteValid;
    },

    localValidate: function () {
        var me = this,
            isValid = me.originalIsValid.call(me);

        if (isValid !== me.wasValid) {
            me.wasValid = isValid;
            me.fireEvent('validitychange', me, isValid);
        }

        return isValid;
    },

    rv_validate: function () {
        var clientValid = this.localValidate(),
            orgPrevent;

        if (!this.disabled && !clientValid) {
            return false;
        }

        if (this.rvConfig.validating) {
            orgPrevent = this.preventMark;
            this.preventMark = true;
            this.markInvalid(this.remoteValidatingMessage);
            this.preventMark = orgPrevent;
            this.wasValid = false;
            this.fireEvent('validitychange', this, false);
            return false;
        }

        if (this.disabled || (clientValid && (!this.rvConfig.remoteValidated || this.rvConfig.remoteValid))) {
            if (!this.rvConfig.ignoreLastValue && this.rvConfig.lastValue === this.getValue() && this.rvConfig.remoteValid === false) {
                this.markInvalid(this.rv_response.message || this.rvConfig.errorMessage);
                this.wasValid = false;
                this.fireEvent('validitychange', this, false);
            } else {
                this.clearInvalid();
                this.wasValid = true;
                this.fireEvent('validitychange', this, true);
            }

            return this.rvConfig.remoteValid;
        }

        if (this.rvConfig.remoteValidated && !this.rvConfig.remoteValid) {
            orgPrevent = this.preventMark;
            this.preventMark = this.rvConfig.validating;
            this.markInvalid(this.rv_response.message || this.rvConfig.errorMessage);
            this.preventMark = orgPrevent;
            this.wasValid = this.rvConfig.validating;
            this.fireEvent('validitychange', this, this.rvConfig.validating);
            return false;
        }

        return false;
    },

    performRemoteValidation: function (e) {
        var orgPrevent = this.preventMark;
        this.preventMark = true;

        if ((this.rvConfig.lastValue === this.getValue() && !this.rvConfig.ignoreLastValue) || !this.originalIsValid(true)) {
            this.preventMark = orgPrevent;
            this.rvTask.cancel();
            return;
        }

        this.preventMark = orgPrevent;

        if (!e || !e.isNavKeyPress || (e && e.isNavKeyPress && !e.isNavKeyPress())) {
            if (e && e.normalizeKey) {
                var k = e.normalizeKey(e.keyCode);

                if (k >= 16 && k <= 20) {
                    return;
                }
            }

            this.rvTask.delay(this.rvConfig.validationBuffer);
        }
    },

    remoteValidate: function () {
        this.rvConfig.remoteValid = false;
        this.rvConfig.remoteValidated = false;

        var dc = Ext.apply({}, this.remoteValidationOptions),
            options = { params: {} };

        if (this.fireEvent("beforeremotevalidation", this, options) !== false) {
            dc.userSuccess = this.remoteValidationSuccess;
            dc.userFailure = this.remoteValidationFailure;
            dc.extraParams = Ext.apply(dc.extraParams || {}, options.params);
            dc.control = this;
            dc.eventType = "postback";
            dc.action = "remotevalidation";

            var o = {
                id: this.id,
                name: this.name,
                value: this.getValue()
            },
                directFn = dc.directFn;

            dc.serviceParams = Ext.encode(o);

            if (dc.url && !directFn) {
                dc.cleanRequest = true;

                if (dc.json && Ext.isEmpty(dc.method, false)) {
                    dc.method = "POST";
                }

                dc.extraParams = Ext.apply(dc.extraParams, o);
                dc.type = "load";
            }

            if (this.rvConfig.showBusy) {
                this.saveIndicator("remotevalidation", true);
                this.setIndicatorIconCls(this.rvConfig.busyIconCls, true);
                this.showIndicator();

                if (this.rvConfig.busyTip) {
                    this.setIndicatorTip(this.rvConfig.busyTip);
                }
            }

            this.rvConfig.remoteValidated = false;
            this.rvConfig.validating = true;
            this.rvConfig.lastValue = o.value;

            this.wasValid = false;
            this.fireEvent('validitychange', false);

            if (this.validationId) {
                this.validationId.abortedByEvent = true;

                try {
                    Ext.net.DirectEvent.abort(this.validationId);
                } catch (e) { }
            }

            if (directFn) {
                if (Ext.isString(directFn)) {
                    directFn = Ext.decode(directFn);
                }

                var extraParams = dc.extraParams;

                delete dc.extraParams;
                delete dc.serviceParams;
                delete dc.control;
                delete dc.eventType;
                delete dc.action;

                dc.successSeq = dc.userSuccess;
                dc.failureSeq = dc.userFailure;

                delete dc.userSuccess;
                delete dc.userFailure;
                dc.showFailureWarning = false;

                if (directFn.length === 2) {
                    this.validationId = directFn(o.value, dc);
                }
                else if (directFn.length === 3) {
                    this.validationId = directFn(o.value, o.name, dc);
                }
                else if (directFn.length === 4) {
                    this.validationId = directFn(o.value, o.name, o.id);
                }
                else {
                    this.validationId = directFn(o.value, o.name, o.id, extraParams || null, dc);
                }
            }
            else {
                this.validationId = Ext.net.DirectEvent.request(dc);
            }
        }
    },

    remoteValidationSuccess: function (response, result, context, type, action, extraParams, o) {
        var isException = false,
            responseObj;

        this.rvConfig.validating = false;
        this.validationId = null;

        if (this.rvConfig.showBusy) {
            //this.preserveIndicatorIcon = false;
            this.restoreIndicator("remotevalidation");
        }

        try {
            if (this.remoteValidationOptions && this.remoteValidationOptions.directFn) {
                responseObj = Ext.isEmpty(result.result, true) ? (result.d || result) : result.result;

                if (Ext.isString(responseObj)) {
                    result = {
                        success: false,
                        message: responseObj
                    };
                }
                else if (Ext.isBoolean(responseObj)) {
                    result = {
                        success: responseObj
                    };
                }
                else {
                    result = responseObj;
                }
            }
            else {
                responseObj = result.serviceResponse || result.d || result;

                result = {
                    success: responseObj[this.rvConfig.responseFields.success],
                    message: responseObj[this.rvConfig.responseFields.message],
                    value: responseObj[this.rvConfig.responseFields.returnValue]
                };
            }
        } catch (ex) {
            result = {
                success: false,
                message: ex.message
            };

            isException = true;

            this.rvConfig.remoteValidated = true;
            this.rvConfig.remoteValid = false;

            this.fireEvent("remotevalidationinvalid", this, response, responseObj, ex, o);

            if (o.cancelWarningFailure !== true &&
              (this.remoteValidationOptions || {}).showWarningFailure !== false &&
              !this.hasListener("remotevalidationinvalid")) {
                Ext.net.DirectEvent.showFailure(response, response.responseText);
            }

            return;
        }

        if (!isException && result.success !== true) {
            this.fireEvent("remotevalidationinvalid", this, response, responseObj, result, o);
        }

        if (result.success === true) {
            this.fireEvent("remotevalidationvalid", this, response, responseObj, result, o);
        }

        if (result.value !== null && Ext.isDefined(result.value)) {
            this.setValue(result.value);
        }

        this.rvConfig.remoteValidated = true;
        this.rvConfig.remoteValid = result.success;
        this.rv_response = result;
        this.validate();
    },

    remoteValidationFailure: function (response, result, context, type, action, extraParams, o) {
        if (response.request.abortedByEvent) {
            return;
        }

        this.validationId = null;

        if (this.rvConfig.showBusy) {
            this.restoreIndicator("remotevalidation");
        }

        this.fireEvent("remotevalidationfailure", this, response, { message: response.statusText }, o);

        this.rvConfig.validating = false;
        this.rvConfig.remoteValidated = true;
        this.rvConfig.remoteValid = false;
        this.rv_response = {
            success: false,
            message: response.responseText
        };

        this.wasValid = false;
        this.fireEvent('validitychange', false);

        if (o.cancelWarningFailure !== true &&
            (this.remoteValidationOptions || {}).showWarningFailure !== false &&
            !this.hasListener("remotevalidationfailure")) {
            Ext.net.DirectEvent.showFailure(response, response.responseText);
        }
    }

    /***End of Remote validation***/
});