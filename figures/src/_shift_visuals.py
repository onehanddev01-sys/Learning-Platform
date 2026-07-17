# -*- coding: utf-8 -*-
# เตรียมพื้นที่เลขให้ภาพ/ตารางใหม่ที่จะแทรกในหัวข้อ 2, 3, 5, 7:
#   ภาพที่ 2-N (N>=3)  -> +1   (เปิดช่อง 2-3 ให้ภาพ Self-Efficacy; ภาพใหม่กรอบแนวคิด = 2-14)
#   ตารางที่ 2-N (N>=7) -> +2   (เปิดช่อง 2-7, 2-8; ตารางใหม่หัวข้อ 5 = 2-22, งานวิจัย = 2-23)
# พร้อมเปลี่ยนชื่อไฟล์ PNG ให้ตรงเลขใหม่ และแก้ลิงก์ในไฟล์ md
import os, re

MD = [x for x in os.listdir('.') if x.endswith('.md') and x not in ('IMPLEMENTATION_NOTES.md', 'บทที่ 1.md', 'เสนอ.md')][0]
s = open(MD, encoding='utf-8').read()

nfig = [0]
def fig_shift(m):
    n = int(m.group(1))
    if n >= 3:
        nfig[0] += 1
        return 'ภาพที่ 2-' + str(n + 1)
    return m.group(0)

ntab = [0]
def tab_shift(m):
    n = int(m.group(1))
    if n >= 7:
        ntab[0] += 1
        return 'ตารางที่ 2-' + str(n + 2)
    return m.group(0)

s = re.sub(r'ภาพที่ 2-(\d+)', fig_shift, s)
s = re.sub(r'ตารางที่ 2-(\d+)', tab_shift, s)
print('shifted figure refs:', nfig[0], '| table refs:', ntab[0])

# แผนที่เปลี่ยนชื่อไฟล์ (เรียงเลขมากไปน้อย กันชนกันเอง)
fig_renames = [
    ('fig-2-12-wireframe-mission',  'fig-2-13-wireframe-mission'),
    ('fig-2-11-wireframe-map',      'fig-2-12-wireframe-map'),
    ('fig-2-10-wireframe-welcome',  'fig-2-11-wireframe-welcome'),
    ('fig-2-9-run-flow',            'fig-2-10-run-flow'),
    ('fig-2-8-system-components',   'fig-2-9-system-components'),
    ('fig-2-7-security-rules',      'fig-2-8-security-rules'),
    ('fig-2-6-er-diagram',          'fig-2-7-er-diagram'),
    ('fig-2-5-user-document-json',  'fig-2-6-user-document-json'),
    ('fig-2-4-collection-structure','fig-2-5-collection-structure'),
    ('fig-2-3-sync-flow',           'fig-2-4-sync-flow'),
]
tab_renames = [('table-2-%d' % n, 'table-2-%d' % (n + 2)) for n in range(19, 6, -1)]
extra_renames = [('table-extra-1', 'table-2-7'), ('table-extra-2', 'table-2-23')]

renamed = 0
for old, new in fig_renames + tab_renames + extra_renames:
    s = s.replace('figures/' + old + '.png', 'figures/' + new + '.png')
    src = 'figures/' + old + '.png'
    dst = 'figures/' + new + '.png'
    if os.path.exists(src):
        os.rename(src, dst)
        renamed += 1
print('renamed files:', renamed)

open(MD, 'w', encoding='utf-8').write(s)
print('done:', MD)
