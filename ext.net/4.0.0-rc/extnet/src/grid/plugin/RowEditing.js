
// @source grid/plugin/RowEditing.js

Ext.grid.plugin.RowEditing.override({
    saveBtnText   : 'Update',
    cancelBtnText : 'Cancel',
    errorsText    : 'Errors',
    dirtyText     : 'You need to commit or cancel your changes', 

    getEditor: function () {
        var me = this;

        if (!me.editor) {
            me.editor = me.initEditor();
            if (me.editor.rendered) {
                me.setHandlers();
            }
            else {
                me.editor.on("afterrender", me.setHandlers, me, { single:true });
            }
        }
        return me.editor;
    },

    setHandlers : function () {
        if (this.saveHandler) {
            var btn = this.editor.getFloatingButtons().down("#update"),
                enterBinding = Ext.Array.findBy(this.editor.keyNav.map.bindings, function (b) {
                    return b.key === Ext.event.Event.ENTER;
                });    
 
            btn.handler = enterBinding.handler = this.saveHandler;
            btn.scope = enterBinding.scope = this.editor;
        }
    }    
});