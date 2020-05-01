# -*- coding: utf-8 -*-
#!/usr/bin/env python

from distutils.core import setup
from Cython.Build import cythonize

import os
LOCAL_INSTANCE = lambda *args: os.path.join(os.path.dirname(__file__), *args)
PROJECT_PATH = os.path.dirname(os.path.abspath(__file__))

print os.path.join(PROJECT_PATH, 'importar.pyx')
setup(
    ext_modules=cythonize(os.path.join(PROJECT_PATH, 'importar.pyx'))
)
