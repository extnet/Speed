/*
 * @version   : 4.0.0-preview - Ext.NET License
 * @author    : Object.NET, Inc. http://object.net/
 * @date      : 2016-02-04
 * @copyright : Copyright (c) 2008-2016, Object.NET, Inc. (http://object.net/). All rights reserved.
 * @license   : See license.txt and http://ext.net/license/
 */


Ext.define('Ext.net.TagLabel',{extend:'Ext.Component',alias:'widget.taglabel',maxLength:18,closeCls:'x-taglabel-item-close',baseCls:"x-taglabel",defaultClosable:false,allowDuplicates:true,selectionMode:false,stacked:false,trackOver:false,removeOnDblClick:false,menuAlign:"tl-bl?",menuOnLeftClick:false,valueDelimeter:"::",tagsDelimeter:",",renderTpl:['<ul class="x-taglabel-list">','{[this.empty(values)]}','{[this.tagInput()]}','</ul>',{compiled:true,disableFormats:true,label:this,tagInput:function(){return this.label.inputEl?'<li class="x-taglabel-input"></li>':'';},empty:function(values){return this.label.emptyText?('<span class="x-taglabel-empty">'+(values.length?'':this.label.emptyText)+'</span>'):'';}}],initComponent:function(){this.ignoreChange=0;if(Ext.isArray(this.renderTpl)){this.renderTpl[this.renderTpl.length-1].label=this;}
else{this.renderTpl.label=this;}
this.callParent(arguments);this.tags=this.tags||[];if(Ext.isString(this.tags)){this.tags=Ext.Array.clean(this.tags.split(this.tagsDelimeter));}
if(this.stacked){this.addCls("x-taglabel-stacked");}
if(this.menu){this.menu=Ext.menu.Manager.get(this.menu);this.menu.tagLabel=this;}},beforeRender:function(){var me=this;me.callParent(arguments);Ext.apply(me.renderData,{label:me});Ext.apply(me.childEls,{emptyEl:{selectNode:"span.x-taglabel-empty"},ulEl:{selectNode:"ul"},inputLi:{selectNode:"li.x-taglabel-input"}});},afterRender:function(){var me=this;me.callParent(arguments);if(me.menu&&me.menuOnLeftClick){me.mon(me.menu,{scope:me,show:me.onMenuShow,hide:me.onMenuHide});}
me.mon(me.ulEl,{scope:me,click:me.handleEvent,dblclick:me.handleEvent,contextmenu:me.handleEvent,keydown:me.handleEvent});me.ulEl.unselectable();if(this.inputLi&&this.inputEl){this.inputLi.appendChild(this.inputEl);this.mon(this.inputEl,"focus",this.onInputElFocus,this);this.mon(this.inputEl,"blur",this.onInputElBlur,this);this.mon(this.inputEl,Ext.supports.SpecialKeyDownRepeat?'keydown':'keypress',this.fireKey,this);}
if(me.tags.length){var tags=me.tags;me.tags=[];me.add(tags);}},fireKey:function(e){if(e.isSpecialKey()){this.checkTab(this,new Ext.event.Event(e));}},checkTab:Ext.emptyFn,updateIndexes:function(){for(var i=0;i<this.tags.length;i++){this.tags[i].el.set({"data-index":i});}},getByField:function(name,value){var i;for(i=0;i<this.tags.length;i++){if(this.tags[i][name]==value){return this.tags[i];}}},getByText:function(text){return this.getByField("text",text);},getByValue:function(value){return this.getByField("value",value);},getTagObject:function(tag){if(this.tagDefaults){tag=Ext.applyIf(tag,this.tagDefaults);}
if((tag.selected&&(this.selectionMode=="none"||!this.selectionMode))||(tag.selected&&this.selectionMode=="single"&&this.getSelected().length>0)){tag.selected=false;}
var cls=["x-taglabel-item",tag.iconCls?"x-taglabel-item-icon":"",tag.iconCls&&tag.iconCls.indexOf('#')===0?X.net.RM.getIcon(tag.iconCls.substring(1)):(tag.iconCls||""),tag.disabled?"x-taglabel-item-disabled":"",tag.cls||"",tag.selected?"x-taglabel-item-selected":""],o;cls=Ext.Array.clean(cls);o={tag:"li",cls:cls.join(" ")};if(tag.qTitle){o["data-qtitle"]=tag.qTitle;}
if(tag.qTip){o["data-qtip"]=tag.qTip;if(!tag.qTitle){o["data-qtitle"]=tag.text;}}
if(tag.width){o.style="width:"+tag.width+"px;";}
if(tag.style){o.style=(o.style?(o.style+" "):"")+tag.style;}
o.cn=[];o.cn.push({tag:"div",cls:"x-taglabel-item-text",html:Ext.String.ellipsis(tag.text,this.maxLength)});if(this.defaultClosable&&tag.closable!==false||tag.closable){tag.closable=true;o.cls=o.cls+" x-taglabel-closable";o.cn.push({tag:"div",cls:"x-taglabel-close-btn"});}
return o;},indexOf:function(tag){var i=Ext.Array.indexOf(this.tags,tag);if(i>=0){return i;}
if(Ext.isString(tag)||Ext.isNumber(tag)){for(i=0;i<this.tags.length;i++){if(this.tags[i].value==tag||this.tags[i].text==tag){return i;}}}
for(var i=0;i<this.tags.length;i++){if(this.tags[i].value==tag.value||this.tags[i].text==tag.text){return i;}}},insert:function(index,tag){if(this.tagsMax&&this.tags.length>=this.tagsMax){return;}
var i,o,el,closeEl,tagArr,updateIndexes=true;if(!Ext.isObject(tag)){if(Ext.isString(tag)&&this.valueDelimeter&&tag.indexOf(this.valueDelimeter)>-1){tagArr=Ext.Array.clean(tag.split(this.valueDelimeter));tag={text:tagArr[0],value:tagArr[1]};}
else{tag={text:tag};}}
if(Ext.isDefined(tag.value)&&this.getByValue(tag.value)){return;}
if(!this.allowDuplicates&&this.getByText(tag.text)){return;}
if(!this.rendered){return;}
o=this.getTagObject(tag);o["data-index"]=index;if(this.fireEvent("beforetagadd",this,tag,o,index)!==false){if(index>=this.tags.length){this.tags.push(tag);updateIndexes=false;}
else{this.tags=Ext.Array.insert(this.tags,index,[tag]);}
if(index>=(this.tags.length-1)){if(this.inputLi&&this.ulEl.last("li")==this.inputLi){el=Ext.DomHelper.insertBefore(this.inputLi,o,true);}
else{el=Ext.DomHelper.append(this.ulEl,o,true);}}
else{el=this.tags[index+1].el;if(el){el=Ext.DomHelper.insertBefore(el,o,true);}
else{el=Ext.DomHelper.append(this.ulEl,o,true);}}
if(tag.closable){closeEl=Ext.get(el.query(".x-taglabel-close-btn")[0]);closeEl.hover(function(){!this.tag.disabled&&this.el.addCls("x-taglabel-close-btn-over");},function(){!this.tag.disabled&&this.el.removeCls("x-taglabel-close-btn-over");},{tag:tag,el:closeEl});closeEl.on({mousedown:function(){var field=this.label.field;if(field&&field.isExpanded){field.collapse=Ext.emptyFn;}},click:function(){var field=this.label.field;!this.tag.disabled&&this.label.remove(this.tag);if(field){field.collapse=field.originalCollapse;}},scope:{label:this,tag:tag}});}
if(this.trackOver){el.hover(function(){!this.tag.disabled&&this.el.addCls("x-taglabel-item-over");},function(){!this.tag.disabled&&this.el.removeCls("x-taglabel-item-over");},{tag:tag,el:el});}
if(tag.overCls){el.hover(function(){!this.tag.disabled&&this.el.addCls(this.tag.overCls);},function(){!this.tag.disabled&&this.el.removeCls(this.tag.overCls);},{tag:tag,el:el});}
tag.el=el;this.fireEvent("tagadd",this,tag,el,index);if(updateIndexes){this.updateIndexes();}
this.onTagsChange();return el;}},add:function(tag,multiple){if(Ext.isString(tag)&&multiple){tag=Ext.Array.clean(tag.split(this.tagsDelimeter));}
if(Ext.isArray(tag)){this.ignoreChange++;for(var i=0;i<tag.length;i++){this.add(tag[i]);}
this.ignoreChange--;this.onTagsChange();return;}
this.insert(this.tags.length,tag);},set:function(tags,multiple){this.ignoreChange++;this.removeAll();this.add(tags,multiple);this.ignoreChange--;this.onTagsChange();},getTagByParam:function(tag){if(Ext.isString(tag)||Ext.isNumber(tag)){for(var i=0;i<this.tags.length;i++){if(this.tags[i].value==tag||this.tags[i].text==tag){tag=this.tags[i];break;}}}
return tag;},remove:function(tag){var i,last;if(Ext.isArray(tag)){this.ignoreChange++;for(i=tag.length-1;0<=i;i--){this.remove(tag[i]);}
this.ignoreChange--;this.onTagsChange();return;}
tag=this.getTagByParam(tag);if(this.fireEvent("beforetagremove",this,tag)!==false){last=this.tags[this.tags.length-1]===tag;this.tags=Ext.Array.remove(this.tags,tag);tag.el.remove();if(!last){this.updateIndexes();}
this.fireEvent("tagremove",this,tag);}
this.onTagsChange();if(this.menu&&this.menu.isVisible()){this.menu.hide();}},onTagsChange:function(){if(this.ignoreChange){return;}
this.applyEmptyText();this.afterChange();},afterChange:Ext.emptyFn,applyEmptyText:function(){var empty=this.tags.length===0,visible;if(this.emptyText){visible=empty&&!this.inputElHasFocus;this.emptyEl.setDisplayed(visible);this.emptyEl.dom.innerHTML=visible?this.emptyText:"";}},onInputElFocus:function(){this.inputElHasFocus=true;this.applyEmptyText();},onInputElBlur:function(){this.inputElHasFocus=false;this.applyEmptyText();},removeAll:function(){this.remove(this.tags);},getValue:function(field,delimeter){var i,buf=[];for(i=0;i<this.tags.length;i++){if(field){buf.push(this.tags[i][field]);}
else{buf.push(Ext.isDefined(this.tags[i].value)?this.tags[i].value:this.tags[i].text);}}
return delimeter===false?buf:buf.join(delimeter||",");},getSelected:function(){var i,buf=[];for(i=0;i<this.tags.length;i++){if(this.tags[i].selected){buf.push(this.tags[i]);}}
return buf;},onclick:function(tag,e){var mode=this.selectionMode;if(e.getTarget(".x-taglabel-close-btn")){return false;}
if(!tag.disabled&&mode&&mode!="none"&&!((mode=="single"||mode=="multi")&&!e.ctrlKey&&tag.selected)&&this.fireEvent("beforeselect",this,tag,e)!==false){if(mode=="multi"){mode=e.ctrlKey?"simple":"single";}
if(mode=="single"){Ext.each(this.tags,function(t){if(t!=tag){t.selected=false;t.el.removeCls("x-taglabel-item-selected");}});}
tag.selected=!tag.selected;tag.el.toggleCls("x-taglabel-item-selected");this.fireEvent("select",this,tag,e);}
if(!tag.disabled&&this.menu&&this.menuOnLeftClick&&!this.ignoreNextClick){this.menu.activeTag=tag;this.menu.showBy(tag.el,this.menuAlign);}},ondblclick:function(tag,e){if(!tag.disabled&&this.removeOnDblClick){this.remove(tag);}},oncontextmenu:function(tag,e){if(!tag.disabled&&this.menu&&!this.menuOnLeftClick){e.preventDefault();this.menu.activeTag=tag;this.menu.showBy(tag.el,this.menuAlign);}},onMenuShow:function(e){var me=this;me.ignoreNextClick=0;},onMenuHide:function(e){var me=this;me.ignoreNextClick=Ext.defer(me.restoreClick,250,me);},restoreClick:function(){this.ignoreNextClick=0;},onkeydown:function(e){},handleEvent:function(e){var me=this,tag,li,index,key=e.type=='keydown'&&e.getKey();if(key){this.onkeydown(e);return;}
li=e.getTarget("li");index=li&&Ext.fly(li).getAttribute("data-index");if(index){index=parseInt(index,10);tag=this.tags[index];if(this["on"+e.type](tag,e)!==false){this.fireEvent(e.type,this,tag,e);}}},setTagText:function(tag,text){tag=this.getTagByParam(tag);tag.text=text;tag.el.query("div.x-taglabel-item-text")[0].innerHTML=text;},setTagIconCls:function(tag,iconCls){tag=this.getTagByParam(tag);if(tag.iconCls){tag.el.removeCls(tag.iconCls);}
if(!iconCls){tag.el.removeCls("x-taglabel-item-icon");tag.iconCls="";return;}
tag.iconCls=iconCls;tag.el.addCls(["x-taglabel-item-icon",iconCls.indexOf('#')===0?X.net.RM.getIcon(iconCls.substring(1)):iconCls]);},setTagCls:function(tag,cls){tag=this.getTagByParam(tag);if(tag.cls){tag.el.removeCls(tag.cls);}
if(!cls){tag.cls="";return;}
tag.cls=cls;tag.el.addCls(cls);},setTagDisabled:function(tag,disabled){tag=this.getTagByParam(tag);tag.disabled=disabled;tag.el[disabled?"addCls":"removeCls"]("x-taglabel-item-disabled");},beforeDestroy:function(){var me=this;if(me.menu&&me.destroyMenu!==false){Ext.destroy(me.menu);}
me.callParent();},moveInput:function(dir){if(this.inputLi){var el=dir==-1?this.inputLi.prev("li"):this.inputLi.next("li");if(el){this.isInputMoving=true;dir==-1?this.inputLi.insertBefore(el):this.inputLi.insertAfter(el);this.isInputMoving=false;}}},getInputPostion:function(){var el,index=this.tags.length-1;if(this.inputLi){el=this.inputLi.prev("li");if(!el){return 0;}
return parseInt(el.dom.getAttribute("data-index"),10)+1;}
return index;}});Ext.util.Format.tags=function(value,config){config=config||{};var buf,body,i,tag,o,emptyText=config.emptyText;if(Ext.isString(value)){value=Ext.Array.clean(value.split(","));}
if(value&&value.length){body=[];for(i=0;i<value.length;i++){tag=value[i];if(Ext.isString(tag)){tag={text:Ext.String.trim(tag)};}
o=Ext.net.TagLabel.prototype.getTagObject.call(config||{},tag);body.push(Ext.DomHelper.markup(o));}
body=body.join("");}
else{body=emptyText&&(!value||!value.length)?('<span class="x-taglabel-empty">'+emptyText+'</span>'):'';}
buf=['<div class="x-taglabel">','<ul class="x-taglabel-list">',body,'</ul>','</div>'];return buf.join("");};Ext.define('Ext.grid.column.Tag',{extend:'Ext.grid.column.Column',alias:['widget.tagcolumn'],defaultRenderer:function(value){return Ext.util.Format.tags(value,this.tagLabelCfg);}});Ext.define('Ext.net.TagField',{extend:'Ext.form.field.ComboBox',alias:'widget.nettagfield',createNewOnBlur:false,createNewOnEnter:true,createNewOnSelect:true,createNewOnSpace:false,collapseOnSelect:null,inputMoving:true,hideSelected:false,defaultClosable:true,delimiter:",",encodeOnCreate:false,valueMode:"array",ignoreSelection:0,initComponent:function(){var me=this;me.grow=false;this.addCls("x-tagcombo");this.multiSelect=false;this.store=this.initTagsStore();me.callParent(arguments);var task=new Ext.util.TaskRunner(50);task.start({interval:0,run:this.checkInputElChange,scope:this});this.pollTask=task;this.originalCollapse=this.collapse;},initTagsStore:function(){if(Ext.isArray(this.store)){this.displayField="text";this.valueField="value";return new Ext.data.Store({data:this.store,fields:["text","value","selected","iconCls","disabled","cls","qTitle","qTip","width","style","closable","overCls"],autoDestroy:true});}
return this.store;},initEvents:function(){var me=this,events=me.checkChangeEvents,event,e,eLen=events.length,onFieldMutation=me.onFieldMutation;me.callParent(arguments);if(!me.enableKeyEvents){me.mon(me.inputEl,'keydown',me.onKeyDown,me);me.mon(me.inputEl,'keyup',me.onKeyUp,me,{priority:1});}
me.mon(me.inputEl,'paste',me.onInputElPaste,me,{buffer:50});me.mon(this.inputCell||this.bodyEl,'click',me.onBodyElClick,me);if(!me.editable){me.mun(me.inputEl,'click',me.onTriggerClick,me);me.inputEl.setDisplayed(false);}
me.mun(me.inputEl,Ext.supports.SpecialKeyDownRepeat?'keydown':'keypress',me.fireKey,me);for(e=0;e<eLen;e++){event=events[e];me.mun(me.inputEl,event,onFieldMutation,me);}
me.usesPropertychange=false;},setEditable:function(editable){if(this.inputEl){this.inputEl.setDisplayed(editable);}
this.callParent(arguments);},onRender:function(){var me=this;me.callParent(arguments);if(!me.tagLabel){me.initTagLabel();}},initTagLabel:function(){var me=this;(this.inputCell||this.bodyEl).addCls(["x-form-field","x-form-text","x-field-buttons-body"]);this.bodyEl.addCls("x-field-toolbar-body");this.inputEl.addCls=Ext.Function.createSequence(this.inputEl.addCls,function(cls){(this.inputCell||this.bodyEl).addCls(cls);},this);this.inputEl.removeCls=Ext.Function.createSequence(this.inputEl.removeCls,function(cls){(this.inputCell||this.bodyEl).removeCls(cls);},this);me.tagLabel=new Ext.net.TagLabel(Ext.apply({emptyText:me.emptyText||'',field:me,inputEl:me.inputEl,defaultClosable:me.defaultClosable,afterChange:Ext.Function.bind(me.afterTagsChange,me),tagsDelimeter:me.delimiter,renderTo:me.inputEl.parent().dom},{tags:this.value||[]},me.tagLabelCfg||{}));me.tagLabel.on("tagadd",me.onTagAdd);if(me.tagLabel.stacked){this.addCls("x-tagcombo-stacked");}
this.checkInputElChange();this.afterTagsChange();},onTagAdd:function(tagLabel,tag,el,index){var tagField=tagLabel.field,pickerStore=tagField.getPickerStore(),newRec={};if(pickerStore.find(tagField.valueField,tag.value)===-1){newRec[tagField.valueField]=tag.value;newRec[tagField.displayField]=tag.text;pickerStore.add(newRec);}},applyEmptyText:Ext.emptyFn,afterTagsChange:function(){if(this.tagLabel){this.value=this.tagLabel.tags;}
this.checkChange();this.applyEmptyText();this.syncSelection();},checkInputElChange:function(){if(this.rendered){var value=Ext.util.Format.htmlEncode(this.inputEl.dom.value||"")+this.growAppend+this.growAppend+this.growAppend;this.inputEl.setWidth(this.inputEl.getTextWidth(value));}},onDestroy:function(){if(this.tagLabel){Ext.destroy(this.tagLabel);}
var task=this.pollTask;if(task){task.stopAll();delete this.pollTask;}
this.callParent();},getValue:function(){var state=[],value,record;Ext.each(this.value,function(obj){state.push(obj.value);},this);return this.valueMode=="array"?state:state.join(this.getDelimeter());},getDelimeter:function(){if(this.tagLabel){return this.tagLabel.tagsDelimeter;}
if(this.tagLabelCfg&&this.tagLabelCfg.tagsDelimeter){return this.tagLabelCfg.tagsDelimeter;}
return this.delimiter;},convertToTag:function(tag){var me=this,record=tag,obj,v;if(!record||!record.isModel){if(Ext.isObject(record)){if(Ext.isDefined(record.value)){v=record.value;}
else if(Ext.isDefined(record.text)){v=record.text;}
else if(Ext.isDefined(record[me.valueField])){v=record[me.valueField];}
else{v=record[me.displayField];}
if(Ext.isString(v)){v=Ext.String.trim(v);}
record=me.findRecordByValue(v);}
else{if(Ext.isString(record)){record=Ext.String.trim(record);}
record=me.findRecordByValue(record);}}
if(record){obj=Ext.apply({},record.data);obj.text=obj[me.displayField];obj.value=obj[me.valueField];}
else{if(!me.forceSelection){if(Ext.isObject(tag)){obj=Ext.apply({},tag);if(Ext.isDefined(obj[me.displayField])){obj.text=obj[me.displayField];}
if(Ext.isDefined(obj[me.valueField])){obj.value=obj[me.valueField];}}
else{obj={text:tag,value:tag};}}}
return obj;},addTag:function(tag){this.setValue(tag,{append:true});},addTagToInput:function(tag){if(!this.tagLabel){this.addTag(tag);}
this.setValue(tag,{index:this.tagLabel.getInputPostion()});},insertTag:function(index,tag){this.setValue(tag,{index:index});},removeTag:function(tag){this.setValue(tag,{remove:true});},convertValue:function(value){if(!value){value=[];}
if(Ext.isString(value)){value=Ext.Array.clean(value.split(this.getDelimeter()));}
if(!Ext.isArray(value)){value=[value];}
return value;},onValueCollectionEndUpdate:function(){this.multiSelect=true;this.callParent(arguments);this.multiSelect=false;},updateValue:function(){var me=this,selectedRecords=me.valueCollection.getRange(),len=selectedRecords.length,valueArray=[],displayTplData=me.displayTplData||(me.displayTplData=[]),inputEl=me.inputEl,i,record,matchedTags=[];displayTplData.length=0;for(i=0;i<len;i++){record=selectedRecords[i];displayTplData.push(record.data);if(record!==me.valueNotFoundRecord){valueArray.push({value:record.get(me.valueField)});}}
valueArray=this.convertValue(valueArray);for(i=0,len=valueArray.length;i<len;i++){obj=this.convertToTag(valueArray[i]);if(obj){matchedTags.push(obj);}}
me.value=matchedTags;if(!Ext.isDefined(me.value)){me.value=undefined;}
if(inputEl&&me.emptyText&&!Ext.isEmpty(me.value)){inputEl.removeCls(me.emptyCls);}
me.checkChange();me.applyEmptyText();},setValue:function(value,opts){var me=this,i,obj,v,matchedTags=[],len;opts=opts||{set:true};value=this.convertValue(value);if(this.store.loading){me.value=value;return me;}
for(i=0,len=value.length;i<len;i++){obj=this.convertToTag(value[i]);if(obj){matchedTags.push(obj);}}
if(matchedTags.length>0){if(this.tagLabel){if(opts.append){this.tagLabel.add(matchedTags);}
else if(Ext.isDefined(opts.index)){this.tagLabel.insert(opts.index,matchedTags[0]);}
else if(opts.remove){for(i=0;i<matchedTags.length;i++){obj=this.tagLabel.getByValue(matchedTags[i].value);if(obj){this.tagLabel.remove(obj);}}}else{this.tagLabel.set(matchedTags);}}else{if(opts.append){this.value=Ext.Array.push(this.value||[],matchedTags);}
else if(Ext.isDefined(opts.index)){this.value=Ext.Array.insert(this.value,opts.index,matchedTags[0]);}
else if(opts.remove){this.value=Ext.Array.remove(this.value,matchedTags[0]);}
else{this.value=matchedTags;}
this.checkChange();}}else{if(!opts.append&&!Ext.isDefined(opts.index)&&!opts.remove){if(this.tagLabel){this.tagLabel.set([]);}else{delete this.value;this.checkChange();}}}
if(this.inputEl&&this.emptyText&&!Ext.isEmpty(this.value)){this.inputEl.removeCls(this.emptyCls);}
if(this.tagLabel&&this.isExpanded){this.alignPicker();}},assertValue:function(){var me=this,value=me.inputEl?me.inputEl.dom.value:"",rec;if(me.createNewOnBlur&&value){if(me.encodeOnCreate){value=Ext.String.htmlEncode(value);}
rec=me.findRecordByDisplay(value);this.creatingOnBlur=true;if(rec){this.addTagToInput(rec);}
else if(!me.forceSelection){this.addTagToInput({text:value,value:value});}
this.creatingOnBlur=false;}
me.inputEl.dom.value='';if(this.tagLabel){Ext.defer(function(){this.tagLabel.ulEl.appendChild(this.tagLabel.inputLi);},1,this);}
me.collapse();},getRawValue:function(){var me=this,inputEl=me.inputEl,result;me.inputEl=false;result=me.callParent(arguments);me.inputEl=inputEl;return result;},setRawValue:function(value){var me=this,inputEl=me.inputEl,result;me.inputEl=false;result=me.callParent([value]);me.inputEl=inputEl;return result;},onKeyDown:function(e,t){var me=this,key=e.getKey(),rawValue=me.inputEl.dom.value,pos=me.getCursorPosition(),stopEvent=false;if(me.readOnly||me.disabled||!me.editable){return;}
if(me.isExpanded&&(key==e.A&&e.ctrlKey)){me.select(me.getStore().getRange());me.collapse();me.inputEl.focus();stopEvent=true;}
if(stopEvent){me.preventKeyUpEvent=stopEvent;e.stopEvent();return;}
if(key==e.ENTER&&rawValue.length!=0){e.stopEvent();}else if(key==e.LEFT){if(pos==0&&me.inputMoving){me.tagLabel.moveInput(-1,pos);if(!Ext.isIE){me.focus();}
me.selectText(0,0);}}else if(key==e.RIGHT){if(pos==rawValue.length&&me.inputMoving){me.tagLabel.moveInput(1,pos);if(!Ext.isIE){me.focus();}
me.selectText(pos,pos);}}
if(me.isExpanded&&(key==e.ENTER)&&me.picker.highlightedItem){me.preventKeyUpEvent=true;}
if(me.enableKeyEvents){me.callParent(arguments);}},onKeyUp:function(e,t){var me=this,key=e.getKey(),rawValue=me.inputEl.dom.value;if(me.preventKeyUpEvent){e.stopEvent();delete me.preventKeyUpEvent;return;}
if(me.readOnly||me.disabled||!me.editable){return;}
if(((me.createNewOnEnter&&key==e.ENTER)||(me.createNewOnSpace&&key==e.SPACE))&&rawValue){if(me.encodeOnCreate){rawValue=Ext.String.htmlEncode(rawValue);}
rawValue=Ext.Array.clean(rawValue.split(this.getDelimeter()));me.inputEl.dom.value='';me.store.clearFilter();me.addTagToInput(rawValue);me.inputEl.focus();e.stopEvent();return false;}
me.lastKey=key;if(!e.isSpecialKey()||key==e.BACKSPACE||key==e.DELETE){me.doQueryTask.delay(me.queryDelay);}},getSubmitArray:function(){var state=[],value,record;Ext.each(this.value,function(obj){state.push({value:obj.value,text:obj.text,selected:!!obj.selected});},this);return state;},getSubTplData:function(){var me=this,data=me.callParent(arguments),isEmpty=me.emptyText&&data.value.length<1;data.value='';data.placeholder='';data.inputElCls='';return data;},onInputElPaste:function(){var me=this,rawValue=me.inputEl.dom.value;rawValue=Ext.Array.clean(rawValue.split(this.getDelimeter()));me.inputEl.dom.value='';me.store.clearFilter();me.addTagToInput(rawValue);me.inputEl.focus();},onBodyElClick:function(e,t){var me=this,tagEl=e.getTarget('.x-taglabel-item');if(me.readOnly||me.disabled){return;}
if(!tagEl){if(!me.editable){me.onTriggerClick();}
else{this.inputEl.focus();}}},isEqual:function(v1,v2){var fromArray=Ext.Array.from,valueField=this.valueField,i,len,t1,t2;v1=fromArray(v1);v2=fromArray(v2);len=v1.length;if(len!==v2.length){return false;}
for(i=0;i<len;i++){t1=Ext.isDefined(v1[i].value)?v1[i].value:v1[i];t2=Ext.isDefined(v2[i].value)?v2[i].value:v2[i];if(t1!==t2){return false;}}
return true;},checkChange:function(){if(!this.suspendCheckChange){var me=this,newVal=me.value||[],oldVal=me.lastValue;if(!me.isEqual(newVal,oldVal)&&!me.isDestroyed){me.lastValue=Ext.Array.clone(newVal);me.fireEvent('change',me,newVal,oldVal);me.onChange(newVal,oldVal);}}},initValue:function(){this.callParent(arguments);if(!this.originalValue){this.originalValue=[];}
if(!this.lastValue){this.lastValue=[];}},getCursorPosition:function(){var cursorPos;if(Ext.isIE10m){cursorPos=document.selection.createRange();cursorPos.collapse(true);cursorPos.moveStart("character",-this.inputEl.dom.value.length);cursorPos=cursorPos.text.length;}else{cursorPos=this.inputEl.dom.selectionStart;}
return cursorPos;},syncSelection:function(){var me=this,picker=me.picker,valueField=me.valueField,pickStore,selection,selModel;if(picker){pickStore=picker.store;selection=[];if(me.value&&me.value.length){Ext.each(me.value,function(tag){var i=pickStore.findExact(valueField,tag.value);if(i>=0){selection.push(pickStore.getAt(i));}});}
me.ignoreSelection++;selModel=picker.getSelectionModel();selModel.deselectAll();if(selection.length>0){selModel.select(selection);}
if(me.ignoreSelection>0){--me.ignoreSelection;}
if(!this.creatingOnBlur){this.inputEl.focus();}}},onBindStore:function(){this.multiSelect=true;this.callParent(arguments);this.multiSelect=false;},createPicker:function(){var picker=this.callParent(arguments);picker.onItemClick=Ext.emptyFn;this.mon(picker.getSelectionModel(),{select:this.onItemSelect,deselect:this.onItemDeselect,scope:this});this.picker.on("refresh",this.syncSelection,this);if(this.hideSelected){this.picker.addCls("x-hide-selection");picker._origGetNavigationModel=picker.getNavigationModel;picker.getNavigationModel=this.getNavigationModel;}
picker.navigationModel.selectHighlighted=Ext.Function.createInterceptor(picker.navigationModel.selectHighlighted,function(){this.view.getStore().clearFilter();});return picker;},onItemSelect:function(sm,record){var me=this;if(me.ignoreSelection||!me.isExpanded){return;}
me.inputEl.dom.value="";if(!me.createNewOnSelect){me.inputEl.dom.value=record.get(me.displayField);if(me.collapseOnSelect!==false){me.collapse();}
me.ignoreSelection++;sm.deselect(record);me.ignoreSelection--;}
else{me.addTagToInput(record);if(me.collapseOnSelect===true){me.collapse();}}
me.fireEvent("select",me,record);me.store.clearFilter();me.inputEl.focus();},onItemDeselect:function(sm,record){var me=this;if(me.ignoreSelection||!me.isExpanded){return;}
me.removeTag(record);},afterQuery:function(queryPlan){var me=this;if(me.store.getCount()){if(me.typeAhead){me.doTypeAhead();}
if(queryPlan.rawQuery){me.syncSelection();if(me.picker&&!me.picker.getSelectionModel().hasSelection()){me.doAutoSelect();}}else if(!me.picker.getSelectionModel().hasSelection()){me.doAutoSelect();}}},doRawQuery:function(){this.doQuery(this.inputEl.dom.value,false,true);},onTypeAhead:function(){var me=this,displayField=me.displayField,inputElDom=me.inputEl.dom,boundList=me.getPicker(),tagLabel=me.tagLabel,newValue,fn,len,selStart;if(me.hideSelected){fn=this.createFilterFn(displayField,inputElDom.value);record=me.store.findBy(function(rec){return(tagLabel.getByText(rec.get(displayField))&&fn(rec));});record=(record===-1)?false:me.store.getAt(record);}else{record=me.store.findRecord(displayField,inputElDom.value);}
if(record){newValue=record.get(displayField);len=newValue.length;selStart=inputElDom.value.length;boundList.highlightItem(boundList.getNode(record));if(selStart!==0&&selStart!==len){inputElDom.value=newValue;me.selectText(selStart,newValue.length);}}},expand:function(){var picker=this.getPicker(),removeCls=false;if(!picker.rendered){picker.addCls("x-hide-visibility");removeCls=true;}
this.callParent(arguments);if(removeCls){picker.removeCls("x-hide-visibility");}},getNavigationModel:function(){var me=this,result;result=me._origGetNavigationModel.apply(this,arguments);if(me.pickerField.hideSelected&&result&&!result._originalSetPosition){result._originalSetPosition=result.setPosition;result.setPosition=this.pickerField.navigationSetPosition;}
return result;},navigationSetPosition:function(recordIndex,keyEvent,suppressEvent,fromSelectionModel){var me=this,view=this.view,dataSource=view.dataSource,selModel=view.getSelectionModel(),len=dataSource.getCount(),direction,newRecord,newRecordIndex;if(recordIndex!=null){if(typeof recordIndex==='number'){newRecordIndex=Math.max(Math.min(recordIndex,dataSource.getCount()-1),0);newRecord=dataSource.getAt(recordIndex);}
else if(recordIndex.isEntity){newRecord=recordIndex;newRecordIndex=dataSource.indexOf(recordIndex);}
else if(recordIndex.tagName){newRecord=view.getRecord(recordIndex);newRecordIndex=dataSource.indexOf(newRecord);}
else{newRecord=newRecordIndex=null;}}
if(newRecord&&selModel.isSelected(newRecord)){if(!Ext.isNumber(this.recordIndex)||newRecordIndex>this.recordIndex){direction=1;}else{direction=-1;}
do{newRecordIndex=newRecordIndex+direction;}while(newRecordIndex>0&&newRecordIndex<len&&selModel.isSelected(newRecord=dataSource.getAt(newRecordIndex)));}
if(selModel.isSelected(newRecord)){return;}
me._originalSetPosition.call(me,newRecordIndex,keyEvent,suppressEvent,fromSelectionModel);},onBlur:function(){if(this.tagLabel&&this.tagLabel.isInputMoving){return;}
this.callParent(arguments);},onFocusLeave:function(){if(this.tagLabel&&this.tagLabel.isInputMoving){return;}
this.callParent(arguments);}});
