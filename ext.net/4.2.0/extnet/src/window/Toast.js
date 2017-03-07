
// @source window/Toast.js
Ext.define('Ext.window.Toast', {
    override: 'Ext.window.Toast',

    // Ensure we use originalCloseAction in case Ext.window.Window override is already in place (#1414)
    closeAction: Ext.window.Window.prototype.originalCloseAction !== undefined ? Ext.window.Window.prototype.originalCloseAction : Ext.window.Window.prototype.closeAction
});