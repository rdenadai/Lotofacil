# -*- coding: utf-8 -*-

from django.contrib.auth.decorators import login_required, permission_required
from django.http import HttpResponse
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.db import connection, transaction
from django.db.models import Q
from django.core import serializers
import json
import random
from operator import itemgetter

from sistema.importar import Importar
from sistema.QuerySetUtility import QuerySetUtility
from sistema.models import Loteria, Combinacao
from sistema.JsonPropertySerializer import JsonPropertySerializer
from django.core.cache import cache


# pairs = sorted(set([tuple(sorted([atual, proximo])) for atual in x for proximo in y if atual != proximo]))
# triple = sorted(set([tuple(sorted([atual, proximo, mais])) for atual in x for proximo in y for mais in z if atual != proximo and atual != mais and proximo != mais]))
# contagem = []
# for pair in pairs:
#   contagem.append({ "numero": pair, "qtd": 0 })


def index(request):
    ip = request.META.get('REMOTE_ADDR', '000.000.000.000')
    total = Loteria.objects.count()
    inicial = total - 25
    fator_probabilidade = 0
    for num in range(1, 26):
        fator_probabilidade += float((float(1) / float(25)) * float(num))
    return render_to_response('principal/index.html', context_instance=RequestContext(request, {'ip': ip, 'inicial': str(inicial), 'total': str(total), 'numeros': range(1, 26), 'fator': fator_probabilidade}))


@login_required
@permission_required('is_superuser')
def limpar(request):
    cache.clear()
    try:
        with transaction.atomic():
            cursor = connection.cursor()
            # Data modifying operation
            cursor.execute('TRUNCATE TABLE "loteria"')
            cursor.execute('TRUNCATE TABLE "combinacao"')
    except Exception, e:
        return HttpResponse("Erro ao limpar dados!" + str(e))
    else:
        return HttpResponse("Limpeza realizada com sucesso!")


@login_required
@permission_required('is_superuser')
def importar(request):
    cache.clear()
    try:
        with transaction.atomic():
            imp = Importar()
            imp.carregar_sorteios()
    except Exception, e:
        return HttpResponse("Erro ao importar dados!" + str(e))
    else:
        return HttpResponse("Importa&ccedil;&atilde;o realizada com sucesso!")


@login_required
@permission_required('is_superuser')
def importar_tudo(request):
    cache.clear()
    try:
        with transaction.atomic():
            imp = Importar()
            imp.carregar_sorteios()
            # After this, lets make combination analysis
            imp.combinacoes_pares()
            imp.combinacoes_triplos()
            imp.combinacoes_quadruplos()
            imp.combinacoes_quintuplos()
            imp.combinacoes_hex()
            imp.combinacoes_hep()
    except Exception, e:
        return HttpResponse("Erro ao importar dados!" + str(e))
    else:
        return HttpResponse("Importa&ccedil;&atilde;o realizada com sucesso!")


@login_required
@permission_required('is_superuser')
def importar_combinacoes_simples(request):
    cache.clear()
    try:
        with transaction.atomic():
            # After this, lets make combination analysis
            imp = Importar()
            imp.combinacoes_pares()
            imp.combinacoes_triplos()
            imp.combinacoes_quadruplos()
            imp.combinacoes_quintuplos()
    except Exception, e:
        return HttpResponse("Erro ao calcular combina&ccedil;&otilde;es!" + str(e))
    else:
        return HttpResponse("Importa&ccedil;&atilde;o realizada com sucesso!")


@login_required
@permission_required('is_superuser')
def importar_combinacoes_complexas(request):
    cache.clear()
    try:
        with transaction.atomic():
            # After this, lets make combination analysis
            imp = Importar()
            imp.combinacoes_hex()
            imp.combinacoes_hep()
    except Exception, e:
        return HttpResponse("Erro ao calcular combina&ccedil;&otilde;es!" + str(e))
    else:
        return HttpResponse("Importa&ccedil;&atilde;o realizada com sucesso!")


