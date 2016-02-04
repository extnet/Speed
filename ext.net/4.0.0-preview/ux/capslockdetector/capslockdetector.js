/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define("Ext.net.CapsLockDetector",{extend:"Ext.util.Observable",preventCapsLockChar:false,constructor:function(config){this.callParent(arguments);},init:function(field){this.field=field;field.on({element:'inputEl',keypress:this.onKeyPress,scope:this});},onKeyPress:function(e){var character=String.fromCharCode(e.getCharCode());if(character.toUpperCase()===character.toLowerCase()){return;}
if((e.shiftKey&&character.toLowerCase()===character)||(!e.shiftKey&&character.toUpperCase()===character)){if(!this.capslock){if(this.capsLockIndicatorIconCls){this.field.setIndicatorIconCls(this.capsLockIndicatorIconCls,true);this.field.showIndicator();}
if(this.capsLockIndicatorText){this.field.setIndicator(this.capsLockIndicatorText);}
if(this.capsLockIndicatorTip){this.field.setIndicatorTip(this.capsLockIndicatorTip);}
this.capslock=true;this.fireEvent("capslockon",this);}
if(this.preventCapsLockChar){e.stopEvent();return false;}}else{if(this.capslock){if(this.capsLockIndicatorIconCls||this.capsLockIndicatorText||this.capsLockIndicatorTip){this.field.clearIndicator();}
this.capslock=false;this.fireEvent("capslockoff",this);}}}});
