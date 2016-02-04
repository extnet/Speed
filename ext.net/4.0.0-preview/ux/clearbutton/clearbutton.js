/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define("Ext.net.ClearButton",{extend:"Ext.util.Observable",alias:"plugin.clearbutton",hideIfEmpty:true,hideOnMouseOut:true,clearOnEsc:true,cls:"x-clear-button",constructor:function(cfg){Ext.apply(this,cfg);this.callParent(arguments);},init:function(field){this.field=field;if(field.rendered){this.initPlugin();}else{field.on("afterrender",this.initPlugin,this,{single:true});}},initPlugin:function(){this.el=this.field.bodyEl.createChild({tag:"div",cls:this.cls});this.el.hide();this.initEvents();if(this.clearOnEsc){this.field.inputEl.on("keydown",this.onEsc,this);}
this.field.inputEl.addCls("x-clear-field");this.updatePosition();this.updateVisibility();},clear:function(focus){if(this.fireEvent("beforeclear",this)!==false){var value=this.field.getValue();this.field.setValue('');if(focus!==false){this.field.focus();}
this.fireEvent("clear",this,value);}},onEsc:function(e){if(e.getKey()==Ext.EventObject.ESC){if(this.field.isExpanded){return;}
this.clear();e.stopEvent();}},initEvents:function(){this.field.on({resize:this.updatePosition,change:this.updateButton,scope:this});this.field.bodyEl.on({mouseover:this.onMouseOver,mouseout:this.onMouseOut,scope:this});this.el.on("click",this.clear,this);},destroy:function(){if(this.el){this.el.destroy();}
this.callParent(arguments);},onMouseOver:function(){this.mouseOver=true;this.updateVisibility(true);},onMouseOut:function(){this.mouseOver=false;this.updateVisibility(false);},fieldHasScrollBar:function(){var inputEl=this.field.inputEl,overflowY;if(inputEl.dom.type.toLowerCase()!=="textarea"){return false;}
overflowY=inputEl.getStyle("overflow-y");if(overflowY=="hidden"||overflowY=="visible"){return false;}
if(overflowY=="scroll"){return true;}
if(inputEl.dom.scrollHeight<=inputEl.dom.clientHeight){return false;}
return true;},getPosition:function(){var pos=this.field.inputEl.getBox(false,true),top=pos.y,right=pos.x;if(this.fieldHasScrollBar()){right+=Ext.getScrollBarWidth();}
return{right:right,top:top};},updatePosition:function(){if(this.el){var pos=this.getPosition();if(this.field.getInherited().rtl){this.el.alignTo(this.field.inputEl,"l-l?",[pos.right+2,0],false);}else{this.el.alignTo(this.field.inputEl,"r-r?",[-pos.right-2,0],false);}}},updateButton:function(){this.updatePosition();this.updateVisibility();},updateVisibility:function(){var el=this.el;if(el){if(this.field.readOnly||(this.hideIfEmpty&&Ext.isEmpty(this.field.getValue()))||(this.hideOnMouseOut&&!this.mouseOver)){this.el.hide();}else{this.el.show();}
this.updatePosition();}}});