def valores(request):
    sort = get_dict_array(request.POST, 'sort')
    start = int(request.POST.get('start', 0))
    limit = int(request.POST.get('limit', 20))

    qs = QuerySetUtility()
    ordem = qs.orderBy(sort)  # order by fields

    limit = start + limit

    loterias = Loteria.objects.all()
    total = Loteria.objects.all().count()
    loterias = loterias.order_by(*ordem)[start:limit]

    message = "{'total':0, resultados:[]}"
    resultados = ''
    i = 0
    for loteria in loterias:
        concurso = loteria.concurso
        data = loteria.data
        sorteio = (
            loteria.bola1,
            loteria.bola2,
            loteria.bola3,
            loteria.bola4,
            loteria.bola5,
            loteria.bola6,
            loteria.bola7,
            loteria.bola8,
            loteria.bola9,
            loteria.bola10,
            loteria.bola11,
            loteria.bola12,
            loteria.bola13,
            loteria.bola14,
            loteria.bola15,
        )
        numeros = str(sorteio)
        soma = round(float(sum(sorteio)) / 15.0, 2)
        if i > 0:
            resultados += ','
        resultados += '{"concurso": "%s", "data": "%s", "numeros": "%s", "soma": "%s"}' % (str(concurso), str(data.strftime("%d/%m/%Y")), numeros, str(soma))
        i += 1
    message = '{"DADOS": [', resultados, '], "TOTAL": "', total, '"}'
    return HttpResponse(message, content_type='text/javascript')


def porcentagem(request):
    ini = int(request.POST.get('ini', '1'))
    fim = int(request.POST.get('fim', Loteria.objects.all().count()))

    sort = get_dict_array(request.POST, 'sort')
    direction = sort[0].get('direction')
    if direction == 'DESC':
        direction = True
    else:
        direction = False

    rs = topRated(ini, fim)
    rs = sorted(rs, key=itemgetter(sort[0].get('property')), reverse=direction)
    message = '{"TOTAL": 15, "DADOS": ', json.dumps(rs), '}'
    return HttpResponse(message, content_type='text/javascript')


def frequenciaNumerica(request):
    total = Loteria.objects.all().count()
    fim = int(request.POST.get('fim', total))
    ini = fim - 15
    num = int(request.POST.get('numero', '1'))
    total = fim + 1

    result = {'labels': [], 'data': []}
    labels = []
    data = []
    i = 0
    qtde = 0
    with transaction.atomic():
        for n in xrange(ini, total):
            labels.append(n)
            tem = Loteria.objects.filter(concurso=n).filter(Q(bola1=num) | Q(bola2=num) | Q(bola3=num) | Q(bola4=num) | Q(bola5=num) | Q(bola6=num) | Q(bola7=num) | Q(bola8=num) | Q(bola9=num) | Q(bola10=num) | Q(bola11=num) | Q(bola12=num) | Q(bola13=num) | Q(bola14=num) | Q(bola15=num)).count()
            if tem >= 1:
                qtde = 1
            else:
                qtde = 0
            data.append(qtde)
            i += 1
    result['labels'] = labels
    result['data'] = data
    return HttpResponse(json.dumps(result), content_type='text/javascript')


def frequenciaNumericaPeriodo(request):
    total = Loteria.objects.all().count()
    fim = int(request.POST.get('fim', total))
    ini = fim - 15
    num = int(request.POST.get('numero', '1'))
    total = fim + 1

    result = {'labels': [], 'data': []}
    labels = []
    data = []
    i = 0
    qtde = 0
    with transaction.atomic():
        for n in range(ini, total):
            labels.append(n)
            tem = Loteria.objects.filter(concurso=n).filter(Q(bola1=num) | Q(bola2=num) | Q(bola3=num) | Q(bola4=num) | Q(bola5=num) | Q(bola6=num) | Q(bola7=num) | Q(bola8=num) | Q(bola9=num) | Q(bola10=num) | Q(bola11=num) | Q(bola12=num) | Q(bola13=num) | Q(bola14=num) | Q(bola15=num)).count()
            if tem >= 1:
                qtde += 1
            else:
                qtde -= 1
            data.append(qtde)
            i += 1
    result['labels'] = labels
    result['data'] = data
    return HttpResponse(json.dumps(result), content_type='text/javascript')


def combinacoesPares(request):
    start, limit = paging(request)
    contagem = Combinacao.objects.filter(tipo=2)
    proper = JsonPropertySerializer()
    message = '{"DADOS": ', proper.serialize(contagem[start:limit], indent=2, use_natural_keys=True), ', "TOTAL": "', contagem.count(), '"}'
    return HttpResponse(message, content_type='text/javascript')


