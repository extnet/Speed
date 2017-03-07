Ext.define('KitchenSink.view.tip.TipAligningController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.tip-aligning',

    init: function() {
        this.callParent();

        this.getViewModel().bind('{tipEdge}', 'onTipEdgeChange', this);
        this.button = this.lookupReference('button');
        this.tooltip = this.button.getTooltip();

        this.tooltip.setConstrainTo(this.getView().bodyElement);
    },
    
    initButton: function() {
        this.button.show();
        this.button.center();
        this.tooltip.delayShow(this.button);
    },

    onButtonDrag: function(event) {
        this.tooltip.showByTarget(this.button);
    },

    onTipEdgeChange: function(newValue, oldValue) {
        var values = [2, 3, 0, 1];
        this.getViewModel().set('targetEdge', values[newValue]);
    }
});