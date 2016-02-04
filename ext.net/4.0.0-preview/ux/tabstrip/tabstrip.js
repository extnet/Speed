/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define("Ext.net.TabStrip",{extend:"Ext.tab.Bar",alias:"widget.tabstrip",plain:true,autoGrow:true,tabPosition:"top",getActiveTabField:function(){if(!this.activeTabField&&this.initialConfig&&Ext.isDefined(this.initialConfig.id)){this.activeTabField=new Ext.form.Hidden({name:this.id,value:this.id+":"+(this.activeTab||0)});this.on("beforedestroy",function(){if(this.rendered){this.destroy();}},this.activeTabField);}
return this.activeTabField;},initComponent:function(){this.dock=this.tabPosition;this.vertical=(this.tabPosition=='left'||this.tabPosition=='right');this.callParent(arguments);this.addCls("x-tab-strip");if(this.autoGrow){if(!this.vertical&&(this.initialConfig.width||this.initialConfig.flex)){this.autoGrow=false;}
if(this.vertical){if(this.initialConfig.height||this.initialConfig.flex){this.autoGrow=false;}
if(!this.initialConfig.width&&this.tabPosition=="left"){this.width=23;}}}
this.on("beforetabchange",function(tabStrip,newTab){newTab=newTab||{};var field=this.getActiveTabField();if(field){field.setValue(newTab.id+':'+this.items.indexOf(newTab));}},this);this.on("render",function(){var field=this.getActiveTabField();if(field){field.render(this.el.parent()||this.el);}},this);this.on("afterlayout",this.syncSize,this,{buffer:10});},onBeforeAdd:function(tab){tab.tabPosition=this.tabPosition;if(this.ui&&(tab.ui==="default")){tab.ui=this.ui;}
this.callParent(arguments);},onAdd:function(tab){tab.tabBar=this;this.callParent(arguments);},afterRender:function(){this.callParent(arguments);var activeTab=this.getComponent(this.activeTab||0);delete this.activeTab;this.setActiveTab(activeTab);},syncSize:function(){if(!this.autoGrow||!this.rendered||this.syncing){return;}
Ext.suspendLayouts();var horz=!this.vertical,size=0;this.items.each(function(item){size+=(horz?item.getWidth():item.getHeight())+2;});this.syncing=true;if(this._lastSize!=(size+2)){this._lastSize=size+2;this[horz?"setWidth":"setHeight"](size+2);}
Ext.resumeLayouts(true);this.syncing=false;},getActiveTab:function(){var me=this,result=me.getComponent(me.activeTab);if(result&&me.items.indexOf(result)!=-1){me.activeTab=result;}else{me.activeTab=null;}
return me.activeTab;},setActiveTab:function(tab){tab=this.getComponent(tab);if(tab){var previous=this.activeTab;if(previous&&previous!==tab&&this.fireEvent('beforetabchange',this,tab,previous)===false){return false;}
if(tab&&tab.actionItem){var cmp=Ext.getCmp(tab.actionItem),hideCmp,hideEl,hideCls;var hideFunc=function(){this.items.each(function(tabItem){if(tabItem!=tab&&tabItem.actionItem){hideCmp=Ext.getCmp(tabItem.actionItem);if(hideCmp){hideCmp.hideMode=tabItem.hideMode;hideCmp.hide();}else{hideEl=Ext.net.getEl(tabItem.actionItem);if(hideEl){switch(tabItem.hideMode){case"display":hideCls="x-hidden-display";break;case"offsets":hideCls="x-hidden-offsets";break;case"visibility":hideCls="x-hidden-visibility";break;default:hideCls="x-hidden-display";break;}
hideEl.addCls(hideCls);}}}},this);};if(cmp){if(cmp.ownerCt&&cmp.ownerCt.layout&&cmp.ownerCt.layout.setActiveItem){if(cmp.rendered){cmp.ownerCt.layout.setActiveItem(cmp);}else{cmp.activeItem=this.items.indexOf(tab);}}else{hideFunc.call(this);cmp.show();}}else{var el=Ext.net.getEl(tab.actionItem);if(el){hideFunc.call(this);el.removeCls(["x-hidden","x-hidden-display","x-hidden-visibility","x-hidden-offsets"]);}}}
this.callParent([tab]);this.activeTab=tab;if(this.actionContainer){this.setActiveCard(this.items.indexOf(tab));}
if(previous&&previous!==tab){this.fireEvent('tabchange',this,tab,previous);}}},setActiveCard:function(index){var cmp=Ext.getCmp(this.actionContainer);if(cmp.getLayout().setActiveItem&&cmp.rendered){cmp.getLayout().setActiveItem(index);}else{cmp.activeItem=index;}},closeTab:function(tab){var nextTab;if(tab&&tab.fireEvent('beforetabclose',this,tab)===false){return false;}
if(tab.active&&this.items.getCount()>1){if(this.previousTab&&this.previousTab.id!=tab.id){nextTab=this.previousTab;}else{nextTab=tab.next('tab')||this.items.first();}
this.setActiveTab(nextTab);}
this.fireEvent('tabclose',this,tab);this.remove(tab);if(nextTab){nextTab.focus();}},setTabText:function(tab,text){tab=this.getComponent(tab);tab.setText(text);this.doLayout();},setTabHidden:function(tab,hidden){tab=this.getComponent(tab);hidden?tab.hide():tab.show();},setTabIconCls:function(tab,iconCls){tab=this.getComponent(tab);tab.setIconCls(iconCls);this.doLayout();},setTabDisabled:function(tab,disabled){tab=this.getComponent(tab).setDisabled(disabled);},setTabTooltip:function(tab,tooltip){this.getComponent(tab).setTooltip(tooltip);},setTabUI:function(tab,ui){this.getComponent(tab).setUi(ui);}});
