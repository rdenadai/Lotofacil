/* Rodolfo De Nadai */
// --------------------------------------------------------------------------------------------------------------------
// FUNCTIONS
try {
	$(".select2El").select2({width: 'resolve'});
	$('.selectpicker').selectpicker({
		size: 10
		,title: 'Nada selecionado...'
		,container: 'body'
		,dropupAuto: false
	});
	$('input.datepicker').datepicker({
		format: 'dd/mm/yyyy',
		todayBtn: true,
		todayHighlight: true,
		language: 'pt-BR'
	});
	$('input.datepicker').mask('00/00/0000', {placeholder: "__/__/____"});
	$("input.telefone").mask('(00) 000000000', {placeholder: "(__) _________"});
	$("input[name='cep']").mask('00000-000', {placeholder: "_____-___"});
	$("input[name='cnpj']").mask('00.000.000/0000-00', {placeholder: "__.___.___/____-__"});
	$("input[name='cpf']").mask('000.000.000-00', {placeholder: "___.___.___-__"});
} catch(exception) {
	// Its easy to ask forgiveness and not permission!
}

$("input.number").keydown(function(event) {
	// Allow: backspace, delete, tab, escape and virgula
	if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 188 ||
		// Allow: Ctrl+A
		(event.keyCode == 65 && event.ctrlKey === true) ||
		// Allow: home, end, left, right
		(event.keyCode >= 35 && event.keyCode <= 39)) {
			// let it happen, don't do anything
			return;
	} else {
		// Ensure that it is a number and stop the keypress
		if ( event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 ) )
		{
			event.preventDefault();
		}
	}
});

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.isEmpty = function() {
	return ($.trim(this).length > 0) ? false : true;
};

function isValidDate(d) {
	if(Object.prototype.toString.call(d) !== "[object Date]")
		return false;
	return !isNaN(d.getTime());
}

Date.prototype.addDays = function(days) {
	this.setDate(this.getDate() + days);
	return this;
};

function roundNumber(num) {
	num = new String(num).replace(',', '.');
	return (Math.floor(num * 100) / 100).toFixed(2).replace('.', ',');
}

function isFloat(n) {
    return n === +n && n !== (n|0);
}

function isInteger(n) {
    return n === +n && n === (n|0);
}

function showLoadScreen(msg) {
	var loading = $('#loading');
	loading.find('.informacao').html(msg);
	loading.fadeIn('fast');
};

function hideLoadScreen() {
	$('#loading').fadeOut('fast');
};

function loadComboData(objeto) {
	if(objeto.id) {
		var field = $(("#"+objeto.id));
		field.empty();
		$.each(objeto.data, function(chave, valor) {
			var selected = (objeto.value == valor.value) ? "selected" : "";
			field.append('<option value="'+valor.value+'" '+selected+'>'+valor.label+'</option>');
		});
	}
};

function reload(objeto) {
	if($.trim(objeto.url).length > 0) {
		if(objeto.id) {
			var field = $(("#"+objeto.id));
			$.ajax({
				url: objeto.url
				,type: objeto.method
				,dataType: "json"
				,async: true
				,data: objeto.data
			}).done(function(data) {
				// se o retorno for um objeto valido e nao vazio
				if(typeof(data) == 'object' && data) {
					field.empty();
					$.each(data[objeto.item.root], function(chave, valor) {
						var selected = (objeto.value == valor[objeto.item.valor]) ? "selected" : "";
						field.append('<option value="'+valor[objeto.item.valor]+'" '+selected+'>'+valor[objeto.item.nome]+'</option>');
					});
					if(objeto['done'])
						objeto.done();
				}
			});
		}
	}
};

var modal = {
	options: {
		el: null
		,id: "#modal-padrao"
		,width: window.width
		,height: 145
		,shownEvent: function() { return true; }
		,hiddenEvent: function() { return true; }
	}
	,show: function(obj) {
		if(typeof(obj) == 'object' && obj)
		{
			var m = this;
			var opts = this.options;
			var zIndex = (obj.zIndex) ? obj.zIndex : null;
			this.options.id = (obj.id) ? obj.id : this.options.id;
			this.options.width = (obj.width) ? obj.width : this.options.width;
			this.options.height = (obj.height) ? obj.height : this.options.height;
			this.options.shownEvent = (obj.shownEvent) ? obj.shownEvent : this.options.shownEvent;
			this.options.hiddenEvent = (obj.hiddenEvent) ? obj.hiddenEvent : this.options.hiddenEvent;
			var footer = (obj.footer) ? obj.footer : '<button class="sharperBtn font3 azul" data-dismiss="modal" aria-hidden="true">Fechar</button>';
			this.options.el = $(this.options.id);
			var janela = this.options.el;
			if(janela) {
				// events
				janela.off('shown').on('shown', function () { m._redimensionar(); opts.shownEvent(); });
				janela.off('hidden').on('hidden', function () { opts.hiddenEvent(); });
				// configurations
				janela.css("z-index", zIndex);
				janela.find(".modal-padrao-header").html(obj.header);
				janela.find(".modal-body").html(obj.msg);
				janela.find(".modal-footer").html(footer);
				this._redimensionar();
				janela.modal('show');
			}

		}
	}
	,hide: function() {
		var janela = this.options.el;
		janela.modal('hide');
	}
	,setBody: function(html) {
		var janela = $(this.options.id);
		janela.find(".modal-body").html(html);
	}
	,_redimensionar: function() {
		var janela = this.options.el;
		janela.css('width', this.options.width);
		var top = (($(window).outerHeight() / 2) - janela.outerHeight()) / 2;
		janela.css('margin-top', top);
	}
};


