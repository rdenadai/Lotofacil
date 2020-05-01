# Create your models here.
from django.db import models


class Loteria(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    concurso = models.IntegerField("concurso")
    data = models.DateField("data")
    bola1 = models.IntegerField("bola1")
    bola2 = models.IntegerField("bola2")
    bola3 = models.IntegerField("bola3")
    bola4 = models.IntegerField("bola4")
    bola5 = models.IntegerField("bola5")
    bola6 = models.IntegerField("bola6")
    bola7 = models.IntegerField("bola7")
    bola8 = models.IntegerField("bola8")
    bola9 = models.IntegerField("bola9")
    bola10 = models.IntegerField("bola10")
    bola11 = models.IntegerField("bola11")
    bola12 = models.IntegerField("bola12")
    bola13 = models.IntegerField("bola13")
    bola14 = models.IntegerField("bola14")
    bola15 = models.IntegerField("bola15")

    def __unicode__(self):
        return '%s' % str(self.concurso)

    class Meta:
        db_table = "loteria"
        ordering = ['-data']


class Combinacao(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    numeros = models.CharField(max_length=255)
    quantidade = models.IntegerField(default=0)
    porcentagem = models.IntegerField(default=0)
    tipo = models.IntegerField(default=2)

    class Meta:
        db_table = "combinacao"
        ordering = ['-quantidade']

    def __unicode__(self):
        return '%s' % str(self.numeros)


'''
class TeoriaJogos(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    jogo = models.CharField("jogo", max_length=255)
    data = models.DateField("data", auto_now_add=True)

    def __unicode__(self):
        return self.id

    class Meta:
        db_table = "jogo"
'''
