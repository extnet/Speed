
// @source core/direct/DirectEvent.js

Ext.net.DirectEvent = new Ext.data.Connection();

Ext.net.DirectEvent.addListener({
    beforerequest: {
        fn: function (conn, options) {
            var o = options || {},
                key,
                obj;

            o.eventType = o.eventType || "event";
            o._paramsFn = {};

            var isInstance = o.eventType == "public",
                submitConfig = {},
                forms,
                aspForm;

            if (o.extraParams) {
                for (key in o.extraParams) {
                    if (o.extraParams.hasOwnProperty(key)) {
                        obj = o.extraParams[key];

                        if (obj === undefined) {
                            delete o.extraParams[key];
                        }
                        else if (Ext.isFunction(obj)) {
                            o._paramsFn[key] = o.extraParams[key];
                            o.extraParams[key] = obj.apply(o.control);
                        }
                    }
                }
            }
            else {
                o.extraParams = {};
            }

            switch (o.eventType) {
                case "event":
                case "bus":
                case "custom":
                case "proxy":
                case "postback":
                case "public":
                    if (isInstance) {
                        o.action = o.name;
                    }

                    if (Ext.net.ResourceMgr.isMVC) {
                        o.cleanRequest = true;
                    }

                    o.control = o.control || {};

                    if (o.control.usedSelectors && !o.control.isComponent && o.control.component && o.control.component.isComponent) {
                        o.control = o.control.component;
                    }


                    o.requestType = o.type || "submit"; // ExtJS 6 uses "type" for other purposes, so, used "requestType" instead of "type"
                    delete o.type;

                    o.viewStateMode = o.viewStateMode || "default";
                    o.action = o.action || "Click";
                    o.headers = Ext.apply(o.headers || {}, { "X-Ext-Net": "delta=true" });

                    if (o.control && o.control.beforeDirectEvent) {
                        o.control.beforeDirectEvent(o);
                    }

                    if (o.requestType == "submit") {
                        if (Ext.isFunction(o.formId)) {
                            o.form = o.formId.call(o.control);
                        } else if (o.formId) {
                            o.form = Ext.get(o.formId);

                            if (!o.form) {
                                o.form = Ext.net.ResourceMgr.getCmp(o.formId);
                            }
                        }

                        if (!Ext.isEmpty(o.form) && !Ext.isEmpty(o.form.id)) {
                            var cmp = Ext.getCmp(o.form.id);

                            if (!Ext.isEmpty(cmp) && cmp.getForm && cmp.submit) {
                                this.buildForm(o, cmp);
                            }
                        }

                        if (Ext.isEmpty(o.form) && !Ext.isEmpty(o.control.el)) {
                            if (Ext.isEmpty(o.control.isComposite) || o.control.isComposite === false) {
                                o.form = o.control.el.up("form");

                                if (Ext.isEmpty(o.form) && o.control.up) {
                                    var formPanel = o.control.up("form");

                                    if (!Ext.isEmpty(formPanel) && formPanel.getForm && formPanel.submit) {
                                        this.buildForm(o, formPanel);
                                    }
                                }
                            } else {
                                o.form = Ext.get(o.control.elements[0]).up("form");
                            }
                        }

                        if (Ext.isEmpty(o.form) && Ext.isEmpty(o.url) && !Ext.isEmpty(Ext.net.ResourceMgr.aspForm)) {
                            o.form = Ext.get(Ext.net.ResourceMgr.aspForm);
                        }

                        if (Ext.isEmpty(o.form) && o.control && o.control.alias == "widget.form") {
                            this.buildForm(o, o.control);
                        }

                        if (Ext.isEmpty(o.form) && o.control && Ext.isFunction(o.control.up)) {
                            var formCmp = o.control.up("form");

                            if (formCmp && Ext.isFunction(formCmp.getForm)) {
                                this.buildForm(o, formCmp);
                            }
                        }

                        if (o.isUpload && Ext.isEmpty(o.form)) {

                            o.form = Ext.get(Ext.DomHelper.append(Ext.getBody(), {
                                tag: 'form',
                                style: 'display:none'
                            }));

                            o.formCfg = {};
                            o.formCfg.form = o.form.dom;
                        }

                    } else if (o.requestType == "load") {
                        //o.method = "GET";
                        delete o.form;
                    }

                    if (Ext.isEmpty(o.form) && Ext.isEmpty(o.url)) {
                        if (!Ext.isEmpty(Ext.net.ResourceMgr.aspForm)) {
                            aspForm = Ext.getDom(Ext.net.ResourceMgr.aspForm);
                        }

                        if (aspForm) {
                            if (o.requestType == "submit") {
                                o.form = aspForm;
                            } else {
                                o.url = aspForm.action;
                            }
                        }
                    }

                    var argument = Ext.net.StringUtils.format("{0}|{1}|{2}", o.proxyId || (o.control.isStore ? o.control.getStoreId() : null) || o.control.proxyId || o.control.id || "-", o.eventType, o.action);

                    if (!Ext.isEmpty(o.form)) {
                        if (Ext.net.ResourceMgr.isMVC !== true) {
                            this.setValue(o.form.dom, "__EVENTTARGET", Ext.net.ResourceMgr.id);
                            this.setValue(o.form.dom, "__EVENTARGUMENT", argument);
                        }
                        Ext.getDom(o.form).ignoreAllSubmitFields = true;
                    } else {
                        o.url = o.url || Ext.net.ResourceMgr.url || window.location.href;
                        if (Ext.net.ResourceMgr.isMVC !== true) {
                            Ext.apply(submitConfig, {
                                __EVENTTARGET: Ext.net.ResourceMgr.id,
                                __EVENTARGUMENT: argument
                            });
                        }
                    }

                    if (o.viewStateMode != "default") {
                        Ext.apply(submitConfig, {
                            viewStateMode: o.viewStateMode
                        });
                    }

                    if (o.rethrowException) {
                        submitConfig.rethrowException = true;
                    }

                    if (o.before) {
                        if (o.before.call(o.scope || o.control || window, o.control, o.eventType, o.action, o.extraParams, o) === false) {
                            if (o.control && o.control.onDirectEventCancel) { // #874
                                o.control.onDirectEventCancel(o);
                            }

                            return false;
                        }
                    }

                    if (this.fireEvent("beforeajaxrequest", o.control, o.eventType, o.action, o.extraParams, o) === false) {
                        if (o.control && o.control.onDirectEventCancel) { // #874
                            o.control.onDirectEventCancel(o);
                        }

                        return false;
                    }

                    if (!Ext.isEmpty(o.extraParams) && !Ext.isEmptyObj(o.extraParams)) {
                        Ext.apply(submitConfig, {
                            extraParams: o.extraParams
                        });
                    }

                    if (!Ext.isEmpty(o.serviceParams)) {
                        Ext.apply(submitConfig, { serviceParams: o.serviceParams });
                    }

                    if (!Ext.isEmpty(submitConfig) && !Ext.isEmptyObj(submitConfig)) {
                        o.params = { submitDirectEventConfig: Ext.encode({ config: submitConfig }) };
                    } else {
                        o.params = {};
                    }

                    if (!Ext.isEmpty(o.form)) {
                        var enctype = Ext.getDom(o.form).getAttribute("enctype");

                        if ((enctype && enctype.toLowerCase() == "multipart/form-data") || o.isUpload) {
                            Ext.apply(o.params, { "__ExtNetDirectEventMarker": "delta=true" });
                        }
                    }

                    if (o.cleanRequest) {
                        o.params = Ext.apply({}, o.extraParams || {});

                        if (o.json) {
                            o.jsonData = o.params;
                            o.headers = Ext.apply(o.headers || {}, { Accept: 'application/json' });
                            if ((o.method || this.method) !== "GET") {
                                o.params = "";
                            }
                            o.json = false;
                        } else {
                            var ov,
                                encode = Ext.isBoolean(o.encode) ? o.encode : Ext.net.DirectEvent.encode;

                            if (encode) {
                                for (key in o.params) {
                                    ov = o.params[key];

                                    if (typeof ov == "object") {
                                        o.params[key] = Ext.encode(ov);
                                    }
                                }
                            } else {
                                o.params = Ext.Object.toQueryString(o.params, Ext.isBoolean(o.recursive) ? o.recursive : Ext.net.DirectEvent.recursive);
                            }
                        }
                    }

                    if (!Ext.isEmpty(o.form)) {
                        o.form.dom.action = o.form.dom.action || o.form.action || o.url || Ext.net.ResourceMgr.url || window.location.href;
                    }

                    break;
                case "static":
                    o.headers = {
                        "X-Ext-Net": "delta=true,staticmethod=true"
                    };

                    if (Ext.isEmpty(o.form) && Ext.isEmpty(o.url)) {
                        forms = Ext.select("form").elements;
                        o.url = (forms.length == 1 && !Ext.isEmpty(forms[0].action)) ? forms[0].action : Ext.net.ResourceMgr.url || window.location.href;
                    }

                    if (o.before) {
                        if (o.before.call(o.scope || o.control || window, o.eventType, o.action, o.extraParams) === false) {
                            if (o.control && o.control.onDirectEventCancel) { // #874
                                o.control.onDirectEventCancel(o);
                            }

                            return false;
                        }
                    }

                    if (this.fireEvent("beforeajaxrequest", o.control, o.eventType, o.action, o.extraParams, o) === false) {
                        if (o.control && o.control.onDirectEventCancel) { // #874
                            o.control.onDirectEventCancel(o);
                        }

                        return false;
                    }

                    o.params = Ext.apply(o.extraParams, { "_methodName_": o.name });
                    if (o.rethrowException) {
                        o.params._rethrowException_ = true;
                    }
                    break;
            }

            o.userScope = o.scope;
            o.scope = this;

            //--Common part----------------------------------------------------------

            if (o.disableControl && o.control && Ext.isFunction(o.control.disable)) {
                o.control.disable();
            }

            var el,
                em = o.eventMask || {},
                durationMessages = em.durationMessages || Ext.net.DirectEvent.durationMessages,
                showDurationMessages = Ext.net.DirectEvent.forbidDurationMessages !== true && durationMessages && durationMessages.length > 0 &&
                                    ((em.showDurationMessages === true) || (Ext.net.DirectEvent.showDurationMessages && !Ext.isDefined(em.showDurationMessages)));

            if (em.showMask === true || showDurationMessages) {
                if (!Ext.isEmpty(em.customTarget, false) && Ext.isEmpty(em.target, false)) {
                    em.target = "customtarget";
                }
                switch (em.target || "page") {
                    case "this":
                        if (o.control.getEl) {
                            el = o.control.getEl();
                        } else if (o.control.dom) {
                            el = o.control;
                        }

                        break;
                    case "body":
                        if (o.control.body) {
                            el = o.control.body;
                        }
                        else if (o.control.getEl) {
                            el = o.control.getEl();
                        } else if (o.control.dom) {
                            el = o.control;
                        }

                        break;
                    case "parent":
                        if (o.control.getEl) {
                            el = o.control.getEl().parent();
                        } else if (o.control.parent) {
                            el = o.control.parent();
                        }

                        break;
                    case "page":
                        var theHeight = "100%";

                        if (window.innerHeight) {
                            theHeight = window.innerHeight + "px";
                        } else if (document.documentElement && document.documentElement.clientHeight) {
                            theHeight = document.documentElement.clientHeight + "px";
                        } else if (document.body) {
                            theHeight = document.body.clientHeight + "px";
                        }

                        Ext.getBody().addCls("x-masked");

                        el = Ext.getBody().createChild({
                            cls: "x-page-mask",
                            style: "position:absolute;left:0;top:0;width:100%;height:" + theHeight + ";z-index:20000;background-color:Transparent;"
                        });

                        var scroll = Ext.getBody().getScroll();
                        el.setLeft(scroll.left).setTop(scroll.top);
                        break;
                    case "customtarget":
                        var trg = em.customTarget || "";

                        if (Ext.isFunction(trg)) {
                            el = Ext.net.getEl(trg.call(o.control));
                        }
                        else {
                            el = Ext.net.getEl(trg);

                            if (Ext.isEmpty(el)) {
                                el = trg.getEl ? trg.getEl() : null;
                            }

                            if (!el && o.control.el) {
                                try {
                                    el = o.control.el.down(trg);
                                } catch (e) { }
                            }

                            if (!el) {
                                try {
                                    el = Ext.select(trg);
                                } catch (e) { }
                            }
                        }

                        break;
                }

                if (!Ext.isEmpty(el)) {
                    if (em.showMask === true) {
                        var msg = Ext.isDefined(em.msg) ? em.msg : Ext.view.AbstractView.prototype.loadingText,
                            msgCls = em.msgCls || Ext.LoadMask.prototype.msgCls;

                        if (Ext.isEmpty(msg)) {
                            msgCls += " empty-eventmask"; // GitHub issue #449
                        }

                        if (em.useMsg !== false) {
                            el.mask(msg, msgCls);
                        } else {
                            el.mask();
                        }

                        o.maskEl = el;
                    }

                    if (showDurationMessages) {
                        o.maskEl = el;
                        durationMessages = Ext.Array.clone(durationMessages);
                        durationMessages.sort(function (a, b) {
                            return a.duration < b.duration ? -1 : 1;
                        });
                        o.durationMessagesTask = new Ext.util.DelayedTask(function (durationMessages) {
                            var o = this,
                                current = durationMessages[0],
                                next = durationMessages[1],
                                next,
                                msg,
                                msgCls;

                            if (current && current.message) {
                                msg = current.message;

                                if (!o.maskEl.isMasked()) {
                                    msgCls = o.eventMask ? (o.eventMask.msgCls || Ext.LoadMask.prototype.msgCls) : Ext.LoadMask.prototype.msgCls;
                                    o.maskEl.mask(msg, msgCls);
                                } else {
                                    o.maskEl.down("div.x-mask-msg-text").update(msg);
                                    o.maskEl.down("div.x-mask-msg").center();
                                }
                            }

                            if (next && next.message) {
                                o.durationMessagesTask.delay(next.duration - current.duration);
                            }

                            Ext.Array.remove(durationMessages, current);
                        }, o, [durationMessages]);

                        o.durationMessagesTask.delay(durationMessages[0].duration);
                    }
                }
            }

            o.failure = this.requestFailureHandler;
            o.success = this.requestSuccessHandler;
            o.url = Ext.net.ResourceMgr.resolveUrl(o.url);
        }
    }
});


