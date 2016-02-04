
// @source core/form/Checkbox.js

Ext.form.Checkbox.override({
    useHiddenField                 : true, 
    includeHiddenStateToSubmitData : false,
    submitEmptyHiddenState         : false,

    onRender : function (){
        delete this.inputWidth;
        this.callParent(arguments);
        this.applyBoxLabelCss();    
    },
    
    getHiddenState : function (value) {
        return this.getSubmitValue();
    },

    getHiddenStateName : function () {
        return this.getName();
    },

    initValue : function () {
        var me = this,
            checked = !!me.checked;

        if (!me.checked && (me.value === true || me.value === "true")) {
            me.checked = checked = true;
        }   

        me.originalValue = me.lastValue = checked;
        me.setValue(checked);
    },

    applyBoxLabelCss : function () {
        if (this.boxLabelClsExtra) {
            this.setBoxLabelCls(this.boxLabelClsExtra);
        }
        
        if (this.boxLabelStyle) {
            this.setBoxLabelStyle(this.boxLabelStyle);
        }
    },
    
    setBoxLabelStyle : function (style) {
        this.boxLabelStyle = style;

        if (this.boxLabelEl) {
            this.boxLabelEl.applyStyles(style);
        }
    },
    
    setBoxLabelCls : function (cls) {
        if (this.boxLabelEl && this.boxLabelClsExtra) {
            this.boxLabelEl.removeCls(this.boxLabelClsExtra);
        }
        
        this.boxLabelClsExtra = cls;
        
        if (this.boxLabelEl) {
            this.boxLabelEl.addCls(this.boxLabelClsExtra);
        }
    },
    
    setBoxLabel : function (label) {
        this.boxLabel = label;        
        
        if (this.rendered) {
            if (this.boxLabelEl) {
                this.boxLabelEl.setHtml(label);
                this.boxLabelEl[label ? "removeCls" : "addCls"](this.noBoxLabelCls);
                this.updateLayout();
            } else {            
                this.boxLabelEl = this.bodyEl.createChild({
                    id: this.id + "-boxLabelEl",
                    "data-ref" : "boxLabelEl",
                    tag: "label",
                    "for"    : this.el.id,
                    cls     : this.boxLabelCls,
                    html    : this.boxLabel
                });

                this.applyBoxLabelCss();
            }
        }
    }
});