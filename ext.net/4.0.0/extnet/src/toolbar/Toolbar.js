
// @source core/toolbar/Toolbar.js

Ext.toolbar.Toolbar.override({
    onBeforeAdd: function(component) {
        var ui = component.ui,
            isButton = component.isButton;

        this.callParent(arguments);

        if (isButton && this.ui !== 'footer' && (this.classicButtonStyle || component.flat === false)) {
            component.ui = ui;            
        }
    }
});