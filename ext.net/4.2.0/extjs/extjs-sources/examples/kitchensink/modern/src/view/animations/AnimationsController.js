Ext.define('KitchenSink.view.animations.AnimationsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.animations',

    refs: {
        animationCards: 'animationCards'
    },
    control: {
        'animationCards button': {
            tap: 'onButtonTap'
        }
    },

    getAnimation: function(type) {
        type = type.toLowerCase();
        
        var parts = type.split(/\s+/);
        return {
            type: parts[0],
            direction: parts.length > 1 ? parts[1] : undefined,
            duration: 500
        };
    },

    onButtonTap: function(button) {
        var me = this,
            view = this.getView(),
            activeItem = view.getActiveItem(),
            layout = view.getLayout(),
            animation = this.getAnimation(button.getText()),
            cards = view.getItems().getRange();
        
        layout.setAnimation(animation);
        view.setActiveItem(activeItem === cards[0] ? cards[1] : cards[0]);
    }
});
