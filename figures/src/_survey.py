import re, os
f = [x for x in os.listdir('.') if x.endswith('.md') and x != 'IMPLEMENTATION_NOTES.md'][0]
lines = open(f, encoding='utf-8').read().split('\n')
n = 0
for i, l in enumerate(lines):
    if re.match(r'^\|\s*-{2,}', l):
        n += 1
        hdr = lines[i-1] if i > 0 else ''
        cap = ''
        for k in range(i-2, max(-1, i-6), -1):
            if k >= 0 and lines[k].startswith('**ตารางที่'):
                cap = lines[k]; break
        tag = 'CAP  ' if cap else 'NOCAP'
        info = cap[:55] if cap else ('HEADER: ' + hdr[:60])
        print(f'{tag} #{n:2d} line{i+1:5d}  {info}')
