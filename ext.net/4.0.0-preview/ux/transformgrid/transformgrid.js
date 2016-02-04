/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.ux.grid.TransformGrid',{extend:'Ext.grid.Panel',alias:"widget.transformgrid",constructor:function(config){config=Ext.apply({},config);var table;if(config.table.isComposite){if(config.table.elements.length>0){table=Ext.get(config.table.elements[0]);}}else{table=Ext.get(config.table);}
var configFields=config.fields||[],configColumns=config.columns||[],fields=[],cols=[],headers=table.query("thead th"),i=0,len=headers.length,data=table.dom,width,height,store,col,text,name;for(;i<len;++i){col=headers[i];text=col.innerHTML;name='tcol-'+i;fields.push(Ext.applyIf(configFields[i]||{},{name:name,mapping:'td:nth('+(i+1)+')/@innerHTML'}));cols.push(Ext.applyIf(configColumns[i]||{},{text:text,dataIndex:name,width:col.offsetWidth,tooltip:col.title,sortable:true}));}
if(config.width){width=config.width;}else{width=table.getWidth()+1;}
if(config.height){height=config.height;}
Ext.apply(config,{store:{data:data,fields:fields,proxy:{type:'memory',reader:{record:'tbody tr',type:'xml'}}},columns:cols,width:width,height:height});this.callParent([config]);Ext.defer(function(){this.render(data.parentNode,data);if(config.remove!==false){data.parentNode.removeChild(data);}},1,this);},onDestroy:function(){this.callParent();this.table.remove();delete this.table;}});
