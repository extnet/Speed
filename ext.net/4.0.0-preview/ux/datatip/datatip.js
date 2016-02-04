/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.ux.DataTip',function(DataTip){function onHostRender(){var e=this.isXType('panel')?this.body:this.el;if(this.dataTip.renderToTarget){this.dataTip.render(e);}
this.dataTip.setTarget(e);}
function updateTip(tip,data){if(tip.beforeShowTip(tip.eventHost,tip,data)===false){return false;}
if(tip.rendered){tip.update(data);}else{if(Ext.isString(data)){tip.html=data;}else{tip.data=data;}}}
function beforeViewTipShow(tip){var rec=this.view.getRecord(tip.triggerElement),data;if(rec){data=tip.initialConfig.data?Ext.apply(tip.initialConfig.data,rec.data):rec.data;return updateTip(tip,data);}else{return false;}}
function beforeFormTipShow(tip){var field=Ext.getCmp(tip.triggerElement.id);if(field&&(field.tooltip||tip.tpl)){return updateTip(tip,field.tooltip||field);}else{return false;}}
return{extend:'Ext.tip.ToolTip',mixins:{plugin:'Ext.AbstractPlugin'},alias:'plugin.datatip',lockableScope:'both',beforeShowTip:Ext.emptyFn,constructor:function(config){var me=this;me.callParent([config]);me.mixins.plugin.constructor.call(me,config);},init:function(host){var me=this;me.mixins.plugin.init.call(me,host);host.dataTip=me;me.host=host;if(host.isXType('tablepanel')){me.view=host.getView();if(host.ownerLockable){me.host=host.ownerLockable;}
me.delegate=me.delegate||me.view.rowSelector;me.on('beforeshow',beforeViewTipShow);}else if(host.isXType('dataview')){me.view=me.host;me.delegate=me.delegate||host.itemSelector;me.on('beforeshow',beforeViewTipShow);}else if(host.isXType('form')){me.delegate='.'+Ext.form.Labelable.prototype.formItemCls;me.on('beforeshow',beforeFormTipShow);}else if(host.isXType('combobox')){me.view=host.getPicker();me.delegate=me.delegate||me.view.getItemSelector();me.on('beforeshow',beforeViewTipShow);}
if(host.rendered){onHostRender.call(host);}else{host.onRender=Ext.Function.createSequence(host.onRender,onHostRender);}}};});
