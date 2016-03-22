
// @source core/form/FileUploadField.js

Ext.form.field.File.override({
    stripPath: true,
    
    isIconIgnore : function () {
        return true;
    },

    onFileChange: function (button, e, value) {
        this.lastValue = null;
        this.duringFileSelect = true;

        if (this.stripPath === false) {
            Ext.form.field.File.superclass.setValue.call(this, value);
            delete this.duringFileSelect;
            return;
        }

        var v = value,                
            fileNameRegex = /[^\\]*$/im,
            fileNameRegexNix = /[^/]*$/im,
            match = fileNameRegex.exec(v);
                    
        if (match !== null) {
	        v = match[0];
        }
        else {
            match = fileNameRegexNix.exec(v);
            if (match !== null) {
	            v = match[0];
            }
        }

        Ext.form.field.File.superclass.setValue.call(this, v);
        delete this.duringFileSelect;
    },

    onEnable: function () {
        var me = this;
        me.callParent();
        me.button.fileInputEl.dom.removeAttribute("disabled");
    },

    reset : function () {        
        this.callParent();
        if (this.disabled) {
            this.button.fileInputEl.dom.disabled = true;
        }
    }
});