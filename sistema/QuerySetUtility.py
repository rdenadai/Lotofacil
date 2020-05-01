# -*- coding: utf-8 -*-
from django.db.models import Q


class QuerySetUtility():
    def orderBy(self, sort):
        orderBy = []
        for s in sort:
            prop = s["property"]
            dir = s["direction"]
            ordem = '' + prop
            if dir == "DESC":
                ordem = '-' + prop
            orderBy.append(ordem)
        return orderBy

    def filterSearch(self, fields, search):
        rs = None
        if search:
            rs = [Q(x) for x in fields]
        return rs
