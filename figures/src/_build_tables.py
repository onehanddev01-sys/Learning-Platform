# แปลงตาราง markdown ทั้งหมดในบทที่ 2 เป็นภาพ:
#  - สร้างไฟล์ HTML ต่อหนึ่งตาราง (figures/_<name>.html)
#  - แทนที่ตาราง markdown ในไฟล์ .md ด้วย ![..](figures/<name>.png)  (คง caption ไว้)
import re, os, html

md = [x for x in os.listdir('.') if x.endswith('.md') and x != 'IMPLEMENTATION_NOTES.md'][0]
lines = open(md, encoding='utf-8').read().split('\n')

TPL = '''<!doctype html>
<html lang="th"><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#ffffff;}
  #wrap{display:inline-block;padding:20px;}
  table{border-collapse:collapse;font-family:'Leelawadee UI','Tahoma',sans-serif;font-size:15px;color:#1f2544;max-width:1220px;}
  th,td{border:1px solid #cfd6ea;padding:9px 13px;text-align:left;vertical-align:top;line-height:1.55;}
  th{background:#e9edf7;font-weight:700;color:#20264a;}
  tr:nth-child(even) td{background:#fafbfe;}
  code{font-family:Consolas,'Courier New',monospace;background:#eef0f6;padding:1px 5px;border-radius:4px;font-size:13px;}
</style></head><body><div id="wrap"><table>
__ROWS__
</table></div></body></html>'''

def is_sep(row):
    return re.match(r'^\|[\s:|-]+\|?\s*$', row.strip()) is not None

def cells(row):
    s = row.strip()
    if s.startswith('|'): s = s[1:]
    if s.endswith('|'): s = s[:-1]
    return [c.strip() for c in s.split('|')]

def fmt(cell):
    c = html.escape(cell, quote=False)
    c = re.sub(r'`([^`]+)`', r'<code>\1</code>', c)
    return c

def build_html(block):
    sep = next(k for k, b in enumerate(block) if is_sep(b))
    header = cells(block[sep-1])
    rows = '<tr>' + ''.join(f'<th>{fmt(c)}</th>' for c in header) + '</tr>'
    for r in block[sep+1:]:
        cs = cells(r)
        rows += '\n<tr>' + ''.join(f'<td>{fmt(c)}</td>' for c in cs) + '</tr>'
    return TPL.replace('__ROWS__', rows)

out, tables, i, auto = [], [], 0, 0
while i < len(lines):
    if lines[i].lstrip().startswith('|'):
        j = i; block = []
        while j < len(lines) and lines[j].lstrip().startswith('|'):
            block.append(lines[j]); j += 1
        if len(block) >= 2 and any(is_sep(b) for b in block):
            num = title = None
            for k in range(len(out)-1, max(-1, len(out)-4), -1):
                s = out[k].strip()
                if s == '': continue
                m = re.match(r'^\*\*ตารางที่ (2-\d+)\s+(.*?)\*\*$', s)
                if m: num, title = m.group(1), m.group(2)
                break
            if num:
                name, alt = f'table-{num}', f'ตารางที่ {num} {title}'
            else:
                auto += 1
                name, alt = f'table-extra-{auto}', 'ตาราง: ' + cells(block[0])[0]
            tables.append((name, block))
            out.append(f'![{alt}](figures/{name}.png)')
            i = j; continue
        out.extend(block); i = j; continue
    out.append(lines[i]); i += 1

for name, block in tables:
    open(f'figures/_{name}.html', 'w', encoding='utf-8').write(build_html(block))
open(md, 'w', encoding='utf-8').write('\n'.join(out))
print('converted', len(tables), 'tables')
for name, _ in tables:
    print(' ', name)
