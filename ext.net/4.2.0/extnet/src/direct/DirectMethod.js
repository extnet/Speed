
// @source core/direct/DirectMethod.js

Ext.net.DirectMethod = {
    request : function (name, options) {
        options = options || {};

        if (typeof options !== "object") {
            /*LOCALIZE*/
            throw { message : "The DirectMethod options object is an invalid type: typeof " + typeof options };
        }

        var obj,
            encode;

        if (!Ext.isEmpty(name) && typeof name === "object") {
            options = name;
        }

        encode = Ext.isBoolean(options.encode) ? options.encode : Ext.net.DirectEvent.encode;
        
        if (options.params && options.json !== true && encode !== false) {
            for (var key in options.params) {
                if (options.params.hasOwnProperty(key)) {
                    obj = options.params[key];

                    if (obj === undefined) {
                        delete options.params[key];
                    }
                    else if (obj && typeof obj === "object") {
                        options.params[key] = Ext.encode(obj);
                    }
                }
            }
        }

        obj = {
            name                 : options.cleanRequest ? undefined : (options.name || name),
            cleanRequest         : options.cleanRequest,
            url                  : Ext.net.ResourceMgr.resolveUrl(options.url),
            control              : Ext.isEmpty(options.control) ? null : { id : options.control },
            eventType            : options.specifier || "public",
            requestType          : options.type || "submit",
            method               : options.method || "POST",
            eventMask            : options.eventMask,
            extraParams          : options.params,
            directMethodSuccess  : options.success,
            directMethodFailure  : options.failure,
            directMethodComplete : options.complete,
            viewStateMode        : options.viewStateMode,
            isDirectMethod       : true,
            encode               : encode,
            recursive            : Ext.isBoolean(options.recursive) ? options.recursive : Ext.net.DirectEvent.recursive,
            userSuccess          : function (response, result, control, eventType, action, extraParams, o) {
                if (o.successSeq) {
                    o.successSeq.call(o.userScope || o, response, result, control, eventType, action, extraParams, o);
                }
                
                result = !Ext.isDefined(result.result) ? (result.d || result) : result.result;
                
                if (!Ext.isEmpty(o.directMethodSuccess)) {
                    o.directMethodSuccess.call(o.userScope || o, result, response, extraParams, o);
                }
                
                if (!Ext.isEmpty(o.directMethodComplete)) {
                    o.directMethodComplete.call(o.userScope || o, true, result, response, extraParams, o);
                }
            },
            userFailure          : function (response, result, control, eventType, action, extraParams, o) {
                if (o.failureSeq) {
                    o.failureSeq.call(o.userScope || o, response, result, control, eventType, action, extraParams, o);
                }

                if (!Ext.isEmpty(o.directMethodFailure)) {
                    o.directMethodFailure.call(o.userScope || o, result.errorMessage, response, extraParams, o);
                } else if (o.showFailureWarning !== false && o.cancelFailureWarning !== true) {
                    Ext.net.DirectEvent.showFailure(response, result.errorMessage);
                }
                
                if (!Ext.isEmpty(o.directMethodComplete)) {
                    o.directMethodComplete.call(o.userScope || o, false, result.errorMessage, response, extraParams, o);
                }
            }
        };

        return Ext.net.DirectEvent.request(Ext.apply(options, obj));
    }
};