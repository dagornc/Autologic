# Configuration file for the Sphinx documentation builder.

import os
import sys

# Ajouter le chemin vers le code source
sys.path.insert(0, os.path.abspath('../../Code/Backend/Phase2-Inference/01_Reasoning'))

# -- Informations du projet --
project = 'AutoLogic'
copyright = '2025, AutoLogic Team'
author = 'AutoLogic Team'
release = '0.2.0'
version = '0.2.0'

# -- Configuration générale --
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.viewcode',
    'sphinx.ext.napoleon',
    'sphinx.ext.autosummary',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx_rtd_theme',
]

# Configuration autodoc
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__'
}

# Configuration Napoleon (docstrings Google/NumPy style)
napoleon_google_docstring = True
napoleon_numpy_docstring = False
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = True
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_type_aliases = None

# Intersphinx pour liens vers documentation externe
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
    'fastapi': ('https://fastapi.tiangolo.com/', None),
}

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# Langue
language = 'fr'

# -- Options pour la sortie HTML --
html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']

# Configuration du thème
html_theme_options = {
    'navigation_depth': 4,
    'collapse_navigation': False,
    'sticky_navigation': True,
    'includehidden': True,
    'titles_only': False,
    'display_version': True,
    'prev_next_buttons_location': 'bottom',
    'style_external_links': True,
}

# Titre de la page
html_title = 'AutoLogic Documentation'
html_short_title = 'AutoLogic'

# Logo (optionnel - à ajouter si disponible)
# html_logo = '_static/logo.png'
# html_favicon = '_static/favicon.ico'

# -- Options pour la sortie LaTeX (PDF) --
latex_elements = {
    'papersize': 'a4paper',
    'pointsize': '11pt',
}

latex_documents = [
    ('index', 'AutoLogic.tex', 'AutoLogic Documentation',
     'AutoLogic Team', 'manual'),
]