def combinacoesTriplos(request):
    start, limit = paging(request)
    contagem = Combinacao.objects.filter(tipo=3)
    proper = JsonPropertySerializer()
    message = '{"DADOS": ', proper.serialize(contagem[start:limit], indent=2, use_natural_keys=True), ', "TOTAL": "', contagem.count(), '"}'
    return HttpResponse(message, content_type='text/javascript')


def combinacoesQuadruplos(request):
    start, limit = paging(request)
    contagem = Combinacao.objects.filter(tipo=4)
    proper = JsonPropertySerializer()
    message = '{"DADOS": ', proper.serialize(contagem[start:limit], indent=2, use_natural_keys=True), ', "TOTAL": "', contagem.count(), '"}'
    return HttpResponse(message, content_type='text/javascript')


def combinacoesQuintuplos(request):
    start, limit = paging(request)
    contagem = Combinacao.objects.filter(tipo=5)
    proper = JsonPropertySerializer()
    message = '{"DADOS": ', proper.serialize(contagem[start:limit], indent=2, use_natural_keys=True), ', "TOTAL": "', contagem.count(), '"}'
    return HttpResponse(message, content_type='text/javascript')


def combinacoesHex(request):
    start, limit = paging(request)
    contagem = Combinacao.objects.filter(tipo=6)
    proper = JsonPropertySerializer()
    message = '{"DADOS": ', proper.serialize(contagem[start:limit], indent=2, use_natural_keys=True), ', "TOTAL": "', contagem.count(), '"}'
    return HttpResponse(message, content_type='text/javascript')


def combinacoesHep(request):
    start, limit = paging(request)
    contagem = Combinacao.objects.filter(tipo=7)
    proper = JsonPropertySerializer()
    message = '{"DADOS": ', proper.serialize(contagem[start:limit], indent=2, use_natural_keys=True), ', "TOTAL": "', contagem.count(), '"}'
    return HttpResponse(message, content_type='text/javascript')


def paging(request):
    start = int(request.POST.get('start', 0))
    limit = int(request.POST.get('limit', 20))
    limit = start + limit
    return (start, limit)


def generate(request):
    ini = int(request.POST.get('ini', '1'))
    fim = int(request.POST.get('fim', Loteria.objects.all().count()))
    fim = True
    while fim:
        lista = gen(ini, fim)
        qtde = Loteria.objects.filter(
            bola1=int(lista[0]), bola2=int(lista[1]),
            bola3=int(lista[2]), bola4=int(lista[3]),
            bola5=int(lista[4]), bola6=int(lista[5]),
            bola7=int(lista[6]), bola8=int(lista[7]),
            bola9=int(lista[8]), bola10=int(lista[9]),
            bola11=int(lista[10]), bola12=int(lista[11]),
            bola13=int(lista[12]), bola14=int(lista[13]),
            bola15=int(lista[14]),
        ).count()
        if qtde <= 0:
            fim = False

    valores = ''
    for l in lista:
        valores += '<td>' + str(l) + '</td>'
    retorno = '''<div class='no_comments'><table align='center' style='width:100%'><tr>''', valores, '''</tr></table></div>'''
    return HttpResponse(retorno, content_type='text/javascript')


def gen(ini, fim):
    lista = []
    i = 0
    while i < 15:
        num = str(random.randint(1, 25))
        if len(num) == 1:
            num = '0%s' % num
        if lista.count(num) <= 0:
            lista.append(num)
            i += 1
    lista.sort()
    return lista


def generaterated(request):
    ini = int(request.POST.get('ini', '1'))
    fim = int(request.POST.get('fim', Loteria.objects.all().count()))
    final = ''
    lista = genRated(ini, fim)
    qtde = Loteria.objects.filter(
        bola1=int(lista[0]['numero']), bola2=int(lista[1]['numero']),
        bola3=int(lista[2]['numero']), bola4=int(lista[3]['numero']),
        bola5=int(lista[4]['numero']), bola6=int(lista[5]['numero']),
        bola7=int(lista[6]['numero']), bola8=int(lista[7]['numero']),
        bola9=int(lista[8]['numero']), bola10=int(lista[9]['numero']),
        bola11=int(lista[10]['numero']), bola12=int(lista[11]['numero']),
        bola13=int(lista[12]['numero']), bola14=int(lista[13]['numero']),
        bola15=int(lista[14]['numero'])
    ).count()
    if qtde > 0:
        final = 'Entretanto essa sequ&ecirc;ncia ja saiu em algum resultado!'

    valores = ''
    for l in lista:
        numero = str(l['numero'])
        if len(numero) == 1:
            numero = '0%s' % numero
        valores += '<td>%s</td>' % numero
    retorno = '''<div class='no_comments'><table align='center' style='width:100%'><tr><td colspan='15'>''', final, '''</td></tr><tr>''', valores, '''</tr></table></div>'''
    return HttpResponse(retorno, content_type='text/javascript')


