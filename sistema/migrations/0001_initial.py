# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Combinacao',
            fields=[
                ('id', models.AutoField(primary_key=True, unique=True, serialize=False, help_text='')),
                ('numeros', models.CharField(max_length=255, help_text='')),
                ('quantidade', models.IntegerField(default=0, help_text='')),
                ('porcentagem', models.IntegerField(default=0, help_text='')),
                ('tipo', models.IntegerField(default=2, help_text='')),
            ],
            options={
                'db_table': 'combinacao',
                'ordering': ['-quantidade'],
            },
        ),
        migrations.CreateModel(
            name='Loteria',
            fields=[
                ('id', models.AutoField(primary_key=True, unique=True, serialize=False, help_text='')),
                ('concurso', models.IntegerField(verbose_name=b'concurso', help_text='')),
                ('data', models.DateField(verbose_name=b'data', help_text='')),
                ('bola1', models.IntegerField(verbose_name=b'bola1', help_text='')),
                ('bola2', models.IntegerField(verbose_name=b'bola2', help_text='')),
                ('bola3', models.IntegerField(verbose_name=b'bola3', help_text='')),
                ('bola4', models.IntegerField(verbose_name=b'bola4', help_text='')),
                ('bola5', models.IntegerField(verbose_name=b'bola5', help_text='')),
                ('bola6', models.IntegerField(verbose_name=b'bola6', help_text='')),
                ('bola7', models.IntegerField(verbose_name=b'bola7', help_text='')),
                ('bola8', models.IntegerField(verbose_name=b'bola8', help_text='')),
                ('bola9', models.IntegerField(verbose_name=b'bola9', help_text='')),
                ('bola10', models.IntegerField(verbose_name=b'bola10', help_text='')),
                ('bola11', models.IntegerField(verbose_name=b'bola11', help_text='')),
                ('bola12', models.IntegerField(verbose_name=b'bola12', help_text='')),
                ('bola13', models.IntegerField(verbose_name=b'bola13', help_text='')),
                ('bola14', models.IntegerField(verbose_name=b'bola14', help_text='')),
                ('bola15', models.IntegerField(verbose_name=b'bola15', help_text='')),
            ],
            options={
                'db_table': 'loteria',
                'ordering': ['data'],
            },
        ),
    ]