Ext.apply(Ext.net.DirectEvent, {
    autoAbort: false,
    /*LOCALIZE*/
    confirmTitle: "Confirmation",
    /*LOCALIZE*/
    confirmMessage: "Are you sure?",
    showDurationMessages: true,

    // true to encode the parameters
    encode: true,

    // true to a recursive call of Ext.Object.toQueryString on preparation of request's parameters. 
    // Applicable only if encode is false. 
    recursive: false,

    confirmRequest: function (directEventConfig) {
        directEventConfig = directEventConfig || {};

        if (Ext.isFunction(directEventConfig.success)) {
            directEventConfig.userSuccess = directEventConfig.success;
            delete directEventConfig.success;
        }

        if (Ext.isFunction(directEventConfig.failure)) {
            directEventConfig.userFailure = directEventConfig.failure;
            delete directEventConfig.failure;
        }

        if (Ext.isFunction(directEventConfig.complete)) {
            directEventConfig.userComplete = directEventConfig.complete;
            delete directEventConfig.complete;
        }

        if (directEventConfig.confirmation && directEventConfig.confirmation.confirmRequest) {
            if (directEventConfig.confirmation.beforeConfirm && directEventConfig.confirmation.beforeConfirm(directEventConfig) === false) {
                Ext.net.DirectEvent.request(directEventConfig);
                return;
            }

            Ext.Msg.confirm(
                directEventConfig.confirmation.title || this.confirmTitle,
                directEventConfig.confirmation.message || this.confirmMessage,
                Ext.Function.bind(this.confirmAnswer, this, [directEventConfig], true),
                this);
        } else {
            Ext.net.DirectEvent.request(directEventConfig);
        }
    },

    confirmAnswer: function (btn, text, buttonConfig, directEventConfig) {
        if (btn == "yes") {
            Ext.net.DirectEvent.request(directEventConfig);
        }
        if (btn == "no" && directEventConfig.confirmation.cancel) {
            directEventConfig.confirmation.cancel(directEventConfig);
        }
    },

    serializeForm: function (form) {
        return Ext.lib.Ajax.serializeForm(form);
    },

    setValue: function (form, name, value) {
        Ext.net.ResourceMgr.initAspInputs();

        var input = null,
            pe,
            els = Ext.fly(form).select("input[name=" + name + "]");

        if (els.getCount() > 0) {
            input = els.elements[0];
        } else {
            input = document.createElement("input");
            input.setAttribute("name", name);
            input.setAttribute("type", "hidden");
        }

        input.setAttribute("value", value);

        pe = input.parentElement ? input.parentElement : input.parentNode;

        if (Ext.isEmpty(pe)) {
            form.appendChild(input);
        }
    },

    delayedF: function (el, remove) {
        if (!Ext.isEmpty(el)) {
            el.unmask();

            if (remove === true) {
                el.remove();
                Ext.getBody().removeCls("x-masked");
            }
        }
    },

    showFailure: function (response, errorMsg) {
        response = response || {};
        var bodySize = Ext.getBody().getViewSize(),
            width = (bodySize.width < 500) ? bodySize.width - 50 : 500,
            height = (bodySize.height < 300) ? bodySize.height - 50 : 300,
            win;

        if (Ext.isEmpty(errorMsg)) {
            errorMsg = response.responseText;
        }

        win = new Ext.window.Window({
            modal: true,
            width: width,
            height: height,
            title: "Request Failure",
            layout: "fit",
            maximizable: true,
            items: [{
                xtype: "container",
                layout: {
                    type: "vbox",
                    align: "stretch"
                },
                items: [
                    {
                        xtype: "container",
                        height: 42,
                        layout: "absolute",
                        defaultType: "label",
                        items: [
                            {
                                xtype: "component",
                                x: 5,
                                y: 5,
                                html: '<div class="x-message-box-error" style="width:32px;height:32px"></div>'
                            },
                            {
                                x: 42,
                                y: 6,
                                html: "<b>Status Code: </b>"
                            },
                            {
                                x: 125,
                                y: 6,
                                text: response.status
                            },
                            {
                                x: 42,
                                y: 25,
                                html: "<b>Status Text: </b>"
                            },
                            {
                                x: 125,
                                y: 25,
                                text: response.statusText
                            }
                        ]
                    },
                    {
                        flex: 1,
                        itemId: "__ErrorMessageEditor",
                        xtype: "htmleditor",
                        value: errorMsg,
                        readOnly: true,
                        enableAlignments: false,
                        enableColors: false,
                        enableFont: false,
                        enableFontSize: false,
                        enableFormat: false,
                        enableLinks: false,
                        enableLists: false,
                        enableSourceEdit: false
                    }
                ]
            }]
        });

        win.show();
    },

    parseResponse: function (response, options) {
        var text = response.responseText,
            result = {},
            tmpResult,
            exception = false;

        result.success = true;

        try {
            if (/^<\?xml/.test(text)) {
                //xml parsing      
                var xmlData = response.responseXML,
                    root = xmlData.documentElement || xmlData,
                    q = Ext.DomQuery;

                if (root.nodeName == "DirectResponse") {
                    //root = q.select("DirectResponse", root);
                    //success
                    var sv = q.selectValue("Success", root, true),
                        pSuccess = sv !== false && sv !== "false",
                        pErrorMessage = q.selectValue("ErrorMessage", root, ""),
                        pScript = q.selectValue("Script", root, ""),
                        pViewState = q.selectValue("ViewState", root, ""),
                        pViewStateEncrypted = q.selectValue("ViewStateEncrypted", root, ""),
                        pEventValidation = q.selectValue("EventValidation", root, ""),
                        pServiceResponse = q.selectValue("ServiceResponse", root, ""),
                        pUserParamsResponse = q.selectValue("ExtraParamsResponse", root, ""),
                        pResult = q.selectValue("Result", root, "");

                    if (!Ext.isEmpty(pSuccess)) {
                        Ext.apply(result, { success: pSuccess });
                    }

                    if (!Ext.isEmpty(pErrorMessage)) {
                        Ext.apply(result, { errorMessage: pErrorMessage });
                    }

                    if (!Ext.isEmpty(pScript)) {
                        Ext.apply(result, { script: pScript });
                    }

                    if (!Ext.isEmpty(pViewState)) {
                        Ext.apply(result, { viewState: pViewState });
                    }

                    if (!Ext.isEmpty(pViewStateEncrypted)) {
                        Ext.apply(result, { viewStateEncrypted: pViewStateEncrypted });
                    }

                    if (!Ext.isEmpty(pEventValidation)) {
                        Ext.apply(result, { eventValidation: pEventValidation });
                    }

                    if (!Ext.isEmpty(pServiceResponse)) {
                        Ext.apply(result, { serviceResponse: eval("(" + pServiceResponse + ")") });
                    }

                    if (!Ext.isEmpty(pUserParamsResponse)) {
                        Ext.apply(result, { extraParamsResponse: eval("(" + pUserParamsResponse + ")") });
                    }

                    if (!Ext.isEmpty(pResult)) {
                        Ext.apply(result, { result: eval("(" + pResult + ")") });
                    }

                    return {
                        result: result,
                        exception: false
                    };
                } else {
                    return {
                        result: response.responseXML,
                        exception: false
                    };
                    // root.text || root.textContent;
                }
            }

            result = eval("(" + text + ")");

        } catch (e) {
            result.success = false;
            exception = true;

            if (response.responseText.length === 0) {
                result.errorMessage = "NORESPONSE";
            } else {
                result.errorMessage = "BADRESPONSE: " + e.message;
                result.responseText = response.responseText;
            }

            response.statusText = result.errorMessage;
        }

        if (result && result.d) {
            result = result.d;

            if (Ext.isString(result) && options.isDirectMethod !== true) {
                tmpResult = Ext.decode(result, true);
                if (!tmpResult) {
                    result = {
                        script: result
                    };
                }
                else {
                    result = tmpResult;
                }
            }
        }

        return {
            result: result,
            exception: exception
        };
    },

    cacheBusterCheck: function (o) {
        var method = o.method || this.method || ((o.params || o.xmlData || o.jsonData || o.form) ? "POST" : "GET"),
            url = o.url || this.url,
            form = Ext.getDom(o.form);

        if (form) {
            url = url || form.action;
        }

        if (method === "POST" && (this.disableCaching && o.disableCaching !== false)) {
            if (Ext.isFunction(url)) {
                url = url.call(o.scope || "window", o);
            }

            var dcp = o.disableCachingParam || this.disableCachingParam;
            o.url = Ext.net.ResourceMgr.resolveUrl(Ext.urlAppend(url, dcp + '=' + (new Date().getTime())));
        }
    },

    buildForm: function (o, cmp) {
        o.formCfg = {};
        o.formCfg.action = Ext.ClassManager.instantiateByAlias('formaction.standardsubmit', { form: cmp.getForm() });
        o.formCfg.action.submitEmptyText = false;
        o.formCfg.form = o.formCfg.action.buildForm().formEl;
        o.form = Ext.get(o.formCfg.form);
    },

    requestSuccessHandler: function (response, options) {
        var o = options;

        this.removeMask(o);

        if (o.disableControl && o.control && Ext.isFunction(o.control.enable)) {
            o.control.enable();
        }

        var parsedResponse = o.scope.parseResponse(response, options);

        if (!Ext.isEmpty(parsedResponse.result.documentElement)) {
            this.executeScript(o, parsedResponse.result, response);
            return;
        }

        var result = parsedResponse.result,
            exception = parsedResponse.exception;

        if (o.control && o.control.afterDirectEvent) {
            o.control.afterDirectEvent(o, response, result);
        }

        if (result.success === false) {
            if (this.fireEvent("ajaxrequestexception", response, result, o.control, o.eventType, o.action, o.extraParams, o) === false) {
                o.cancelFailureWarning = true;
            }

            if (o.userFailure) {
                o.userFailure.call(o.userScope || o.control || window, response, result, o.control, o.eventType, o.action, o.extraParams, o);
            } else {
                if (o.showWarningOnFailure !== false && !o.cancelFailureWarning) {
                    var errorMsg = "";
                    if (!exception && result.errorMessage && result.errorMessage.length > 0) {
                        errorMsg = result.errorMessage;
                    }
                    o.scope.showFailure(response, errorMsg);
                }
            }

            if (o.userComplete) {
                o.userComplete.call(o.userScope || o.control || window, false, response, result, o.control, o.eventType, o.action, o.extraParams, o);
            }

            return;
        }

        if (!Ext.isEmpty(result.viewState) && o.form !== null) {
            o.scope.setValue(o.form.dom, "__VIEWSTATE", result.viewState);
            delete result.viewState;

            if (!Ext.isEmpty(result.viewStateEncrypted) && o.form !== null) {
                o.scope.setValue(o.form.dom, "__VIEWSTATEENCRYPTED", result.viewStateEncrypted);
                delete result.viewStateEncrypted;
            }

            if (!Ext.isEmpty(result.eventValidation) && o.form !== null) {
                o.scope.setValue(o.form.dom, "__EVENTVALIDATION", result.eventValidation);
                delete result.eventValidation;
            }
        }

        this.executeScript(o, result, response);
    },

    requestFailureHandler: function (response, options) {
        var o = options;

        this.removeMask(o);

        if (o.disableControl && o.control && Ext.isFunction(o.control.enable)) {
            o.control.enable();
        }

        if (o.control && o.control.afterDirectEvent) {
            o.control.afterDirectEvent(o, response);
        }

        if (this.fireEvent("ajaxrequestexception", response, { "errorMessage": response.statusText }, o.control, o.eventType, o.action, o.extraParams, o) === false) {
            o.cancelFailureWarning = true;
        }

        if (o.userFailure) {
            o.userFailure.call(o.userScope || o.control || window, response, { "errorMessage": response.responseText }, o.control, o.eventType, o.action, o.extraParams, o);
        } else if (o.showWarningOnFailure !== false && !o.cancelFailureWarning) {
            o.scope.showFailure(response, "");
        }

        if (o.userComplete) {
            o.userComplete.call(o.userScope || o.control || window, false, response, { "errorMessage": response.statusText }, o.control, o.eventType, o.action, o.extraParams, o);
        }
    },

    removeMask: function (o) {
        if (o.maskEl !== undefined && o.maskEl !== null) {
            var delay = 0,
                em = o.eventMask || {},
                remove,
                task;

            if (em && em.minDelay) {
                delay = em.minDelay;
            }

            remove = (em.target || "page") == "page";

            task = new Ext.util.DelayedTask(this.removeMaskDelay, o.scope, [o, remove]).delay(delay);
        }

        if (o.durationMessagesTask) {
            o.durationMessagesTask.cancel();
        }
    },

    removeMaskDelay: function (o, remove) {
        o.scope.delayedF(o.maskEl, remove);
    },

    executeScript: function (o, result, response) {
        var delay = 0,
            em = o.eventMask || {};

        if (em.minDelay) {
            delay = em.minDelay;
        }

        if (delay > 0) {
            var task = new Ext.util.DelayedTask(this.executeScriptDelay, o.scope, [o, result, response]).delay(delay);
        } else {
            this.executeScriptDelay.call(o.scope, o, result, response);
        }
    },

    executeScriptDelay: function (o, result, response) {
        if (result.script && result.script.length > 0) {
            if (window.execScript) {
                window.execScript(result.script);
            } else {
                window.eval.call(window, result.script);
            }
        }

        this.fireEvent("ajaxrequestcomplete", response, result, o.control, o.eventType, o.action, o.extraParams, o);

        if (o.userSuccess) {
            o.userSuccess.call(o.userScope || o.control || window, response, result, o.control, o.eventType, o.action, o.extraParams, o);
        }

        if (o.userComplete) {
            o.userComplete.call(o.userScope || o.control || window, true, response, result, o.control, o.eventType, o.action, o.extraParams, o);
        }
    }
});

Ext.net.DirectEvent.request = Ext.Function.createSequence(Ext.net.DirectEvent.request, function (o) {
    if (!Ext.isEmpty(o.form) && Ext.net.ResourceMgr.isMVC !== true) {
        this.setValue(o.form.dom, "__EVENTTARGET", "");
        this.setValue(o.form.dom, "__EVENTARGUMENT", "");
    }

    if (o.formCfg) {
        Ext.removeNode(o.formCfg.form);
        delete o.formCfg;
    }

    if (!Ext.isEmptyObj(o._paramsFn)) {
        Ext.apply(o.extraParams, o._paramsFn);
        delete o._paramsFn;
    }

    if (o.after) {
        o.after.call(o.userScope || o.control || window, o.control, o.eventType, o.action, o.extraParams, o);
    }
});

Ext.net.directRequest = Ext.bind(Ext.net.DirectEvent.confirmRequest, Ext.net.DirectEvent);