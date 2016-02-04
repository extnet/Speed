Ext.define('Ext.net.PasswordMask', {
    extend: 'Ext.AbstractPlugin', 
    alias: 'plugin.passwordmask',

    mode : "showlast", // showall, showlast, hideall                        
	duration: 2000,
	replacementChar: '%u25CF',		    
    pattern: "abcdef12",
    allowAnyChars : true,
    strictPassword : false,
    acceptRate : 0.8,

    chars: {        
        digits: "1234567890",
        letters: "abcdefghijklmnopqrstuvwxyz",
        lettersUp: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        symbols: "@#$%^&*()-_=+[]{};:<>/?!"
    },

    messages: {
        pass: "password",
        and: "and",        
        passTooShort: "password is too short (min. length: {0})",
        noCharType: "password must contain {0}",
        digits: "digits",
        letters: "letters",
        lettersUp: "letters in UPPER case",
        symbols: "symbols",
        inBlackList: "password is in list of top used passwords",
        passRequired: "password is required",
        equalTo: "password is equal to login",
        repeat: "password consists of repeating characters",
        badChars: "password contains bad characters: “{0}”"
    },

    blackList: [
        "password", "123456", "12345678", "abc123", "qwerty", "111111", "1234567", "123123", "welcome", "password1", "p@ssw0rd", "root"
    ],
            
    constructor: function(config) {
        if (config && config.chars) {
            this.chars = Ext.apply({}, config.chars, this.chars);
            delete config.chars;
        }

        if (config && config.messages) {
            this.messages = Ext.apply({}, config.messages, this.messages);
            delete config.messages;
        }

        this.callParent(arguments); 
               
        var field = this.getCmp(),
            name = field.getName() || field.id || field.getInputId();

        field.submitValue = false;
        field.passwordMask = this;
        this.fieldGetErrors = field.getErrors;
        field.getErrors = this.getErrors;
        field.getPassword = Ext.Function.bind(this.getPassword, this);

        this.hiddenField = Ext.create('Ext.form.field.Hidden', {
            name : name
        });
               
        if (field.rendered) {
            field.inputEl.dom.removeAttribute('name');
            this.renderHiddenField();
            this.handleValue(field, field.getValue(), "");
        }
        else {
            field.on("beforerender", this.onBeforeRender, this);
            field.on("afterrender", this.renderHiddenField, this);
        }
               
        this.maskAll = Ext.Function.createBuffered(this._maskAll, this.duration, this);

        field.on("change", this.handleValue, this);
    },

    onBeforeRender : function () {
        var field = this.getCmp();
        this.handleValue(field, field.getValue(), "");
    },

    getPassword : function () {
        return this.hiddenField.getValue();
    },

    setMode : function (mode) {
        if (this.mode == mode) {
            return;
        }

        this.mode = mode;

        if (!this.getCmp().rendered) {
            return;
        }
        
        if (this.mode == "hideall" || this.mode == "showlast") {
            this._maskAll();
        }
        else {
            this.getCmp().setValue(this.hiddenField.getValue());
        }        
    },

    destroy : function () {
        this.callParent(arguments);
        this.hiddenField.destroy();
    },

    renderHiddenField : function () {
        var field = this.getCmp();

        if (field.ownerCt) {
            field.ownerCt.items.add(this.hiddenField);
        } else {
            this.hiddenField.render(field.el.parent());
        }               

        field.inputEl.on("keydown", this.onKeyDown, this);
    },

    onDelete: function(caret, delta){
		var value = this.hiddenField.getValue(),
		    split = caret;

		if (Ext.isNumber(caret) && (this.getCaretPosition() < caret)) {			        
			split = caret - delta;
		}
		else if (!Ext.isObject(caret)) {			        
			caret = caret + delta;
		}

		this.hiddenField.setValue(value.slice(0, caret.start || split) + value.slice(caret.end || caret));
	},

    maskChars: function(str) {		        
		var tmp = '',
            value = this.hiddenField.getValue(),
            replacementChar = unescape(this.replacementChar),
            caretPosition = this.getCmp().hasFocus ? this.getCaretPosition() : str.length,
		    add = 0,
            i;

		for (i=0; i < str.length; i++) {
			if (str.charAt(i) == replacementChar) {
				tmp += value.charAt(i - add);
			} else {
				tmp += str.charAt(i);
				if (caretPosition !== str.length) {
					add++;
				}
			}

		}
		this.hiddenField.setValue(tmp);
	},

    _maskAll: function() {
		if (this.mode == "showall") {
            return;
        }
        
        var field = this.getCmp(),
            value = field.getValue(),
            replacementChar = unescape(this.replacementChar),
            tmp,
            caret,
            i;

        if (value != '') {
			tmp = '';
            
			for (i=0; i < value.length; i++) {
				tmp += replacementChar;
			}
			        
            if (field.hasFocus) {                        
                caret = this.getCaretRange();
            }

            field.setValue(tmp);
			        
            if (field.hasFocus) {                        
                this.restoreCaretPos(caret);
            }
		}
	},

    onKeyDown : function (e) {
        var me = this,
            oldValue = me.cmp.lastValue;

        if (me.mode != "hideall") {
            return;
        }
        
        setTimeout(function () {
            var newValue = me.cmp.getValue(),
                key = e.getKey();

            if ((newValue.length < oldValue.length) && ((key === e.BACKSPACE) || (key === e.DELETE))) {
			    me.onDelete(me.getCaretRange(), oldValue.length - newValue.length);
		    } else {
                me.maskChars(newValue);
            }           
            
            me._maskAll();
        }, 0);
    },

    handleValue : function (field, newValue, oldValue) {
        var tmp,
            i,
            lastIndex,
            replacementChar = unescape(this.replacementChar),
            caret;

        if (this.mode == "showall") {
            this.hiddenField.setValue(newValue);
            return;
        }

        if(!this.getCmp().hasFocus)
        {
            this.maskChars(newValue);
            this._maskAll();
            return;
        }
        
        if(this.mode == "hideall")
        {
            return;
        }

        newValue = newValue || "";
        oldValue = oldValue || "";
                
        if (newValue.length < oldValue.length) {			        
			this.onDelete(this.getCaretRange(), oldValue.length - newValue.length);
		}

        if (oldValue != newValue) {
			this.maskChars(newValue);
			if (newValue.length > 1) {
				tmp = '';
                lastIndex = -1;
                
				for (i=0; i < newValue.length; i++) {
					if (newValue.charAt(i) != replacementChar) {
                        lastIndex = i;
                    }

                    tmp += replacementChar;
				}
				
                if (lastIndex >= 0) {            
                    tmp = this.replaceAt(tmp, lastIndex, newValue.charAt(lastIndex));
                }
				caret = this.getCaretRange();
				field.setValue(tmp);
				this.restoreCaretPos(caret);
			}			        

            this.maskAll();
		}
    },

    replaceAt : function(str, index, character) {
      return str.substr(0, index) + character + str.substr(index+character.length);
    },

    selectText : function(start, end){
        var me = this.getCmp(),
            v = me.getRawValue(),
            el = me.inputEl.dom,
            undef,
            range;

        if (v.length > 0) {
            start = start === undef ? 0 : start;
            end = end === undef ? v.length : end;
            if (el.setSelectionRange) {
                el.setSelectionRange(start, end);
            }
            else if(el.createTextRange) {
                range = el.createTextRange();
                range.moveStart('character', start);
                range.moveEnd('character', end - v.length);
                range.select();
            }
        }
    },

    restoreCaretPos: function(caret){
		if (!this.getCmp().hasFocus) {
            return;
        }

        if(Ext.isNumber(caret)) {
            return this.selectText(caret, caret);
        }
        else if(Ext.isObject(caret)) {
            return this.selectText(caret.start, caret.end);
        }
	},            

    getCaretPosition : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            //field.focus();
            sel = document.selection.createRange();
            sel.moveStart ('character', -field.getValue().length);
            caretPos = sel.text.length;
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = dom.selectionStart;
        }

        return caretPos;
    },

    getSelectedRange : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            var start = 0, 
                end = 0, 
                normalizedValue, 
                textInputRange, 
                len, 
                endRange,
                range = document.selection.createRange();

            if (range && range.parentElement() == dom) {
                len = dom.value.length;

                normalizedValue = dom.value.replace(/\r\n/g, "\n");
                textInputRange = dom.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = dom.createTextRange();
                endRange.collapse(false);
                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;
                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }

            caretPos = {                    
                start : start,
                end : end
            };
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = {                    
                start : dom.selectionStart,
                end : dom.selectionEnd
            };
        }

        return caretPos;
    },

	getCaretRange: function() {		        
		var range = this.getSelectedRange();
        return (range.start === range.end) ? this.getCaretPosition() : range;
	},

    generatePassword : function (pattern) {
        this.setMode("showall");        
        this.getCmp().setValue(this.createRandomPassword(pattern));        
    },

    createRandomPassword : function (pattern) {
        pattern = pattern || this.pattern;

        var result = "",
            charTypes = this.splitToCharTypes(pattern, "symbols"),
            charTypesSeq = [];

        Ext.iterate(charTypes, function(charType, chars) {
            for (var j = 0; j < chars.length; j++) {
                charTypesSeq.push(charType);
            }
        });

        charTypesSeq = charTypesSeq.sort(function() { 
            return 0.7 - Math.random(); 
        });

        Ext.each(charTypesSeq, function(charType) {
            var sequence = this.chars[charType];
            if (sequence) {
                if (this.chars[charType] && this.chars[charType].indexOf(sequence) < 0) {
                    sequence = this.chars[charType]; 
                }
            } else {
                sequence = this.chars[charType];
            }
            result += this.selectRandom(sequence);
        }, this);

        return result;
    },

    splitToCharTypes : function (str, defaultCharType) {
        var result = {},
            i,
            ch,
            type;

        for (i = 0; i < str.length; i++) {
            ch = str.charAt(i);
            type = defaultCharType;

            Ext.iterate(this.chars, function(charType, seq) {
                if (seq.indexOf(ch) >= 0) {
                    type = charType;
                    return false;
                }
                return true;
            });

            result[type] = (result[type] || "") + ch;
        }
        return result;
    },

    selectRandom : function(arr) {
        var pos = Math.floor(Math.random() * arr.length);
        return Ext.isArray(arr) ? arr[pos] : arr.charAt(pos);
    },

    calculateStrength : function (pass, pattern) {
        pattern = pattern || this.pattern;
        pass = pass || this.hiddenField.getValue();

        var charTypesPattern = this.splitToCharTypes(pattern, "symbols"),
            charTypesPass = this.splitToCharTypes(pass, this.allowAnyChars ? "symbols" : "unknown"),
            messages = [],
            strength,
            charTypesPatternCount = 0;

        Ext.iterate(charTypesPattern, function (charType) {
            charTypesPatternCount++;
            if (!charTypesPass[charType]) {
                var msg = this.messages[charType],
                    symbolsCount = 4,
                    charsExample = this.chars[charType];

                if (charType == "symbols") {                    
                    if (charsExample.length > symbolsCount) {
                        charsExample = charsExample.substring(0, symbolsCount);
                    }
                    msg = msg + " (" + charsExample + ")";
                }
                messages.push(msg);
            }
        }, this);

        strength = 1 - messages.length / charTypesPatternCount;

        if (messages.length) {
            messages = [this.joinMessagesForCharTypes(messages)];
        }

        if (!this.strictPassword) {
            var extraCharTypesCount = 0;
            Ext.iterate(charTypesPass, function(charType) {
                if (!charTypesPattern[charType]) {                    
                    extraCharTypesCount++;
                }
            });
            strength += extraCharTypesCount / charTypesPatternCount;
        }

        var lengthRatio = pass.length / pattern.length - 1;
        if (lengthRatio < 0) {
            strength += lengthRatio;
            messages.push(Ext.String.format(this.messages.passTooShort, pattern.length));
        } else {
            if (!this.strictPassword) {
                strength += lengthRatio / charTypesPatternCount;
            }
        }

        if (pass.length > 2) {
            var firstChar = pass.charAt(0),
                allEqual = true;

            for (var i = 0; i < pass.length; i++) {
                if (pass.charAt(i) != firstChar) {
                    allEqual = false;
                    break;
                }
            }
            if (allEqual) {
                strength = 0;
                messages = [this.messages.repeat];
            }
        }

        if (strength < 0) {
            strength = 0;
        }
        
        if (strength > 1) {
            strength = 1;
        }

        return { strength: strength, messages: messages, charTypes: charTypesPass };
    },

    joinMessagesForCharTypes : function (messages) {
        var replacement = messages[0];
        for (var i = 1; i < messages.length; i++) {
            if (i == messages.length - 1) {
                replacement += " " + this.messages.and + " ";
            } 
            else {
                replacement += ", ";
            }

            replacement += messages[i];
        }

        return Ext.String.format(this.messages.noCharType, replacement);
    },

    validatePassword : function () {
        var pass = this.hiddenField.getValue() || "",
            checkResult,
            isInBlackList = false;

        if (pass.length == 0) {
            checkResult = { strength: 0, messages: [] };
        } else {            
            checkResult = this.calculateStrength(pass);

            if (!this.allowAnyChars && checkResult.charTypes["unknown"]) {
                checkResult = { strength: null, messages: [Ext.String.format(this.messages.badChars, checkResult.charTypes["unknown"])] };
            }
            delete checkResult.charTypes;

            Ext.each(this.blackList, function(el) {
                if (el == pass) {
                    isInBlackList = true;
                    return false;
                }

                return true;
            });

            if (isInBlackList) {
                checkResult = { strength: 0, messages: [this.messages.inBlackList] };
            }
            
            if (pass && pass === this.getLoginFieldValue()) {
                checkResult = { strength: 0, messages: [this.messages.equalTo] };
            }
        }        
        
        if (pass.length == 0 && this.allowBlank) {            
            this.lastValidation = { strength: 0, valid : true };            
        } 
        else if (checkResult.strength === null || checkResult.strength < this.acceptRate) {
            checkResult.valid = false;
            this.lastValidation = checkResult;
        } 
        else {
            this.lastValidation = { strength: checkResult.strength, valid : true };
        }

        return this.lastValidation;
    },

    getLoginFieldValue : function () {
        if (!this.loginField) {
            return null;
        }

        if (Ext.isString(this.loginField)) {
            this.loginField = Ext.net.ResourceMgr.getCmp(this.loginField);
        }

        return this.loginField.getValue();
    },

    getErrors : function (value) {
        var originalErrors = this.passwordMask.fieldGetErrors.call(this, value),
            validation = this.passwordMask.validatePassword();

        return !validation.valid ? originalErrors.concat(validation.messages) : originalErrors;
    }
});