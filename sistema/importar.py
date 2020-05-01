# -*- coding: utf-8 -*-
#!/usr/bin/env python

import requests
import zipfile
import os
from sistema.parser import LotoParser
from django.conf import settings
from itertools import combinations
from operator import itemgetter
from sistema.models import Loteria, Combinacao


class Importar(object):

    def __init__(self):
        self.numerosLoteria = xrange(1, 26)

    def carregar_sorteios(self):
        # Conecta ao servidor da lotofacil
        r = requests.get("https://www1.caixa.gov.br/loterias/_arquivos/loterias/D_lotfac.zip", verify=False)
        if r.status_code == 200:
            # Remove o arquivo que já existia
            try:
                os.unlink(os.path.join(settings.PROJECT_PATH, '../sistema/lotofacil.zip'))
            except:
                pass

            # Grava o arquivo zip no diretorio
            with open(os.path.join(settings.PROJECT_PATH, '../sistema/lotofacil.zip'), 'wb') as f:
                f.write(r.content)

            # Abre o arquivo zip
            with zipfile.ZipFile(os.path.join(settings.PROJECT_PATH, '../sistema/lotofacil.zip'), 'r') as myzip:
                # Le todo o conteudo do arquivo .htm dentro do zip
                leitura = myzip.read('D_LOTFAC.HTM')
                # Grava novo arquivo .html com conteudo do .htm
                with open(os.path.join(settings.PROJECT_PATH, '../sistema/resultados.html'), 'wb') as resultado:
                    resultado.write(leitura)
            # Apaga o arquivo zip
            try:
                os.unlink(os.path.join(settings.PROJECT_PATH, '../sistema/lotofacil.zip'))
            except:
                pass

            # Abre o arquivo .html
            with open(os.path.join(settings.PROJECT_PATH, '../sistema/resultados.html'), 'r') as f:
                # Comeca a importacao dos resultados!
                LotoParser(f.read())

    def combinacoes_pares(self):
        print "Duplos"
        combinacoes = self._realiza_contagem(self._get_combinacoes_pares(), self._retorna_sorteios())[0:500]
        self._insere_combinacoes(combinacoes, 2)

    def combinacoes_triplos(self):
        print "Triplos"
        combinacoes = self._realiza_contagem(self._get_combinacoes_triplos(), self._retorna_sorteios())[0:500]
        self._insere_combinacoes(combinacoes, 3)

    def combinacoes_quadruplos(self):
        print "Quadruplos"
        combinacoes = self._realiza_contagem(self._get_combinacoes_quadruplos(), self._retorna_sorteios())[0:500]
        self._insere_combinacoes(combinacoes, 4)

    def combinacoes_quintuplos(self):
        print "Quintuplos"
        combinacoes = self._realiza_contagem(self._get_combinacoes_quintuplos(), self._retorna_sorteios())[0:500]
        self._insere_combinacoes(combinacoes, 5)

    def combinacoes_hex(self):
        print "Hex"
        combinacoes = self._realiza_contagem(self._get_combinacoes_hex(), self._retorna_sorteios())[0:500]
        self._insere_combinacoes(combinacoes, 6)

    def combinacoes_hep(self):
        print "Hep"
        combinacoes = self._realiza_contagem(self._get_combinacoes_hep(), self._retorna_sorteios())[0:500]
        self._insere_combinacoes(combinacoes, 7)

    def _insere_combinacoes(self, combinacoes, tipo):
        for cont in combinacoes:
            cont['tipo'] = tipo
            comb = Combinacao(**cont)
            comb.save()

    def _retorna_sorteios(self):
        total = Loteria.objects.count()
        inicial = total - 15
        limit = total
        start = inicial
        limit = start + limit

        loterias = Loteria.objects.filter()[start:limit].values(
            'bola1', 'bola2', 'bola3',
            'bola4', 'bola5', 'bola6',
            'bola7', 'bola8', 'bola9',
            'bola10', 'bola11', 'bola12',
            'bola13', 'bola14', 'bola15',
        )
        lot = []
        lot_append = lot.append
        for loteria in loterias:
            lot_append(dict(zip(loteria.values(), ([1] * 15))))
        return lot

    def _realiza_contagem(self, combinacoes, sorteios):
        contagem = []
        adicionar_contagem = contagem.append
        qtde_sorteios = len(sorteios)
        for combinacao in combinacoes:
            qtde = 0
            for numeros in sorteios:
                existe = True
                for comb in combinacao:
                    if comb not in numeros:
                        existe = False
                        break
                if existe:
                    qtde += 1
            porcentagem = str(int(float(qtde) / float(qtde_sorteios) * 100))
            adicionar_contagem({"numeros": str(combinacao), "quantidade": qtde, "porcentagem": porcentagem})
        return sorted(contagem, key=itemgetter("quantidade"), reverse=True)

    def _get_combinacoes_pares(self):
        return combinations(self.numerosLoteria, 2)

    def _get_combinacoes_triplos(self):
        return combinations(self.numerosLoteria, 3)

    def _get_combinacoes_quadruplos(self):
        return combinations(self.numerosLoteria, 4)

    def _get_combinacoes_quintuplos(self):
        return combinations(self.numerosLoteria, 5)

    def _get_combinacoes_hex(self):
        return combinations(self.numerosLoteria, 6)

    def _get_combinacoes_hep(self):
        return combinations(self.numerosLoteria, 7)

if __name__ == "__main__":
    try:
        Importar()
    except Exception as e:
        print str(e)

