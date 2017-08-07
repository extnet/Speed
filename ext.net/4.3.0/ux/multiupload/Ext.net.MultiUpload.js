Ext.define("Ext.net.MultiUpload", {
    extend: "Ext.Component",
    alias: "widget.multiupload",

    autoStartUpload : false,
	fileDropAnywhere : false,
    //dragDropElement
	
    filePostName : "Filedata",
	disableFlash : false,
    fileTypes : "*.*",
    fileTypesDescription : "All Files",
    fileSizeLimit : "2 MB",	
	fileId : 0,	
    fileUploadLimit : 0,
    fileQueueLimit : 0,
    fileSizeEventText : "File size exceeds allowed limit.",
    useQueryString : false,
    preserveRelativeUrls : false,
    requeueOnError : false,
    assumeSuccessTimeout : 0, 
    preventSwfCaching : true,
    debug: false,

    xhrUpload : {
        fileNameHeader : "X-File-Name",
		postParamsPrefix : "postParams_",
		filePostName : "Filedata"
         //uploadUrl : 'upload.aspx'
    },    

    renderTpl : ["<div style='position:relative;'><div class='x-swfplaceholder'></div></div>"],

	initComponent : function () {
        this.postParams = this.postParams || {};
        this.fileQueue = {};
        this.swfUploadQueue = {};
        this.httpSuccess = this.httpSuccess || [];

        if (!this.uploadUrl)
        {
            if (!Ext.isEmpty(Ext.net.ResourceMgr.aspForm)) {
                this.uploadUrl = Ext.get(Ext.net.ResourceMgr.aspForm).dom.action;
            }
            else {
                this.uploadUrl = window.location.href;
            }
        }
		
		this.callParent(arguments);
	},

    getSizeLimit : function () {
        var size,
            unit,
            match,
            units,
            regex = /(\d+)\s*(B|KB|MB|GB)?/i;

        if (this.fileSizeLimit && Ext.isString(this.fileSizeLimit)) {
            match = this.fileSizeLimit.match(regex);               

            if (match != null) {
	            size = parseInt(match[1], 10);
                unit = (match[2] && match[2].toUpperCase()) || "KB";

                units = {
                    B  : 1,
                    KB : 1024,
                    MB : 1048576,
                    GB : 1073741824
                };

                return size * units[unit];
                
            } else {
	            return 0;
            }
        }

        return this.fileSizeLimit;
    },

    disable : function () {
        this.callParent(arguments);

        if (!this.flashButton)
        {
            if(this.button && this.button.rendered) {
                this.button.disable();
            }
        }
        else if (this.multiUpload) {
            this.multiUpload.setButtonDisabled(true);
        }
    },

    enable : function () {
        this.callParent(arguments);

        if (!this.flashButton)
        {
            if(this.button && this.button.rendered) {
                this.button.enable();
            }
        }
        else if (this.multiUpload) {
            this.multiUpload.setButtonDisabled(false);
        }
    },

    afterRender : function () {
        this.callParent(arguments);

        this.initSWFUpload();

        if (this.multiUpload.movieElement) { // #753
            this.initDragAndDropUploader();
        }
    },

	startUpload : function () {
		var fileId;
		for(fileId in this.fileQueue){
			if (this.fileQueue[fileId].status == "started") {
				continue;
			}

			switch (this.fileQueue[fileId].method) {
				case "swfupload":
					this.swfUploadStopped = false;

					if(this.fileQueue[fileId].status == "error" ){
						this.multiUpload.requeueUpload(this.fileQueue[fileId].swfuploadFile.id);
					}
					
					if (this.multiUpload.getStats().in_progress != 1) {
						this.swfUploadUploadStart();
					}
					
					break;

				case "dnd":
					this.dragAndDropUploadStart(this.fileQueue[fileId]);
					break;
			}
		}
	},

	abortAllUploads : function () {
		var fileId;
		for(fileId in this.fileQueue){
			this.abortUpload(this.fileQueue[fileId].id);
		}
	},

	// #670: calling just this.multiUpload.stopUploads() instead of cancelQueue below 
	//       broken actually aborting uploads.
	abortUpload : function (fileId) {
		if (this.fileQueue[fileId].status == "started") {
			switch (this.fileQueue[fileId].method) {
				case "swfupload":
					this.swfUploadStopped = true;
					this.multiUpload.cancelQueue();
					break;
				case "dnd":
					this.fileQueue[fileId].upload.xhr.abort();
					break;
			}

			this.fileQueue[fileId].status = "aborted";
			this.fireEvent("uploadaborted", this, this.fileQueue[fileId]);
		}
	},

	removeAllUploads : function () {
		for(var fileId in this.fileQueue){
			this.removeUpload(this.fileQueue[fileId].id);
		}
	},

	removeUpload : function (fileId) {
		if(this.fileQueue[fileId].status == "started"){
			this.abortUpload(fileId);
		}

		switch (this.fileQueue[fileId].method) {
			case "swfupload":
				this.multiUpload.cancelUpload(this.fileQueue[fileId].swfuploadFile.id, false);
				break;
		}
		
		this.fileQueue[fileId].status = "removed";

		var fileInfo = {
			id: fileId,
			name: this.fileQueue[fileId].name,
			size: this.fileQueue[fileId].size
		};

		delete this.fileQueue[fileId];
		this.fireEvent("uploadremoved", this, fileInfo);
	},

    beforeDestroy: function() {
        var me = this;

        if (me.multiUpload) {
            me.multiUpload.destroy();
            delete me.multiUpload;
        }

        if (me.button) {
            me.button.destroy();
            delete me.button;
        }
        me.callParent();
    },

	initSWFUpload : function () {
		var settings = {
			flash_url: this.flashUrl,
			upload_url: this.uploadUrl,
			file_size_limit: this.fileSizeLimit,
			file_types: this.fileTypes,
			file_types_description: this.fileTypesDescription,
			file_upload_limit: this.fileUploadLimit !== 0 ? this.fileUploadLimit + 1 : 0,
			file_queue_limit: this.fileQueueLimit,
			post_params: this.postParams,			
			button_window_mode: "opaque",
            button_disabled : this.disabled,
			file_post_name: this.filePostName,
            use_query_string : this.useQueryString,
            preserve_relative_urls : this.preserveRelativeUrls,
            requeue_on_error : this.requeueOnError,
            http_success : this.httpSuccess,
            assume_success_timeout : this.assumeSuccessTimeout,
            prevent_swf_caching : this.preventSwfCaching,
            debug: this.debug,
			button_placeholder: this.el.down("div.x-swfplaceholder").dom,

			file_queued_handler: Ext.Function.bind(this.swfUploadfileQueued, this),
			file_dialog_complete_handler: Ext.Function.bind(this.swfUploadFileDialogComplete, this),
			upload_start_handler: Ext.Function.bind(this.swfUploadUploadStarted, this),
			upload_error_handler: Ext.Function.bind(this.swfUploadUploadError, this),
			upload_progress_handler: Ext.Function.bind(this.swfUploadUploadProgress, this),
			upload_success_handler: Ext.Function.bind(this.swfUploadSuccess, this),
			upload_complete_handler: Ext.Function.bind(this.swfUploadComplete, this),
			file_queue_error_handler: Ext.Function.bind(this.swfUploadFileQueError, this),
			swfupload_load_failed_handler: Ext.Function.bind(this.swfUploadLoadFailed, this),
            swfupload_loaded_handler : Ext.Function.bind(this.flashReady, this),
            swfupload_preload_handler : Ext.Function.bind(this.swfUploadPreload, this),
            file_dialog_start_handler: Ext.Function.bind(this.fileDialogStartHandler, this),
            upload_resize_start_handler: Ext.Function.bind(this.uploadResizeStart, this),
            mouse_click_handler: Ext.Function.bind(this.mouseClickHandler, this),
            mouse_out_handler: Ext.Function.bind(this.mouseOutHandler, this),
            mouse_over_handler: Ext.Function.bind(this.mouseOverHandler, this),
            debug_handler: Ext.Function.bind(this.debugHandler, this),
            queue_complete_handler : Ext.Function.bind(this.queueCompleteHandler, this)
		};

        if (this.flashButton) {
            Ext.apply(settings, this.flashButton);
        }

		this.multiUpload = new SWFUpload(settings);
        
        if (this.multiUpload.movieElement) { // #753
            this.createUploadButton();
            this.flashReady();
        }
	},

    swfUploadLoadFailed : function () {
        return this.fireEvent("swfuploadloadfailed", this);
    },

    swfUploadPreload : function () {
        return this.fireEvent("swfuploadpreload", this);
    },

    fileDialogStartHandler : function () {
        return this.fireEvent("filedialogstart", this);
    },

    uploadResizeStart : function (file, width, height, encoding, quality) {
        return this.fireEvent("uploadresizestart", this, this.swfUploadQueue[file.id], width, height, encoding, quality);
    },

    mouseClickHandler : function () {
        return this.fireEvent("mouseclick", this);
    },

    mouseOutHandler : function () {
        return this.fireEvent("mouseout", this);
    },

    mouseOverHandler : function () {
        return this.fireEvent("mouseover", this);
    },

    debugHandler : function (message) {
        return this.fireEvent("debug", this, message);
    },

    queueCompleteHandler : function (count) {
        var status,
            fileId;

        for(fileId in this.fileQueue){
			status = this.fileQueue[fileId].status;
            if (status == "started" || status == "queued") {
				return;
			}
		}
        
        return this.fireEvent("queuecomplete", this, count);
    },

    flashReady : function () {
        if (!this.multiUpload.movieElement.getAttribute) {
            this.multiUpload.movieElement.getAttribute = Ext.emptyFn;
        }
        Ext.get(this.multiUpload.movieElement).applyStyles("position:absolute;top:0px;left:0px;z-index:100;")
            .setOpacity(0, false);

        this.syncFlashSize();
        return this.fireEvent("swfuploadloaded", this);
    },

    createUploadButton : function () {
        if (!this.flashButton) {
            var cfg = this.button || {text : "Browse..."};

            cfg.renderTo = this.el.first("div");
            cfg.disabled = this.disabled;
            cfg.style = "position:absolute;top:0px;left:0px;z-index:50;";
            this.button = Ext.ComponentManager.create(cfg, "button");
            this.bindButtonListeners();
            this.button.on("resize", this.syncFlashSize, this);
        }
    },

    bindButtonListeners: function(){
        Ext.get(this.multiUpload.movieElement).on({
            scope: this,
            mouseenter: function() {
                this.button.addCls(this.button.overCls);
            },
            mouseleave: function(){
                this.button.removeCls(this.button.overCls);
            },
            mousedown: function(){
                this.button.addCls(this.button._pressedCls);
            },
            mouseup: function(){
                this.button.removeCls(this.button._pressedCls);
            }
        }); 
    },

    syncFlashSize : function () {
        if (this.button) {
            var size = this.button.getSize();
            Ext.get(this.multiUpload.movieElement).setSize(size);
            this.el.first("div").setHeight(size.height);
            this.setSize(size);
        }
    },

    initDragDropElement : function (el) {
        el.on({
			dragenter : function(e){
				e.browserEvent.dataTransfer.dropEffect = "move";
				return true;
			},

			dragover : function(e){
				e.browserEvent.dataTransfer.dropEffect = "move";
				e.stopEvent();
				return true;
			},

			drop : function(e){				
				var files = e.browserEvent.dataTransfer.files,
                    len;

                e.stopEvent();

				if (!files) {
					return true;
				}

				len = files.length;

				while(--len >= 0){
					this.processDragAndDropFileUpload(files[len]);
				}
			},

            scope:this
		});
    },

	initDragAndDropUploader : function () {
        if (this.dragDropElement) {
            this.initDragDropElement(Ext.net.getEl(this.dragDropElement));
        }
        else {
            this.initDragDropElement(Ext.get(this.multiUpload.movieElement));
        }
		
		if (this.fileDropAnywhere) {
			this.initDragDropElement(Ext.getBody());
		} else {
			if(!Ext.net.MultiUpload.preventBodyDrag){
				Ext.net.MultiUpload.preventBodyDrag = true;
				
				Ext.getBody().on({
					dragenter : function () {
						return true;
					},

					dragleave : function () {
						return true;
					},
					
                    dragover : function (e) {
						event.stopEvent();
						return true;
					},

					drop : function (e) {
						e.stopEvent();
						return true;
					}
				});
			}
		}
		
	},

	dragAndDropUploadStart : function (fileInfo) {
		var upload = new Ext.net.XHRUpload ({
			url : this.xhrUpload.uploadUrl || this.uploadUrl,
			filePostName : this.xhrUpload.filePostName,
			fileNameHeader : this.xhrUpload.fileNameHeader,
			postParams : this.postParams,
			swf : this,
			file : fileInfo.file,
			listeners : {				
				uploadloadstart : function(e) {
					this.fireEvent("uploadstart", this, fileInfo, e);
				},
				uploadprogress : function (e) {
					this.fireEvent('uploadprogress', this, fileInfo, e.loaded, e.total, e);
				},				
				loadstart : function (e) {
					fileInfo.status = "started";
					this.fireEvent("start", this, fileInfo, e);
				},
				progress : function (e) {
					this.fireEvent("progress", this, fileInfo, e.loaded, e.total, e);
				},
				abort : function (e) {
					fileInfo.status = "aborted";
					this.fireEvent("abort", this, fileInfo, "XHR upload aborted", e);
                    this.fireEvent("uploadcomplete", this, fileInfo);
				},
				error : function (e) {
					fileInfo.status = "error";
					this.fireEvent("error", this, fileInfo, "XHR upload error", e);
                    this.fireEvent("uploadcomplete", this, fileInfo);
				},
				load : function (e) {
					this.processUploadResult(fileInfo, upload.xhr.responseText,  true);
                    this.fireEvent("uploadcomplete", this, fileInfo);
				},
                scope:this
			}
		});

		fileInfo.upload = upload;
		upload.send();
	},
	
    processDragAndDropFileUpload : function (file) {
		var fileInfo = {
			id: ++this.fileId,
			name: file.name,
			size: file.size,
			status: "queued",
			method: "dnd",
			file: file
		},
        limit = this.getSizeLimit();
		
		if (limit && fileInfo.size > limit) {
			this.fireEvent("fileselectionerror", this, fileInfo, SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED, this.fileSizeEventText);
			return true;
		}

		if (this.fireEvent("fileselected", this, fileInfo) !== false) {
			this.fileQueue[fileInfo.id] = fileInfo;
            this.fireEvent("filequeued", this, fileInfo);
			if (this.autoStartUpload) {
				this.dragAndDropUploadStart(fileInfo);
			}
		}
	},

	swfUploadfileQueued : function (file) {
		var fileInfo = {
			id: ++this.fileId,
			name: file.name,
			size: file.size,
			status: "queued",
			method: "swfupload",
			swfuploadFile: file
		};

		if (this.fireEvent("fileselected", this, fileInfo) !== false) {
			this.fileQueue[fileInfo.id] = fileInfo;
			this.swfUploadQueue[file.id] = fileInfo;
            this.fireEvent("filequeued", this, fileInfo);
		} else {
			this.multiUpload.cancelUpload(file.id, false);	
		}
		return true;
	},

	swfUploadFileQueError : function (file, error, message) {
		var fileInfo = {
			id: ++this.fileId,
			name: file ? file.name : "",
			size: file ? file.size : -1,
			status: "error",
			method: "swfupload"
		};

		this.fireEvent("fileselectionerror", this, fileInfo, error, message);
	},

	swfUploadUploadStart : function () {
		this.multiUpload.startUpload();
	},
	
    swfUploadFileDialogComplete : function (selectedFilesNum, queuedFilesNum, filesInQueue) {		
        this.fireEvent("filedialogcomplete", this, selectedFilesNum, queuedFilesNum, filesInQueue);
        if(this.autoStartUpload){
			this.swfUploadUploadStart();
		}
	},

	swfUploadUploadProgress : function (file, bytesComplete, bytesTotal) {
		return this.fireEvent("uploadprogress", this, this.swfUploadQueue[file.id], bytesComplete, bytesTotal);	
	},

    buildForm : function (cmp) {
        var formCfg = {};

        formCfg.action = Ext.ClassManager.instantiateByAlias('formaction.standardsubmit', { form: cmp.getForm() });
        formCfg.action.submitEmptyText = false;
        formCfg.form = formCfg.action.buildForm().formEl;
        formCfg.form._removeAfterParams = true;

        return Ext.get(formCfg.form);
    },

    getForm : function () {
        var form,
            formPanel,
            cmp;

        if (Ext.isFunction(this.formId)) {
            form = this.formId.call(this);
        }
        else {
            form = Ext.get(this.formId);
        } 

        if (form && form.id) {
            cmp = Ext.getCmp(form.id);

            if (cmp && cmp.getForm && cmp.submit) {
                form = this.buildForm(cmp);
            }
        }

        if (!form) {
            form = this.el.up("form");
                                
            if (!form) {
                formPanel = this.up("form");

                if (formPanel && formPanel.getForm && formPanel.submit) {
                    form = this.buildForm(formPanel);
                }
            }
        } 

        if (!form && Ext.net.ResourceMgr.aspForm) {
            form = Ext.get(Ext.net.ResourceMgr.aspForm);
        }

        return form ? Ext.get(form).dom : null;
    },

    getFormParams : function () {
        var params = {},
            form;

        if (this.requestType != "load") {
            form = this.getForm();

            if (form) {
                var fElements = form.elements || (document.forms[form] || Ext.getDom(form)).elements,
	                hasSubmit = true,
	                hasValue,		            
		            element,
		            name,
		            type,
                    i,
		            submitDisabled = Ext.net && Ext.net.ResourceMgr && Ext.net.ResourceMgr.submitDisabled;

	            for (i = 0; i < fElements.length; i++) {
		            element = fElements[i];
		            name = element.name;
		            type = element.type;

		            if ((!element.disabled || submitDisabled) && name) {
			            if (/select-(one|multiple)/i.test(type)) {
				            Ext.each(element.options, function (opt) {
					            if (opt.selected) {
						            hasValue = opt.hasAttribute ? opt.hasAttribute('value') : opt.getAttributeNode('value').specified; 
                                    params[name] = hasValue ? opt.value : opt.text;
					            }
				            });
			            } else if (!/file|undefined|reset|button/i.test(type)) {
				            if (!(/radio|checkbox/i.test(type) && !element.checked) && !(type == "submit" && hasSubmit)) {					            
                                params[name] = element.value;
  
					            if (type == "submit") {
					                hasSubmit = /submit/i.test(type);
                                }
                            }
                        }
                    }
                }

                if (form._removeAfterParams) {
                    Ext.removeNode(form);
                }
            }
        }
        
        return params;
    },

	swfUploadUploadStarted : function(file) {
		this.swfUploadQueue[file.id].status = "started";

        var obj = this.getFormParams();

        if (this.buildPostParams) {            
            obj = Ext.apply(obj, this.buildPostParams(file));            
        }

        if (!Ext.isEmptyObj(obj)) {
            this.multiUpload.setPostParams(obj);
        }

        if (this.hasId()) {
            this.multiUpload.addPostParam("X-NET-SwfUpload", this.id);
        }
        
		return this.fireEvent("uploadstart", this, this.swfUploadQueue[file.id]);
	},

	swfUploadComplete : function (file) {
		if (!this.swfUploadStopped ) {
			this.multiUpload.startUpload();
		}

        return this.fireEvent("uploadcomplete", this, this.swfUploadQueue[file.id]);
	},

	swfUploadUploadError : function (file, errorCode, message) {
        if(errorCode == -290){
			return true;
		}
		
		if (file) {
            this.swfUploadQueue[file.id].status = "error";
        }
		return this.fireEvent("uploaderror", this, file ? this.swfUploadQueue[file.id] : null, errorCode, message);
	},

	swfUploadSuccess : function (file, serverData, response) {
		this.processUploadResult(this.swfUploadQueue[file.id], serverData, response);
	},

    processUploadResult : function (fileInfo, serverData, response) {
		Ext.net.DirectEvent.requestSuccessHandler({responseText : serverData}, {scope: Ext.net.DirectEvent});

        if (this.fireEvent("uploadsuccess", this, fileInfo, serverData, response) !== false) {
			fileInfo.status = "completed";
		} 
        else {
			fileInfo.status = "error";
			this.fireEvent("uploaderror", this, fileInfo, -1, "Canceled");
		}		

        if (fileInfo && fileInfo.method == "dnd") {
            this.queueCompleteHandler();
        }
	}
});

