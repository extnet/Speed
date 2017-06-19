/*
 * @version   : 4.2.2 - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2017-06-19
 * @copyright : Copyright (c) 2008-2017, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/.
 */


Ext.define('gh1486',{override:'Ext.chart.series.Cartesian',dataGapsHandling:false,getYRange:function(){var me=this;if(me.dataGapsHandling){return(me.dataRange[1]===null||me.dataRange[3]===null)?null:[me.dataRange[1],me.dataRange[3]];}else{return me.callParent(arguments);}},getRangeOfData:function(data,range){var me=this;if(me.dataGapsHandling){var i,length=data.length,value,min=range.min,max=range.max;for(i=0;i<length;i++){value=data[i];if(Ext.isNumeric(value)){if(value<min){min=value;}
if(value>max){max=value;}}}
range.min=min;range.max=max;}else{return me.callParent(arguments);}}});
