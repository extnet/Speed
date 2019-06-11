/*
 * @version   : 4.8.2 - Ext.NET License
 * @author    : Object.NET, Inc. https://object.net/
 * @date      : 2019-06-10
 * @copyright : Copyright (c) 2008-2019, Object.NET, Inc. (https://object.net/). All rights reserved.
 * @license   : See license.txt and https://ext.net/license/
 */


Ext.define('Ext.ux.FieldReplicator',{alias:'plugin.fieldreplicator',init:function(field){if(!field.replicatorId){field.replicatorId=Ext.id();}
field.on('blur',this.onBlur,this);},onBlur:function(field){var ownerCt=field.ownerCt,replicatorId=field.replicatorId,isEmpty=Ext.isEmpty(field.getRawValue()),siblings=ownerCt.query('[replicatorId='+replicatorId+']'),isLastInGroup=siblings[siblings.length-1]===field,clone,idx;if(isEmpty&&!isLastInGroup){Ext.defer(field.destroy,10,field);}
else if(!isEmpty&&isLastInGroup){if(field.onReplicate){field.onReplicate();}
clone=field.cloneConfig({replicatorId:replicatorId});idx=ownerCt.items.indexOf(field);ownerCt.add(idx+1,clone);}}});