Ext.define("Ext.net.XHRUpload", {
    extend: "Ext.util.Observable",

    method: "POST",
	fileNameHeader: "X-File-Name",	
	contentTypeHeader: "text/plain; charset=x-user-defined-binary",	
	xhrExtraPostDataPrefix: "extraPostData_",

    constructor : function (config) {
	    this.callParent(arguments);

        this.postParams = this.postParams || {};
        this.xhrEvents = ["loadstart", "progress", "progressabort", "error", "load", "loadend"];
    },

	send : function(config) {
		var i,
            attr,
            formData;

        Ext.apply(this, config);

		this.xhr = new XMLHttpRequest();

        for ( i = 0; i < this.xhrEvents.length; i++ ) {
            this.xhr.addEventListener(this.xhrEvents[i], Ext.Function.bind(this.relayXHREvent, this), false);
		}

        for ( i = 0; i < this.xhrEvents.length; i++ ) {
            this.xhr.upload.addEventListener(this.xhrEvents[i], Ext.Function.bind(this.relayUploadEvent, this), false);
		}
		
		this.xhr.open(this.method, this.url, true);
		
		this.xhr.setRequestHeader(this.fileNameHeader, this.encodeFileName(this.file.name));
        if (this.swf.hasId()) {
            this.xhr.setRequestHeader("X-NET-SwfUpload", this.swf.id);
        }
        
		for (attr in this.postParams) {
			this.xhr.setRequestHeader(this.xhrExtraPostDataPrefix + attr, this.postParams[attr]);
		}
		
        formData = new FormData();
        formData.append(this.swf.filePostName, this.file);
        this.xhr.send(formData);
		return true;
		
	},

	encodeFileName: function (name) {
	    var v = name,
            fileNameRegex = /[^\\]*$/im,
            fileNameRegexNix = /[^/]*$/im,
            match = fileNameRegex.exec(v);

	    if (match !== null) {
	        name = match[0];
	    }
	    else {
	        match = fileNameRegexNix.exec(v);
	        if (match !== null) {
	            name = match[0];
	        }
	    }

	    return unescape(encodeURIComponent(name));
	},

	relayUploadEvent : function (e) {
		this.fireEvent("upload" + e.type, e);
	},
	
    relayXHREvent : function(e) {
		this.fireEvent(e.type, e);
	}
});