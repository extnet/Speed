/*
 * @version   : 4.8.2 - Ext.NET License
 * @author    : Object.NET, Inc. https://object.net/
 * @date      : 2019-06-10
 * @copyright : Copyright (c) 2008-2019, Object.NET, Inc. (https://object.net/). All rights reserved.
 * @license   : See license.txt and https://ext.net/license/
 */


Ext.define('Ext.ux.TabReorderer',{extend:'Ext.ux.BoxReorderer',alias:'plugin.tabreorderer',itemSelector:'.'+Ext.baseCSSPrefix+'tab',init:function(tabPanel){var me=this;me.isTabStrip=!tabPanel.getTabBar;me.callParent([!me.isTabStrip?tabPanel.getTabBar():tabPanel]);if(!me.isTabStrip){tabPanel.onAdd=Ext.Function.createSequence(tabPanel.onAdd,me.onAdd);}},onBoxReady:function(){var tabs,me=this,len,i=0,tab;this.callParent(arguments);if(!me.isTabStrip){for(tabs=me.container.items.items,len=tabs.length;i<len;i++){tab=tabs[i];if(tab.card){tab.reorderable=tab.card.reorderable;}}}},onAdd:function(card,index){card.tab.reorderable=card.reorderable;},afterBoxReflow:function(){var me=this;Ext.ux.BoxReorderer.prototype.afterBoxReflow.apply(me,arguments);if(me.dragCmp){if(!me.container.tabPanel){me.container.setActiveTab(me.dragCmp);}
else{me.container.tabPanel.setActiveTab(me.dragCmp.card);me.container.tabPanel.move(me.dragCmp.card,me.curIndex);}}}});
