/*
 * Demonstrates all the animations
 */
Ext.define('KitchenSink.view.animations.Animations', {
    extend: 'Ext.Container',
    requires: [
        'KitchenSink.view.animations.AnimationsController'
    ],

    // <example>
    otherContent: [{
        type: 'Controller',
        path: 'modern/src/view/animations/AnimationsController.js'
    }],
    // </example>

    xtype: 'animationCards',

    layout: 'card',
    shadow: true,

    controller: 'animations',
    buttons: [
        'Slide Left',
        'Slide Right',
        'Slide Up',
        'Slide Down',
        'Cover Left',
        'Cover Right',
        'Cover Up',
        'Cover Down',
        'Reveal Left',
        'Reveal Right',
        'Reveal Up',
        'Reveal Down',
        'Fade',
        'Pop',
        'Flip'
    ],

    defaultType: 'container',
    defaults: {
        cls: 'demo-solid-background',
        defaultType: 'button',
        layout: 'vbox',
        scrollable: true
    },

    initialize: function() {
        this.callParent();

        var items = this.buttons.map(function(name) {
            return {
                text: name
            };
        });

        this.add([{
            items: items
        }, {
            items: items
        }]);
    }
});