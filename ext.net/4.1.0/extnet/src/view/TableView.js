
Ext.view.Table.override({     
    processUIEvent: function (e) {
        if (this.stopEventFn && this.stopEventFn(this, e) === false) {
            return false;
        }
        
        return this.callParent(arguments);
    },
    
    getFeature: function(id) {
        var f = this.callParent(arguments);

        if (!f) {
            var features = this.featuresMC;
            if (features) {
                return features.getAt(features.findIndex("proxyId", id));
            }
        }

        return f;
    }
});