def genRated(ini, fim):
    lista = topRatedNumbers(ini, fim)
    lista.sort()
    return lista


def topRatedNumbers(ini, fim):
    rs = sorted(topRated(ini, fim), key=itemgetter('porcentagem'), reverse=True)
    numbers = []
    for i in range(0, 15):
        numbers.append(rs[i])
    return numbers


def topRated(ini, fim):
    total = str(Loteria.objects.filter(concurso__range=(ini, fim)).count())
    rs = []
    for num in range(1, 26):
        numero = str(Loteria.objects.filter(concurso__range=(ini, fim)).filter(Q(bola1=num) | Q(bola2=num) | Q(bola3=num) | Q(bola4=num) | Q(bola5=num) | Q(bola6=num) | Q(bola7=num) | Q(bola8=num) | Q(bola9=num) | Q(bola10=num) | Q(bola11=num) | Q(bola12=num) | Q(bola13=num) | Q(bola14=num) | Q(bola15=num)).count())
        porcentagem = round(float((float(numero) / float(total)) * 100), 2)
        rs.append({'numero': num, 'saiu': int(numero), 'porcentagem': porcentagem})
    return rs


def existe(request):
    ini = int(request.POST.get('ini', '1'))
    fim = int(request.POST.get('fim', Loteria.objects.all().count()))
    numeros = request.POST.get('sequenciaNumerica', None)
    separator = request.POST.get('separator', ';')
    message = "Sequ&ecirc;ncia num&eacute;rica ainda <span style='color:red;'>n&atilde;o</span> saiu!"
    total = fim - ini
    qtde = 0
    if numeros:
        lista = numeros.split(separator)
        if len(lista) >= 2:
            seq_lista = []
            for l in lista:
                seq_lista.append(int(l))
            seq_lista.sort()
            lista = seq_lista

            loterias = Loteria.objects.all()
            # total = loterias.count()
            for num in lista:
                loterias = loterias.filter(concurso__range=(ini, fim)).filter(Q(bola1=num) | Q(bola2=num) | Q(bola3=num) | Q(bola4=num) | Q(bola5=num) | Q(bola6=num) | Q(bola7=num) | Q(bola8=num) | Q(bola9=num) | Q(bola10=num) | Q(bola11=num) | Q(bola12=num) | Q(bola13=num) | Q(bola14=num) | Q(bola15=num))
            qtde = loterias.count()
            if qtde > 0:
                resultado = ''
                for loteria in loterias:
                    resultado += ', ' + str(loteria.concurso)
                resultado = resultado[1:len(resultado)]
                message = "<span style='color:blue;'>Sequ&ecirc;ncia num&eacute;rica ja saiu no(s) concurso(s)</span>: ", resultado, "."
        else:
            message = "Insira uma sequ&ecirc;ncia num&eacute;rica v&aacute;lida!"
    porcentagem = round(float((float(qtde) / float(total)) * 100), 2)
    message = '''<div class='no_comments'><table align='center' style='width:100%'><tr><td><span style='color:black;'>Quantidade Total</span>: <span style='color:red;'>''', qtde, ''' de ''', total, ''' = ''', porcentagem, '''%</span></td></tr><tr><td>''', message, '''</td></tr></table></div>'''
    return HttpResponse(message, content_type='text/javascript')


def get_dict_array(post, name):
    dic = {}
    for k in post.keys():
        if k.startswith(name):
            rest = k[len(name):]

            # split the string into different components
            parts = [p[:-1] for p in rest.split('[')][1:]
            id = int(parts[0])

            # add a new dictionary if it doesn't exist yet
            if id not in dic:
                dic[id] = {}

            # add the information to the dictionary
            dic[id][parts[1]] = post.get(k)
    # return dic
    return [item for key, item in sorted(dic.items())]