var salvar = function(form, url, iframe, successCallback, hiddenEvent) {
	var footer = '<button type="submit" class="sharperBtn font3 azul" data-dismiss="modal" aria-hidden="true">Fechar</button>';
	canSubmit = true;
	first = [];
	form.find('.required').each(function() {
		var field = $(this);
		field.removeClass("obrigatorio");
		if(
			field.attr("type") === "text" ||
			field.attr("type") === "number" ||
			field.attr("type") === "email" ||
			field.attr("type") === "url" ||
			field.attr("type") === "password" ||
			field.is("textarea") ||
			field.is("select")
		) {
			var valor = field.val();
			if($.trim(valor).length <= 0) {
				canSubmit = false;
				field.addClass("obrigatorio");
				first.push(field);
			}
		} else if(field.find("input[type=checkbox], input[type=radio]").length > 0) {
			if(field.find(":checked").length <= 0) {
				canSubmit = false;
				field.addClass("obrigatorio");
				first.push(field);
			}
		}
	});

	form.find('.email').each(function() {
		var field = $(this);
		field.removeClass("obrigatorio");
		if(field.hasClass('required') || !field.val().isEmpty()) {
			var re = /\S+@\S+\.\S+/;
			if(!re.test($.trim(field.val()))) {
				canSubmit = false;
				field.addClass("obrigatorio");
				first.push(field);
			}
		}
	});

	if(canSubmit) {
		showLoadScreen('Aguarde...');

		if(iframe) {
			form.append("<iframe name='submit-iframe' src='#' frameborder='0' style='width:0px;height:0px;border:none;'></iframe>");
			var iframe = form.find("iframe");
			form.attr("target", "submit-iframe");
			form.attr("accept-charset", "utf-8");
			iframe.on("load", function() {
				hideLoadScreen();
				try {
					var data = $.parseJSON($(this).contents().text());
					if(typeof(data) == 'object' && data) {
						if(!data.success) { hiddenEvent = null; }

						modal.show({
							header: "<i class='fa fa-exclamation-triangle'></i>&nbsp;Aten&ccedil;&atilde;o"
							,msg: data.msg
							,height: 'auto'
							,footer: footer
							,hiddenEvent: hiddenEvent
						});

						if(data.success) {
							if(successCallback)
								successCallback(data);
						}
					}
				} catch(exception) {
					modal.show({
						header: "<i class='fa fa-exclamation-triangle'></i>&nbsp;Aten&ccedil;&atilde;o"
						,msg: "Erro ao executar sua opera&ccedil;&atilde;o!"
						,height: 'auto'
						,footer: footer
					});
				}
				$(this).remove();
			});
			form.submit();
		} else {
			// serialize all data to json format!
			var data = form.serialize();

			$.ajax({
				url: url
				,type: "POST"
				,dataType: "json"
				,async: true
				,data: data
			}).done(function(data) {
				if(typeof(data) == 'object' && data) {
					hideLoadScreen();
					if(!data.success) { hiddenEvent = null; }

					modal.show({
						header: "<i class='fa fa-exclamation-triangle'></i>&nbsp;Aten&ccedil;&atilde;o"
						,msg: data.msg
						,height: 'auto'
						,footer: footer
						,hiddenEvent: hiddenEvent
					});

					if(data.success) {
						if(successCallback)
							successCallback();
					}
				}
			});
		}
	} else {
		if(first.length > 0)
			$(first[0]).focus();
	}
};

var validateFields = function(form, successCallback, errorCallback) {
	canSubmit = true;
	first = [];
	form.find('.required').each(function() {
		var field = $(this);
		field.removeClass("obrigatorio");
		if(
			field.attr("type") === "text" ||
			field.attr("type") === "number" ||
			field.attr("type") === "email" ||
			field.attr("type") === "url" ||
			field.attr("type") === "password" ||
			field.is("textarea") ||
			field.is("select")
		) {
			var valor = field.val();
			if($.trim(valor).length <= 0) {
				canSubmit = false;
				field.addClass("obrigatorio");
				first.push(field);
			}
		} else if(field.find("input[type=checkbox], input[type=radio]").length > 0) {
			if(field.find(":checked").length <= 0) {
				canSubmit = false;
				field.addClass("obrigatorio");
				first.push(field);
			}
		}
	});

	form.find('.email').each(function() {
		var field = $(this);
		field.removeClass("obrigatorio");
		if(field.hasClass('required') || !field.val().isEmpty()) {
			var re = /\S+@\S+\.\S+/;
			if(!re.test($.trim(field.val()))) {
				canSubmit = false;
				field.addClass("obrigatorio");
				first.push(field);
			}
		}
	});

	var data = form.serializeArray();
	if(canSubmit) {
		if(successCallback)
			successCallback(form, data);
	} else {
		if(first.length > 0)
			$(first[0]).focus();
		if(errorCallback)
			errorCallback(form, data);
	}
};
