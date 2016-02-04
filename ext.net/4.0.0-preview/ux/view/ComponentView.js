/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define("Ext.net.ComponentView",{extend:"Ext.util.Observable",alias:"plugin.componentview",constructor:function(config){var me=this;Ext.apply(me,config);me.cache=[];me.items=me.items||[];me.callParent(arguments);},init:function(view){var me=this;me.view=view;me.view.on("beforerefresh",me.removeComponents,me);me.view.on("refresh",me.insertComponents,me);me.view.on("beforeitemupdate",me.removeComponent,me);me.view.on("beforeitemremove",me.removeComponent,me);me.view.on("itemadd",me.itemAdded,me);me.view.on("itemupdate",me.itemUpdated,me);me.view.on("beforeitemclick",me.beforeItemClick,me);me.view.tpl.apply=function(values){return Ext.XTemplate.prototype.apply.apply(this,[me.addValues(values)]);};},getComponentTpl:function(tpl){var me=this;return Ext.isFunction(tpl.component)?tpl.component.call(me):tpl.component;},getComponentTarget:function(tpl,node){var me=this,selector=tpl.selector;if(tpl.value){selector=me.getValueSelector(tpl.value);}
return node.query(selector);},getComponentsValues:function(){var me=this,cls;if(me.componentValues){return me.componentValues;}
me.componentValues=[];Ext.each(me.items,function(tpl){if(tpl.value){cls=Ext.id();me.componentValues.push([tpl.value,'<div class="x-hidden '+cls+'"></div>',"."+cls]);}});return me.componentValues;},getValueSelector:function(value){var me=this;if(!me.valuesSelector){me.valuesSelector={};Ext.each(me.getComponentsValues(),function(tpl){me.valuesSelector[tpl[0]]=tpl[2];});}
return me.valuesSelector[value];},addValues:function(values){var me=this,cmpValues=me.getComponentsValues(),id,copy={};if(cmpValues.length==0){return values;}
if(Ext.isArray(values)){return Ext.Array.map(values,function(value){return me.addValues(value);});}
if(!Ext.isObject(values)){return values;}
Ext.Object.each(values,function(key,value){copy[key]=me.addValues(value);});Ext.each(cmpValues,function(value){copy[value[0]]=value[1];});return copy;},insertComponent:function(first,last){this.insertComponents(first,last+1);},itemUpdated:function(record,index){this.insertComponents(index,index+1);},itemAdded:function(records,index){this.insertComponents(index,index+(records.length||1));},beforeItemClick:function(view,record,item,index,e){var i,len,cacheItem,cmpEl;for(i=0,len=this.cache.length;i<len;i++){cacheItem=this.cache[i];if(cacheItem.id===record.id){cmpEl=cacheItem.cmp.getEl();break;}}
if(cmpEl&&e.within(cmpEl)){return false;}},insertComponents:function(start,end){var me=this,nodes=me.view.all.elements,node,i,c,t,cmp,cmps,targets,trg,tpl,len,record;if(Ext.isEmpty(start)||Ext.isEmpty(end)||!Ext.isNumber(start)||!Ext.isNumber(end)){start=0;end=nodes.length;}
for(i=start;i<end;i++){node=Ext.get(nodes[i]);record=me.view.store.getAt(i);if(me.fireEvent("beforebind",me,record,node,i,me.view)!==false){cmps=[];for(c=0,len=me.items.length;c<len;c++){cmp=me.items[c];targets=me.getComponentTarget(cmp,node);for(t=0;t<targets.length;t++){tpl=me.getComponentTpl(cmp);trg=Ext.get(targets[t]);if(me.fireEvent("beforecomponentbind",me,cmp,tpl,record,node,trg,i,me.view)!==false){tpl=Ext.ComponentManager.create(tpl);cmps.push(tpl);tpl.record=record;me.cache.push({id:record.id,cmp:tpl});if(cmp.value){tpl.render(trg.parent(),trg);trg.remove();}
else{tpl.render(trg);}
tpl.parentView={view:me.view,record:record};if(me.fireEvent("componentbind",me,cmp,tpl,record,node,i,me.view)===false){delete tpl.parentView;tpl.destroy();}
else{me.onBind(cmp,tpl,record);}}
else if(cmp.value){trg.remove();}}}
me.fireEvent("bind",me,record,cmps,node,i,me.view)!==false}
else{for(c=0,len=me.items.length;c<len;c++){cmp=me.items[c];targets=me.getComponentTarget(cmp,node);for(t=0;t<targets.length;t++){if(cmp.value){Ext.removeNode(targets[t]);}}}}}
if(!me.view.bufferedRefreshSize){me.view.bufferedRefreshSize=Ext.Function.createBuffered(me.view.refreshSize,10,me.view);}
me.view.bufferedRefreshSize();},onBind:function(cmp,tpl,record){if(cmp.boundField&&Ext.isFunction(tpl.setValue)){this.settingValue=true;tpl.setValue(record.get(cmp.boundField));this.settingValue=false;tpl.parentView.boundField=cmp.boundField;tpl.on("change",this.onSaveEvent,this);}},onSaveEvent:function(field){var me=this,value=field.getValue();if(me.settingValue||(field.record.get(field.parentView.boundField)==value)||!field.isValid()){return;}
field.record.beginEdit();field.record.set(field.parentView.boundField,value);field.record.endEdit(true);},removeComponent:function(view,record,rowIndex){for(var i=0,l=this.cache.length;i<l;i++){if(this.cache[i].id==record.id){try{var cmp=this.cache[i].cmp;this.fireEvent("componentunbind",this,cmp,cmp.record,this.view);this.onUnbind(cmp);cmp.destroy();Ext.Array.remove(this.cache,this.cache[i]);}catch(ex){}
break;}}},removeComponents:function(){for(var i=0,l=this.cache.length;i<l;i++){try{var cmp=this.cache[i].cmp;this.fireEvent("componentunbind",this,cmp,cmp.record,this.view);this.onUnbind(cmp);cmp.destroy();}catch(ex){}}
this.cache=[];},onUnbind:function(cmp){delete cmp.parentView;delete cmp.record;},destroy:function(){var view=this.view;this.removeComponents();view.un("refresh",this.insertComponents,this);view.un("beforerefresh",this.removeComponents,this);view.un("beforeitemupdate",this.removeComponent,this);view.un("beforeitemremove",this.removeComponent,this);view.un("itemadd",this.itemAdded,this);view.un("itemupdate",this.itemUpdated,this);}});
