Ext.define('KitchenSink.view.forms.FormPanelController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.formpanel',

    fieldsDisabled: false,

    onDisableTap: function(btn) {
        var fieldset1 = this.lookup('fieldset1'),
            fieldset2 = this.lookup('fieldset2'),
            disabled = this.fieldsDisabled;

        fieldset1.setDisabled(!disabled);
        fieldset2.setDisabled(!disabled);
        btn.setText(!disabled ? 'Enable fields' : 'Disabled fields');
        this.fieldsDisabled = !disabled;
    },

    onResetTap: function() {
        this.getView().reset();
    }
});
