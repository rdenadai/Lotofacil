from django.conf.urls import include, url
from django.views.static import serve as django_serve
from django.conf import settings
from django.conf.urls.static import static
import sistema.views

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = [
    # Examples:
    # urlurl(r'^$', 'lotofacil.views.home', name='home),
    # urlurl(r'^lotofacil/', include('lotofacil.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # urlurl(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^adm/', include(admin.site.urls)),
    # Grapelli
    url(r'^grappelli/', include('grappelli.urls')),
    url('^$', sistema.views.index),
    url(r'^limpar/', sistema.views.limpar),
    url(r'^importar/', sistema.views.importar),
    url(r'^importarsimples/', sistema.views.importar_combinacoes_simples),
    url(r'^importarcomplexas/', sistema.views.importar_combinacoes_complexas),
    url(r'^importartudo/', sistema.views.importar_tudo),
    url(r'^valores/', sistema.views.valores),
    url(r'^porcentagem/', sistema.views.porcentagem),
    url(r'^generate/', sistema.views.generate),
    url(r'^generaterated/', sistema.views.generaterated),
    url(r'^existe/', sistema.views.existe),
    url(r'^frequencianumericaperiodo/', sistema.views.frequenciaNumericaPeriodo),
    url(r'^frequencianumerica/', sistema.views.frequenciaNumerica),
    url(r'^combinacoespares/', sistema.views.combinacoesPares),
    url(r'^combinacoestriplos/', sistema.views.combinacoesTriplos),
    url(r'^combinacoesquadruplos/', sistema.views.combinacoesQuadruplos),
    url(r'^combinacoesquintuplos/', sistema.views.combinacoesQuintuplos),
    url(r'^combinacoeshex/', sistema.views.combinacoesHex),
    url(r'^combinacoeshep/', sistema.views.combinacoesHep),
    url(r'^static/(?P<path>.*)$', django_serve, {
        'document_root': settings.STATIC_ROOT,
        'show_indexes': settings.DEBUG
    }),
] + \
    static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + \
    static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
