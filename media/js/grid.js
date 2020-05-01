;(function ( $, window, document, undefined ) {

    var pluginName = 'grid',
        settings = {
            id: 'jgrid', // id padrao, por favor mude quando criar a grid
            width: '100%',
            height: 'auto',
            minHeight: '375px', // tamanho minimo em altura da grid
            headers: {},
            renderer: {},
            filter: {}, // Cria o combobox com os filtros na pesquisa
            items: [],
            reloadButton: true,
            autoLoad: true,
            url: "", // carregar via ajax eh legal
            data: { "DADOS" : [], "TOTAL" : 0}, // nao quer carrega via ajax? passa um objeto entao
            id_key: '', // qual campo sera chave
            qtdePagina: 15, // quantidade de registro por paginas
            pagination: true, // vai ter paginacao?
            qtdePagination: 10, // quantidade de paginas na paginacao
            query: false, // campo de busca
            strip: true, // zebrado? :D
            numbered: true, // numeros sequenciais, nao queira usar alem disso
            check: true, // checkbox para o usuario selecionar um registro
            aggregateOrder: false, // o order by vai ser por cada campo ou em conjunto?
            loaded: function() { }, // Loaded function
            element_click: function(e, ids, data) { }, // event when you click over a element line on the grid
            buttons: [] // Button actions
        },
        defaults = {
            checked : []
            ,grid : null
            ,root : null
        }

    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, settings, options);
        this._defaults = $.extend(true, {}, defaults);
        this._name = pluginName;
        this.init(element);
    }

    Plugin.prototype = {

        init : function (el) {
            var plgn = this;
            var opts = this.options;
            // recupera o elemento principal onde a grid sera criada
            this._defaults.root = $(el);
            // adiciona uma camada para organizar todos os proximos elementos
            this._defaults.root.append('<div class="styleTableParent"><div class="style-loading"><i class="fa fa-spinner fa fa-spin fa fa-2x"></i></div></div>');
            // apos camada adicionada retorna ela para uma variavel
            this._defaults.grid = this._defaults.root.find('.styleTableParent');
            // adiciona uma tabela onde os dados serao alocados posteriormente
            this._defaults.grid.append('<table id="'+opts.id+'" class="styleTable table-hover" cellspacing="0" cellpadding="0"><thead><tr></tr></thead><tbody></tbody></table>');
            // Verifica se o dev pediu para adicionar o btn
            relBtn = '';
            if(opts.reloadButton) {
                relBtn = '<div><a class="btn btn-small pull-left"  style="margin-bottom: 3px;"><i class="fa fa-refresh"></i></a>&nbsp;<div class="msgResposta"></div></div>';
            } else {
                relBtn = '<div class="msgResposta"></div>';
            }
            // adiciona uma barra no final da grid
            this._defaults.grid.append(
                '<div class="jgrid-pagination-parent">'+
                    '<div class="bottom-bar">'+
                       relBtn+
                    '</div>'+
                    '<div class="pagination pagination-mini" style="margin: 0px;"><ul class="jgrid-pagination"></ul></div>'+
                '</div>'
            );
            // button para atualizar os elementos da grid!
            if(opts.reloadButton) {
                this._defaults.grid.find('.bottom-bar > div > a').on("click", function(evt) {
                    evt.stopPropagation();
                    plgn.reload();
                });
            }

            // recupera o elemento tabela criado acima
            var $table = this._defaults.grid.find('table');
            var $thead = $table.find('thead > tr');
            var $tbody = $table.find('tbody');
            // seta variaveis de settings
            var $strip = opts.strip;
            if($strip)
                $table.addClass("table-striped");

            this._defaults.root.css({ "width" : opts.width });
            // seta os valores de altura e largura da grid container
            this._defaults.grid.css({
                "width" : opts.width
                ,"height" : opts.height
                ,"min-height" : opts.minHeight
            });
            var $headers = opts.headers;
            var $renderer = opts.renderer;
            // inicia os valores de paginacao da grid
            if( opts.qtdePagina === null || !opts.pagination) {
                opts.data.start = null;
                opts.data.limit = null;
            } else {
                opts.data.start = 0;
                opts.data.limit = opts.qtdePagina;
            }
            var $paginaAtual = 1;
            var $init = 1;
            var $end = $init + (opts.qtdePagination-1);

            // caso deva ser numerada
            if( opts.numbered ) {
                $thead.append('<th style="width:25px;"></th>');
            }
            // caso o usuario possa selecionar items
            if( opts.check ) {
                $thead.append('<th class="jgrid-checkbox"  style="width: 5px; padding: 4px;"><input type="checkbox" class="jgrid-checkbox-master" /></th>');
                $(".jgrid-checkbox-master").on("click", function() {
                    var checks = $(plgn._defaults.grid).find('td > :checkbox[name="jgrid-checkbox"]');
                    checks.prop('checked', $(this).is(":checked"));
                });
            }
            // cria os headers da tabela
            $.each($headers, function(name, value) {
                if(!value.hidden)
                {
                    var putCaret = '', hasOrder = '', hasWidth = '';
                    // corrige os valores de tamanho
                    if( value['width'] && value['width'].length > 0 ) {
                        hasWidth += 'width:' + value['width'] + ';';
                    }
                    if( value['maxWidth'] && value['maxWidth'].length > 0 ) {
                        hasWidth += 'max-width:' + value['maxWidth'] + ';';
                    }
                    if( value['minWidth'] && value['minWidth'].length > 0 ) {
                        hasWidth += 'min-width:' + value['minWidth'] + ';';
                    }

                    if(opts.data.sort) {
                        // cria os componentes de ordenacao da grid
                        $.each(opts.data.sort, function(k, v) {
                            // se o elemento a ser ordenado for um cabecalho valido
                            var propriedade = v.field ? v.field.toLowerCase() : v.property.toLowerCase();
                            if( propriedade === value['field'].toLowerCase() ) {
                                hasOrder = 'class="jgrid-ordered"';
                                typeCaret = 'fa fa-caret-up';
                                if( v.direction == "ASC" ) {
                                    typeCaret = 'fa fa-caret-down';
                                }
                                putCaret = '<span class="fa-order"><i style="float:right;" class="' + typeCaret + '" >&nbsp;&nbsp;</i></span>';
                            }
                        });
                    }
                    $thead.append('<th ' + hasOrder + 'style="' + hasWidth + '">' + value['name'] + putCaret + '</th>');
                    // encontra o ultimo cabecalho inserido e grava dados para futura ordenacao
                    $thead.find('th:last-child').data('name', value['field']);
                }
            });

            // variavel de controle que sera passada a todo o script
            this._defaults.strip = $strip;
            this._defaults.table = $table;
            this._defaults.thead = $thead;
            this._defaults.tbody = $tbody;
            this._defaults.init = $init;
            this._defaults.end = $end;
            this._defaults.paginaAtual = $paginaAtual;
            this._defaults.opts = opts;
            this._defaults.opts_old = $.extend(true, {}, opts);

            // evento de ordenacao do campo
            this._defaults.thead.find(".jgrid-ordered").on('click', function() {
                var icon = $(this).find('.fa-order i');
                var key = $(this).data('name');
                var dir = "ASC";
                if( icon.hasClass('fa fa-caret-down') ) {
                    icon.removeClass('fa fa-caret-down').addClass('fa fa-caret-up');
                    dir = "DESC";
                } else {
                    icon.removeClass('fa fa-caret-up').addClass('fa fa-caret-down');
                }

                if(opts.data.sort) {
                    // para cada elemento que pode ser ordenado
                    $.each(plgn._defaults.opts_old.data.sort, function(k, v) {
                        // se o elemento for o clicado
                        var propriedade = v.field ? v.field.toLowerCase() : v.property.toLowerCase();
                        if( propriedade == key.toLowerCase() ) {
                            // altera o valor da ordem ASC/DESC
                            v.direction = dir;
                            // e necessario reconstruir o array de objetos que eh passado via ajax com o novo valor
                            if( !plgn._defaults.opts.aggregateOrder ) {
                                plgn._defaults.opts.data.sort = [
                                    {
                                         "property" : v.property
                                        ,"direction" : v.direction
                                    }
                                ];
                            } else {
                                plgn._defaults.opts = plgn._defaults.opts_old;
                            }
                        }
                    });
                }
                // recarrega todos os items
                plgn.loadItems();
            });

            // se existir campos para filtrar
            var hasFilter = false;
            // verifica se em algum cabecalho foi dado a operacao para filtrar
            _.each( this.options.headers, function(obj ) {
                if( $.inArray( 'filter', _.keys( obj ) ) >= 0 ) {
                    hasFilter = true;
                }
            });
            // verifica se o dev habilitou a opcao de query e cabecalhos possuem o attr filter
            if( (this._defaults.opts.query && hasFilter) || plgn._defaults.opts.buttons.length > 0 ) {
                this.createOptions(hasFilter);
            }

            // EVENTO NORMAL DE LOAD
            if( $.isArray( opts.items ) && opts.items.length > 0 ) {
                this.createItems( { items : opts.items } );
            } else if( $.trim( opts.url.length ) > 0 ) {
                // carrega todos os items
                if(opts.autoLoad)
                    this.loadItems();
            } else {
                //throw "Erro ao executar grid, passe um array de items ou uma url para carregar os items!";
            }
        }
        // carrega todos os items
        ,loadItems : function() {
            var plgn = this;
            plgn.maskShow();
            // carrega os valores dos items via ajax
            $.ajax({
                data : this._defaults.opts.data,
                dataType : "json",
                type : "POST",
                url : this._defaults.opts.url
            }).done(function( data ) {
                // se o retorno for um objeto valido e nao vazio
                if( typeof( data ) == 'object' && data ) {
                    plgn._defaults.tbody.empty();
                    var total = data.TOTAL;
                    // cria os items
                    plgn.createItems( { items : data.DADOS } );

                    // Evento de finish load: Executa assim que a grid termina de carrega os items
                    $(plgn).on("loaded", function(evt, params) {
                        evt.stopPropagation();
                        evt.preventDefault();
                        plgn._defaults.opts.loaded();
                    }).trigger("loaded");

                    if( plgn._defaults.opts.pagination ) {
                        // acrescenta paginacao
                        plgn.setMensagem(data.TOTAL + ' registro(s) encontrado(s)');
                        plgn.createPagination( { total : data.TOTAL } );
                    }
                } else {
                    plgn.setMensagem('Nenhum registro encontrado');
                }
                plgn.maskHide();
            });
        }
        // adiciona cada um dos items retornados ao tbody
        ,createItems : function( obj ) {
            var plgn = this;
            var i = 1;
            var numbered = plgn._defaults.opts.data.start + 1;
            var checked = plgn._defaults.checked;
            // para cada item retornado
            $.each(obj.items, function( name, value ) {
                var id = plgn._defaults.opts.id + '-' + i;
                // adiciona um novo tr
                plgn._defaults.tbody.append( "<tr></tr>" );
                // retorna o ultimo tr criado
                var $tr = plgn._defaults.tbody.find( ":last" );
                // cria um checkbox para o item
                if( plgn._defaults.opts.check ) {
                    $tr.append( '<td class="jgrid-checkbox" style="width: 5px; padding: 4px;"><input type="checkbox" name="jgrid-checkbox" id="'+id+'" /></td>' );
                    // grava dados ao ultimo checkbox criado
                    var checkbox = $tr.find(':checkbox[name="jgrid-checkbox"]:last-child');
                    // put the id of field in checkbox for reference use later
                    // checkbox.data('id', parseInt(value[plgn._defaults.opts.id_key], 10));
                    checkbox.data('rowData', value);
                    // if the id of checkbox in the array of selected checkbox, check the line
                    if($.inArray(parseInt(value[plgn._defaults.opts.id_key], 10), checked) >= 0) {
                        checkbox.attr("checked", true);
                    }
                }
                // Grava todos os dados no tr, independente se possui checkbox ou nao
                $tr.data('rowData', value);

                // se for numerado, coloca um numero sequencial ae!
                if( plgn._defaults.opts.numbered ) {
                    $tr.append( '<td>' + numbered + '</td>' );
                }
                // para cada cabecalho
                $.each(plgn.options.headers, function(k, v) {
                    // Para o caso do campo ser um objeto dentro de outro
                    var field = v.field;
                    var fieldToTest = v.field;
                    if(fieldToTest) {
                        fieldToTest = fieldToTest.split('.');
                        if(fieldToTest.length > 1) {
                            field = fieldToTest[0];
                        } else {
                            field = fieldToTest;
                        }
                    }
                    field = field + '';

                    // se o campo existir nos cabecalhos
                    if( $.inArray( field, _.keys(value) ) >= 0 ) {
                        // limpa o valor do item
                        var valor = $.trim(plgn.getFieldValue(value, fieldToTest));
                        // se o dev criou um callback renderer para aquele campo
                        if( $.inArray( v.field, _.keys(plgn.options.renderer) ) >= 0 ) {
                            // pega o renderer daquele cabecalho
                            var fn = plgn.options.renderer[v.field];
                            // executa o callback passando o valor
                            valor = fn(valor);
                        }

                        if(!v.hidden) {
                            if(v.link)
                                valor = '<a href="#" class="jgrid-link-edit" style="font-weight: bold;">' + valor + '</a>';
                            // adiciona o td para o campo!

                            var header = '';
                            var $headers = plgn.options.headers;
                            $.each($headers, function(name, value) {
                                if('field' in value) {
                                    if(value['field'].indexOf(field) >= 0) {
                                        header = value['name'];
                                    }
                                }
                            });
                            $tr.append( '<td data-label="' + header + ':">' + valor + '&nbsp;</td>' );
                        }
                    } else {
                        if(v.buttons) {
                            var buttons = '';
                            $.each(v.buttons, function(btnName, btnValue) {
                                var texto = (btnValue.texto.length) > 0 ? btnValue.texto : (btnValue["icon"]) ? '<i class="' + btnValue["icon"]["class"] + '"></i>' : '<i class="fa fa-list-ul"></i>';
                                buttons += '<button class="btn btn-mini jGridActionButtons" name="' + btnValue.name + '">' + texto + '</button>';
                            });
                            $tr.append( '<td><div class="btn-group">' + buttons + '</div></td>' );
                        }
                    }
                });
                i++;
                numbered++;
            });

            $(".jgrid-link-edit").on("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                var ids = plgn.getRowId(this);
                var data = plgn.getRowData(this);
                plgn._defaults.opts.element_click(e, ids, data);
            });

            // se cada linha tiver checkbox
            if( plgn._defaults.opts.check ) {
                // evento ao clicar sobre cada linha, seleciona o check box da linha
                this._defaults.tbody.find('tr').on("click", function(e) {
                    //e.stopPropagation();
                    if( e.target.type !== "checkbox" ) {
                        var check = $(this).find(':checkbox[name="jgrid-checkbox"]');
                        check.prop('checked', !check.is(":checked"));
                    }
                });
            }

            $.each(plgn.options.headers, function(k, v) {
                if(v.buttons) {
                    $.each(v.buttons, function(btnName, btnValue) {
                        var btn = plgn._defaults.tbody.find('td :button[name=' + btnValue.name + ']');
                        btn.off().on("click", function(evt) {
                            evt.preventDefault();
                            evt.stopPropagation();
                            var dados = $(this).closest('tr').data('rowData');
                            btnValue.listener(evt, dados);
                        });
                    });
                }
            });
        }
        // cria um campo de busca geral e seu evento
        ,createOptions : function(hasFilter) {
            var plgn = this;

            var selectFilter = '';
            if( plgn._defaults.opts.query && hasFilter ) {
                // Tamanho normal do search field
                var classTamanhoOminibox = '';
                // Tamanho normal do combobox
                var classTamanhoInput = 'input-small';
                // caso a grid seja maior que 500px então faz o combobox e search field ser maior
                if(plgn._defaults.grid.width() > 500) {
                    classTamanhoInput = 'input-medium';
                    classTamanhoOminibox = 'input-large';
                }

                selectFilter += '<input type="text" class="inputTextOminibox ominibox ' + classTamanhoOminibox + '">&nbsp;&nbsp;';
                if(plgn.options.filter.length > 0) {
                    selectFilter += '<select class="jgrid-select ' + classTamanhoInput + '"></select>&nbsp;&nbsp;';
                }
                selectFilter += '<button class="btnOminibox sharperBtn font4 marinho rounded" type="button" style="font-size:13px !important; margin-bottom: 10px;"><i class="fa fa-search"></i></button>';
            }

            // cria um campo de form para as pesquisas, usando twitter bootstrap!
            plgn._defaults.grid.find(".jgrid-query-parent").remove();
            $top_bar = '<div class="jgrid-query-parent"><div class="jgrid-query">' +
                '<fieldset class="row-fluid">' +
                    '<div class="span5">'+
                        '<div class="control-group">' +
                            '<div class="controls clearfix">' +
                                selectFilter +
                            '</div>' +
                        '</div>'+
                    '</div>'+
                    '<div class="span7 clearfix"><div class="pull-right">';
            $.each(plgn._defaults.opts.buttons, function(i, button) {
                $top_bar += '<button id="' + button.id + '" class="' + button.class + '"><i class="' + button.icon + '"></i>&nbsp;' + button.text + '</button>&nbsp;'
            });
            $top_bar += '</div></div></fieldset></div></div>';
            $($top_bar).insertBefore(plgn._defaults.grid);

            // Recupera o container dos filtros e buttons de acao
            var container = plgn._defaults.root.find(".jgrid-query");

            // Para cada button de acao coloque o listener!
            $.each(plgn._defaults.opts.buttons, function(i, button) {
                container.find(('#' + button.id)).off().on("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var ids = plgn.getSelected();
                    var data = plgn.getSelectedRowData();
                    button.listener(e, ids, data);
                });
            });

            if(plgn.options.filter.length > 0) {
                container.find(".jgrid-select").append('<option value="">---</option>');
                // para cada cabecalho
                $.each(plgn.options.filter, function(k, v) {
                    if(v.values.length > 0) {
                        container.find(".jgrid-select").append('<optgroup label=" -' + v.name + '">');
                        $.each(v.values, function(i, j) {
                            container.find(".jgrid-select").append('<option value="' + v.field + '|' + j.value + '">' + j.name + '</option>');
                        });
                        container.find(".jgrid-select").append('</optgroup>');
                    }
                });
            }

            var filtrar = function(plgn, container) {
                var filtros = false;

                // pega o valor do select
                var campo = container.find(".jgrid-select").val();
                if(campo) {
                    filtros = true;
                    plgn._defaults.opts.data.filter = '["' + campo + '"]';
                } else {
                    delete plgn._defaults.opts.data.filter;
                }

                // pega o valor do textfield
                var busca = container.find(".inputTextOminibox").val();
                // se o textfield nao for vazio
                if( $.trim( busca ).length > 0 ) {
                    filtros = true;
                    // cria os attr de query
                    plgn._defaults.opts.data.query = busca;
                } else {
                    // apaga os attr de query
                    delete plgn._defaults.opts.data.query;

                }

                if(filtros) {
                    // Reinicia os valores de buscas!
                    plgn._defaults.opts.data.start = 0;
                    plgn._defaults.init = 1;
                    plgn._defaults.end = plgn._defaults.init + (plgn._defaults.opts.qtdePagination-1);
                    plgn._defaults.paginaAtual = 1;
                } else {
                    // Corrige o valor do fim
                    plgn._defaults.paginaAtual = 1;
                    plgn._defaults.end = plgn._defaults.init + (plgn._defaults.opts.qtdePagination-1);
                }
                // recarega os items!
                plgn.loadItems();
            };

            // ao clicar enter
            container.find(".inputTextOminibox").off().on("keydown", function(evt) {
                if(evt.which == 13) {
                    filtrar(plgn, container);
                }
            });

            // ao clicar no botao de buscar
            container.find(".btnOminibox").off().on("click", function() {
                filtrar(plgn, container);
            });
        }
        // cria a paginacao
        ,createPagination : function( obj ) {
            var plgn = this;
            // cria as divs onde ficara os elementos da paginacao
            //plgn._defaults.grid.find(".jgrid-pagination-parent").remove();
            //plgn._defaults.grid.append('<div class="jgrid-pagination-parent"><ul class="jgrid-pagination"></ul></div>');
            plgn._defaults.grid.find('.jgrid-pagination').empty();
            var container = plgn._defaults.grid.find(".jgrid-pagination");
            var page = plgn._defaults.opts.qtdePagination;
            // valor total de items
            var total = obj.total;
            // quantidade de paginas!
            var qtdePag = Math.ceil( total / plgn._defaults.opts.qtdePagina );
            var qtd = plgn._defaults.end, prev = false;
            // se o valor final de paginas for > q a quantidade total (isso acontece pq end sempre soma-se + page)
            if( (plgn._defaults.end) > qtdePag ) {
                qtd = qtdePag;
            }

            // se a quantidade inicial for > 10 acrescenta um botao de voltar
            if( plgn._defaults.init > page ) {
                container.append('<li class="jgrid-number-pagination jgrid-num-pag-prev"><span><i class="fa fa-chevron-left"></i></span></li>');
            }
            // for para criar cada botao de pagina no range. range inicial 0-10, depois 11-20 e etc...
            for( var j = plgn._defaults.init ; j <= qtd ; j++ ) {
                var selected = '';
                // selecionado?? muda a css class
                if( j == plgn._defaults.paginaAtual ) {
                    selected = 'active';
                }
                // adiciona +1 botao com valor da pagina
                container.append('<li class="jgrid-number-pagination ' + selected + ' jgrid-num-pag"><span>'+j+'</span></li>');
            }
            // se a quantidade de pagina > fim, por exemplo qtdePag = 30 e end = page
            if( qtdePag > plgn._defaults.end ) {
                // entao adiciona um botao proximo
                container.append('<li class="jgrid-number-pagination jgrid-num-pag-next"><span><i class="fa fa-chevron-right"></i></span></li>');
            }

            // evento do botao de pagina
            plgn._defaults.grid.find(".jgrid-pagination").find(".jgrid-num-pag").on("click", function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                // pega o html value do botao, vai de 1 ate qtdePage
                plgn._defaults.paginaAtual = parseInt($(this).find('span').html());
                // onde deve comnome_fantasianome_fantasianome_fantasiaecar o limit do sql
                plgn._defaults.opts.data.start = ( plgn._defaults.paginaAtual * plgn._defaults.opts.qtdePagina ) - plgn._defaults.opts.qtdePagina;
                // carrega tudo
                plgn.loadItems();
            });

            // evento do botao de anterior
            plgn._defaults.grid.find(".jgrid-pagination").find(".jgrid-num-pag-prev").on("click", function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                // pega o html value do botao - 1, vai de 1 ate qtdePage
                plgn._defaults.paginaAtual = parseInt($(this).next().find('span').html()) - 1;
                // onde deve comecar o limit do sql
                plgn._defaults.opts.data.start = ( plgn._defaults.paginaAtual * plgn._defaults.opts.qtdePagina ) - plgn._defaults.opts.qtdePagina;
                // muda os valores de init e end
                plgn._defaults.init -= page;
                plgn._defaults.end = ( plgn._defaults.end == qtdePag ) ? ( plgn._defaults.end + ( page - ( qtdePag % page ) ) ) - page : plgn._defaults.end - page;
                // carrega tudo
                plgn.loadItems();
            });

            // evento do botao de proximo
            plgn._defaults.grid.find(".jgrid-pagination").find(".jgrid-num-pag-next").on("click", function(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                // pega o html value do botao + 1, vai de 1 ate qtdePage
                plgn._defaults.paginaAtual = parseInt($(this).prev().find('span').html()) + 1;
                // onde deve comecar o limit do sql
                plgn._defaults.opts.data.start = ( plgn._defaults.paginaAtual * plgn._defaults.opts.qtdePagina ) - plgn._defaults.opts.qtdePagina;
                // muda os valores de init e end
                plgn._defaults.init += page;
                plgn._defaults.end = ( (plgn._defaults.end + page) > qtdePag ) ? qtdePag : plgn._defaults.end + page;
                // carrega tudo
                plgn.loadItems();
            });
        }
        ,addItem: function(obj) {
            this.createItems({'items': [obj]});
        }
        ,addItems: function(obj) {
            this.createItems({'items': obj});
        }
        ,removeItem: function(id) {
            var plgn = this;
            var checks = plgn._defaults.tbody.find( "tr" );
            $.each(checks, function(k, v) {
                var data = $(v).data('rowData');
                if(typeof(data) == 'object') {
                    if(id == data[plgn.options.id_key]) {
                        $(v).remove();
                    }
                }
            });
        }
        ,getAll: function(id) {
            var all = [];
            var plgn = this;
            var trs = plgn._defaults.tbody.find( "tr" );
            $.each(trs, function(k, v) {
                var data = $(v).data('rowData');
                if(typeof(data) == 'object') {
                    all.push(data);
                }
            });
            return all;
        }
        ,getConfig: function() {
            var plgn = this;
            return plgn._defaults.opts.data;
        }
        ,removeItems: function() {

        }
        ,getFieldValue: function(field, fields) {
            var obj = null;
            var arr = null;
            for(var i=0; i<fields.length; i++) {
                if(!obj) {
                    obj = field[fields[i]];
                } else {
                    if($.isArray(obj)) {
                        var arr_join = [];
                        for(var z=0; z<obj.length; z++) {
                            arr_join.push(obj[z][fields[i]]);
                        }
                        obj = arr_join.join(', ');
                    } else {
                        obj = obj[fields[i]];
                    }
                }
            }
            return obj;
        }
        ,maskShow: function() {
            var plgn = this;
            this._defaults.root.find('.style-loading').fadeIn('fast');
        }
        ,maskHide: function() {
            var plgn = this;
            this._defaults.root.find('.style-loading').fadeOut('slow');
        }
        // recarrega os items
        ,reload : function(data) {
            if(typeof(data) == 'object' && data) {
                this._defaults.init = 1;
                this._defaults.end = this._defaults.init + (this._defaults.opts.qtdePagination-1);
                this._defaults.opts.data.start = 0;
                this._defaults.paginaAtual = 1;
            }

            this._defaults.opts.data = $.extend( {}, this._defaults.opts.data, data);
            this.loadItems();
        }
        // retorna os ids dos items selecionados
        ,getSelected : function() {
            var plgn = this;
            var ids = [];
            // recupera cada checkbox q estiver selecionado
            //var checks = $(this._defaults.grid).find('tr');
            var checks = $(this._defaults.grid).find('td > :checkbox[name="jgrid-checkbox"]:checked');
            // para cada checkbox
            $.each(checks, function(k, v) {
                var data = $(v).data('rowData');
                if(typeof(data) == 'object') {
                    // adiciona o id no array, nao converte para numerico para casos onde a chave eh uma string
                    // ids.push(parseInt(data[plgn.options.id_key], 10));
                    ids.push(data[plgn.options.id_key]);
                }
            });
            return _.sortBy(ids, function(num) { return num; });
        }
        ,getSelectedRowData : function() {
            var plgn = this;
            var dados = [];
            // recupera cada checkbox q estiver selecionado
            var checks = $(this._defaults.grid).find('td > :checkbox[name="jgrid-checkbox"]:checked');
            // para cada checkbox
            $.each(checks, function(k, v) {
                var data = $(v).data('rowData');
                if(typeof(data) == 'object') {
                    // adiciona o id no array
                    dados.push(data);
                }
            });
            return dados;
        }
        ,getRowId : function(el) {
            var plgn = this;
            var ids = [];
            if(el) {
                // recupera cada checkbox q estiver selecionado
                var checks = $(el).closest( "tr" );
            } else {
                var checks = plgn._defaults.tbody.find( "tr" );
            }
            // para cada checkbox
            $.each(checks, function(k, v) {
                var data = $(v).data('rowData');
                if(typeof(data) == 'object') {
                    // adiciona o id no array
                    ids.push(data[plgn.options.id_key]);
                }
            });
            return ids;
        }
        ,getRowData : function(el) {
            var plgn = this;
            var dados = [];
            if(el) {
                // recupera cada checkbox q estiver selecionado
                var checks = $(el).closest( "tr" );
            } else {
                var checks = plgn._defaults.tbody.find( "tr" );
            }
            // para cada checkbox
            $.each(checks, function(k, v) {
                var data = $(v).data('rowData');
                if(typeof(data) == 'object') {
                    // adiciona o id no array
                    dados.push(data);
                }
            });
            return dados;
        }
        ,setSelected : function(ids) {
            var plgn = this;
            plgn._defaults.checked = ids;
            var id = null;
            var checks = $(this._defaults.grid).find('td > :checkbox[name="jgrid-checkbox"]');
            $(checks).attr("checked", false);
            $.each(checks, function(k, v) {
                id = parseInt($(v).data('id'), 10);
                if($.inArray(id, plgn._defaults.checked) >= 0) {
                    $(this).attr("checked", true);
                }
            });
        }
        ,setMensagem : function(msg, small) {
            var plgn = this;
            if(msg.length > 50 && small) { msg = msg.substr(0, 50) + '...'; }
            var divGrid = plgn._defaults.grid.find('.msgResposta');
            divGrid.html(msg);
            plgn._defaults.grid.find('#jgrid').css('margin-bottom', divGrid.outerHeight() + 15);
        }
        // remove toda a grid! :(
        ,destroy: function() {
            $(this._defaults.root).remove();
            $(this._defaults.root).empty();
        }
    };

    $.fn[pluginName] = function ( options ) {
        var args = arguments;
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            var rtn = null;
            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    rtn = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }
            });
            return rtn;
        }
    }

})( jQuery, window, document );
