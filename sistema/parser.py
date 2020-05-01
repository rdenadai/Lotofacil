#!/usr/bin/env python
# -*- conding: iso-8859-1 -*-
from HTMLParser import HTMLParser
from sistema.models import Loteria
from django.core.exceptions import ObjectDoesNotExist
import time


class LotoParser(HTMLParser):
    title = ""
    is_title = ""
    qtde = 1
    concurso = 0
    dt = None
    numeros = []

    def __init__(self, data):
        print "parser init"
        HTMLParser.__init__(self)
        print "data feed"
        self.feed(data)

    def handle_starttag(self, tag, attrs):
        if tag == 'td':
            self.is_title = 2
        if tag == 'tr':
            self.qtde = 1

    def handle_data(self, data):
        if self.is_title == 2:
            self.is_title = 0
            if self.qtde == 1:
                #  print data,' => '
                self.concurso = data.strip()
            try:
                print(self.concurso)
                int(self.concurso) + 1
                if self.qtde == 2:
                    self.dt = time.strftime('%Y-%m-%d', time.strptime(data, '%d/%m/%Y'))
                if self.qtde >= 3 and self.qtde <= 17:
                    self.numeros.append(data)
                self.qtde += 1

                print(self.dt)
                print '-' * 15
                if self.qtde == 18:
                    self.numeros.sort()
                    #  print self.numeros
                    lot = None
                    insert = True
                    try:
                        Loteria.objects.get(data=self.dt)
                        insert = False
                    except ObjectDoesNotExist:
                        pass

                    if insert:
                        lot = Loteria(
                            concurso=self.concurso,
                            data=self.dt,
                            bola1=self.numeros[0],
                            bola2=self.numeros[1],
                            bola3=self.numeros[2],
                            bola4=self.numeros[3],
                            bola5=self.numeros[4],
                            bola6=self.numeros[5],
                            bola7=self.numeros[6],
                            bola8=self.numeros[7],
                            bola9=self.numeros[8],
                            bola10=self.numeros[9],
                            bola11=self.numeros[10],
                            bola12=self.numeros[11],
                            bola13=self.numeros[12],
                            bola14=self.numeros[13],
                            bola15=self.numeros[14])
                        lot.save()
                    self.numeros = []
            except Exception, e:
                #  silence
                print(e)

'''if __name__ == "__main__":
    try:
      import os
      with open(os.path.join(settings.PROJECT_PATH, '../sistema/resultados.html'), 'r') as f:
      LotoParser(f.read())
    except Exception as e:
        print str(e)
'''
