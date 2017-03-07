/**
 * Demonstrates a tabbed form panel. This uses a tab panel with 3 tabs - Basic, Sliders and Toolbars - each of which is
 * defined below.
 */
Ext.define('KitchenSink.view.forms.FormPanel', {
    extend: 'Ext.form.Panel',

    //<example>
    requires: [
        'Ext.form.FieldSet',
        'Ext.field.Number',
        'Ext.field.Spinner',
        'Ext.field.Password',
        'Ext.field.Email',
        'Ext.field.Url',
        'Ext.field.DatePicker',
        'Ext.field.Select',
        'Ext.field.Hidden',
        'Ext.field.Radio',
        'KitchenSink.view.forms.FormPanelController'
    ],
    otherContent: [{
        type: 'Controller',
        path: 'modern/src/view/forms/FormPanelController.js'
    }],
    //</example>

    controller: 'formpanel',
    shadow: true,
    cls: 'demo-solid-background',
    items: [{
        xtype: 'fieldset',
        reference: 'fieldset1',
        title: 'Personal Info',
        instructions: 'Please enter the information above.',
        defaults: {
            labelWidth: '35%'
        },
        items: [{
            xtype: 'textfield',
            name: 'name',
            label: 'Name',
            placeHolder: 'Tom Roy',
            autoCapitalize: true,
            required: true,
            clearIcon: true
        }, {
            xtype: 'passwordfield',
            revealable: true,
            name: 'password',
            label: 'Password',
            clearIcon: true
        }, {
            xtype: 'emailfield',
            name: 'email',
            label: 'Email',
            placeHolder: 'me@sencha.com',
            clearIcon: true
        }, {
            xtype: 'urlfield',
            name: 'url',
            label: 'Url',
            placeHolder: 'http://sencha.com',
            clearIcon: true
        }, {
            xtype: 'spinnerfield',
            name: 'spinner',
            label: 'Spinner',
            minValue: 0,
            maxValue: 10,
            clearable: true,
            stepValue: 1,
            cycle: true
        }, {
            xtype: 'checkboxfield',
            name: 'cool',
            label: 'Cool',
            platformConfig: {
                '!desktop': {
                    bodyAlign: 'end'
                }
            }
        }, {
            xtype: 'datepickerfield',
            destroyPickerOnHide: true,
            name: 'date',
            label: 'Start Date',
            value: new Date(),
            picker: {
                yearFrom: 1990
            }
        }, {
            xtype: 'selectfield',
            name: 'rank',
            label: 'Rank',
            options: [{
                text: 'Master',
                value: 'master'
            }, {
                text: 'Journeyman',
                value: 'journeyman'
            }, {
                text: 'Apprentice',
                value: 'apprentice'
            }]
        }, {
            xtype: 'sliderfield',
            name: 'slider',
            label: 'Slider'
        }, {
            xtype: 'togglefield',
            name: 'toggle',
            label: 'Toggle'
        }, {
            xtype: 'textareafield',
            name: 'bio',
            label: 'Bio'
        }, {
            xtype: 'hiddenfield',
            name: 'userKey',
            value: 'aSecretKey'
        }]
    }, {
        xtype: 'fieldset',
        reference: 'fieldset2',
        title: 'Favorite color',
        platformConfig: {
            '!desktop': {
                defaults: {
                    bodyAlign: 'end'
                }
            }
        },
        defaults: {
            xtype: 'radiofield',
            labelWidth: '35%'
        },
        items: [{
            name: 'color',
            value: 'red',
            label: 'Red'
        }, {
            name: 'color',
            label: 'Blue',
            value: 'blue'
        }, {
            name: 'color',
            label: 'Green',
            value: 'green'
        }, {
            name: 'color',
            label: 'Purple',
            value: 'purple'
        }]
    }, {
        xtype: 'container',
        defaults: {
            xtype: 'button',
            style: 'margin: 1em',
            flex: 1
        },
        layout: {
            type: 'hbox'
        },
        items: [{
            text: 'Disable fields',
            ui: 'action',
            handler: 'onDisableTap'
        }, {
            text: 'Reset',
            ui: 'action',
            handler: 'onResetTap'
        }]
    }]
});
