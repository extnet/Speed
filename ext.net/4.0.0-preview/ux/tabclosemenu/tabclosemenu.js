/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.ux.TabCloseMenu',{extend:'Ext.plugin.Abstract',alias:'plugin.tabclosemenu',mixins:{observable:'Ext.util.Observable'},closeTabText:'Close Tab',showCloseOthers:true,closeOthersTabsText:'Close Other Tabs',showCloseAll:true,closeAllTabsText:'Close All Tabs',extraItemsHead:null,extraItemsTail:null,constructor:function(config){this.callParent([config]);this.mixins.observable.constructor.call(this,config);},init:function(tabpanel){this.tabPanel=tabpanel;this.tabBar=tabpanel.down("tabbar");this.mon(this.tabPanel,{scope:this,afterlayout:this.onAfterLayout,single:true});},onAfterLayout:function(){this.mon(this.tabBar.el,{scope:this,contextmenu:this.onContextMenu,delegate:'.x-tab'});},destroy:function(){this.callParent();Ext.destroy(this.menu);},onContextMenu:function(event,target){var me=this,menu=me.createMenu(),disableAll=true,disableOthers=true,tab=me.tabBar.getChildByElement(target),index=me.tabBar.items.indexOf(tab);me.item=me.tabPanel.getComponent(index);menu.child('#close').setDisabled(!me.item.closable);if(me.showCloseAll||me.showCloseOthers){me.tabPanel.items.each(function(item){if(item.closable){disableAll=false;if(item!==me.item){disableOthers=false;return false;}}
return true;});if(me.showCloseAll){menu.child('#closeAll').setDisabled(disableAll);}
if(me.showCloseOthers){menu.child('#closeOthers').setDisabled(disableOthers);}}
event.preventDefault();me.fireEvent('beforemenu',menu,me.item,me);menu.showAt(event.getXY());},createMenu:function(){var me=this;if(!me.menu){var items=[{itemId:'close',text:me.closeTabText,iconCls:me.closeTabIconCls,scope:me,handler:me.onClose}];if(me.showCloseAll||me.showCloseOthers){items.push('-');}
if(me.showCloseOthers){items.push({itemId:'closeOthers',text:me.closeOthersTabsText,iconCls:me.closeOtherTabsIconCls,scope:me,handler:me.onCloseOthers});}
if(me.showCloseAll){items.push({itemId:'closeAll',text:me.closeAllTabsText,iconCls:me.closeAllTabsIconCls,scope:me,handler:me.onCloseAll});}
if(me.extraItemsHead){items=me.extraItemsHead.concat(items);}
if(me.extraItemsTail){items=items.concat(me.extraItemsTail);}
me.menu=Ext.create('Ext.menu.Menu',{items:items,listeners:{hide:me.onHideMenu,scope:me,delay:1}});}
return me.menu;},onHideMenu:function(){var me=this;me.item=null;me.fireEvent('aftermenu',me.menu,me);},onClose:function(){this.tabPanel.closeTab(this.item);},onCloseOthers:function(){this.doClose(true);},onCloseAll:function(){this.doClose(false);},doClose:function(excludeActive){var items=[];this.tabPanel.items.each(function(item){if(item.closable){if(!excludeActive||item!==this.item){items.push(item);}}},this);Ext.suspendLayouts();Ext.Array.forEach(items,function(item){this.tabPanel.closeTab(item);},this);Ext.resumeLayouts(true);}});
