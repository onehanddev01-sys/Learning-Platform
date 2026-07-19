# -*- coding: utf-8 -*-
# export .drawio -> viewer HTML (diagrams.net viewer) สำหรับให้ Chrome headless แคปเป็น PNG
import json, os, sys, html as H

files = [f for f in os.listdir('draw') if f.endswith('.drawio')]
for f in files:
    xml = open('draw/' + f, encoding='utf-8').read()
    cfg = json.dumps({"xml": xml, "toolbar": None, "nav": False, "resize": True, "border": 12})
    page = ('<!doctype html><html><head><meta charset="utf-8">'
            '<style>html,body{margin:0;background:#fff;}</style></head><body>'
            '<div class="mxgraph" data-mxgraph="' + H.escape(cfg, quote=True) + '"></div>'
            '<script src="https://viewer.diagrams.net/js/viewer-static.min.js"></script>'
            '</body></html>')
    out = 'draw/_' + f.replace('.drawio', '.html')
    open(out, 'w', encoding='utf-8').write(page)
    print('wrote', out)
