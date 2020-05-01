from django.contrib import admin
from models import *


class LoteriaAdmin(admin.ModelAdmin):
    list_display = ('concurso', 'data')


class CombinacaoAdmin(admin.ModelAdmin):
    list_display = ('numeros', 'quantidade', 'porcentagem', 'tipo')


admin.site.register(Loteria, LoteriaAdmin)
admin.site.register(Combinacao, CombinacaoAdmin)
