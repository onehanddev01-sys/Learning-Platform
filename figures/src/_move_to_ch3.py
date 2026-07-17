# -*- coding: utf-8 -*-
# ย้ายเนื้อหา "การออกแบบระบบ" จากบทที่ 2 ไปบทที่ 3:
#   - ตัด 1.6.1–1.6.6  -> บทที่ 3 หัวข้อ 3.3.1–3.3.6
#   - ตัด 4.14–4.21    -> บทที่ 3 หัวข้อ 3.3.7–3.3.14
#   - จัดเลขภาพ/ตารางใหม่ทั้งสองฝั่ง + เปลี่ยนชื่อไฟล์ PNG ให้ตรง
# ผลลัพธ์: บทที่ 2 ถูกเขียนทับ, ชิ้นที่ย้าย (แปลงเลขแล้ว) เก็บใน figures/src/_ch3_design.md
import os, re, sys

MD2 = 'บทที่2_เอกสารและงานวิจัยที่เกี่ยวข้อง.md'
lines = open(MD2, encoding='utf-8').read().split('\n')

def find(pred, start=0):
    for i in range(start, len(lines)):
        if pred(lines[i]):
            return i
    return -1

# ---------- ตัดช่วง ----------
a1 = find(lambda l: l.startswith('### 1.6.1'))
a2 = find(lambda l: l.startswith('## 1.7'))
b1 = find(lambda l: l.startswith('## 4.14'))
b2 = find(lambda l: l.startswith('# 5.'))
assert -1 not in (a1, a2, b1, b2), (a1, a2, b1, b2)
# ให้เส้นคั่น --- ก่อน "# 5." คงอยู่ในบทที่ 2
b2end = b2
while lines[b2end-1].strip() in ('', '---'):
    b2end -= 1

cutA = lines[a1:a2]
cutB = lines[b1:b2end]
keep = lines[:a1] + lines[a2:b1] + lines[b2end:]

# ---------- แปลงชิ้นที่ย้าย ----------
FIG_MAP = {4:'3.2', 5:'3.3', 6:'3.4', 7:'3.5', 8:'3.6', 9:'3.7', 10:'3.8', 11:'3.9', 12:'3.10', 13:'3.11'}
TAB_MAP = {1:'3.1', 2:'3.2', 3:'3.3', 4:'3.4', 5:'3.5', 6:'3.6',
           12:'3.7', 13:'3.8', 14:'3.9', 15:'3.10', 16:'3.11', 17:'3.12',
           18:'3.13', 19:'3.14', 20:'3.15', 21:'3.16'}
FILE_MAP = [
    ('fig-2-4-sync-flow',            'fig-3-2-sync-flow'),
    ('fig-2-5-collection-structure', 'fig-3-3-collection-structure'),
    ('fig-2-6-user-document-json',   'fig-3-4-user-document-json'),
    ('fig-2-7-er-diagram',           'fig-3-5-er-diagram'),
    ('fig-2-8-security-rules',       'fig-3-6-security-rules'),
    ('fig-2-9-system-components',    'fig-3-7-system-components'),
    ('fig-2-10-run-flow',            'fig-3-8-run-flow'),
    ('fig-2-11-wireframe-welcome',   'fig-3-9-wireframe-welcome'),
    ('fig-2-12-wireframe-map',       'fig-3-10-wireframe-map'),
    ('fig-2-13-wireframe-mission',   'fig-3-11-wireframe-mission'),
] + [('table-2-%d' % n, 'table-3-%d' % n) for n in range(1, 7)] + [
    ('table-2-12', 'table-3-7'), ('table-2-13', 'table-3-8'), ('table-2-14', 'table-3-9'),
    ('table-2-15', 'table-3-10'), ('table-2-16', 'table-3-11'), ('table-2-17', 'table-3-12'),
    ('table-2-18', 'table-3-13'), ('table-2-19', 'table-3-14'), ('table-2-20', 'table-3-15'),
    ('table-2-21', 'table-3-16'),
]

def transform_moved(text):
    # หัวข้อ: 1.6.X -> 3.3.X / 4.N -> 3.3.(N-7)
    text = re.sub(r'^### 1\.6\.(\d)', lambda m: '### 3.3.' + m.group(1), text, flags=re.M)
    text = re.sub(r'^## 4\.(1[4-9]|2[01])', lambda m: '### 3.3.' + str(int(m.group(1)) - 7), text, flags=re.M)
    # อ้างอิงหัวข้อภายในกลุ่มที่ย้ายด้วยกัน
    text = re.sub(r'หัวข้อ 1\.6\.(\d)', lambda m: 'หัวข้อ 3.3.' + m.group(1), text)
    text = re.sub(r'หัวข้อ 4\.(1[4-9]|2[01])\b', lambda m: 'หัวข้อ 3.3.' + str(int(m.group(1)) - 7), text)
    # เลขภาพ/ตาราง
    text = re.sub(r'ภาพที่ 2-(\d+)', lambda m: 'ภาพที่ ' + FIG_MAP[int(m.group(1))] if int(m.group(1)) in FIG_MAP else m.group(0), text)
    text = re.sub(r'ตารางที่ 2-(\d+)', lambda m: 'ตารางที่ ' + TAB_MAP[int(m.group(1))] if int(m.group(1)) in TAB_MAP else m.group(0), text)
    # อ้างอิงหัวข้อที่ยังอยู่บทที่ 2 -> เติม "ในบทที่ 2"
    text = re.sub(r'หัวข้อ (1\.[1-9]|2\.[1-8]|3\.[1-5]|4\.(?:[1-9]|1[0-3]))\b(?! ในบทที่ 2)', r'หัวข้อ \1 ในบทที่ 2', text)
    # ลิงก์ไฟล์
    for old, new in FILE_MAP:
        text = text.replace('figures/' + old + '.png', 'figures/' + new + '.png')
    return text

moved = transform_moved('\n'.join(cutA) + '\n\n' + '\n'.join(cutB))
open('figures/src/_ch3_design.md', 'w', encoding='utf-8').write(moved)

# ---------- จัดเลขบทที่ 2 ที่เหลือ ----------
keep_text = '\n'.join(keep)
K_TAB = {7:1, 8:2, 9:3, 10:4, 11:5, 22:6, 23:7}
K_FIG = {14:4}
keep_text = re.sub(r'ตารางที่ 2-(\d+)', lambda m: 'ตารางที่ 2-' + str(K_TAB[int(m.group(1))]) if int(m.group(1)) in K_TAB else m.group(0), keep_text)
keep_text = re.sub(r'ภาพที่ 2-(\d+)', lambda m: 'ภาพที่ 2-' + str(K_FIG[int(m.group(1))]) if int(m.group(1)) in K_FIG else m.group(0), keep_text)

K_FILES = [('table-2-7', 'table-2-1'), ('table-2-8', 'table-2-2'), ('table-2-9', 'table-2-3'),
           ('table-2-10', 'table-2-4'), ('table-2-11', 'table-2-5'), ('table-2-22', 'table-2-6'),
           ('table-2-23', 'table-2-7n'),  # กันชนกับ table-2-7 เดิม เปลี่ยนชื่อจริงทีหลัง
           ('fig-2-14-conceptual-framework', 'fig-2-4-conceptual-framework')]
for old, new in K_FILES:
    keep_text = keep_text.replace('figures/' + old + '.png', 'figures/' + new + '.png')

# ลบรายการสารบัญของหัวข้อที่ย้าย
out = []
for l in keep_text.split('\n'):
    s = l.strip()
    if re.match(r'^- 1\.6\.[1-6]', s) or re.match(r'^- 4\.(1[4-9]|2[01]) ', s):
        continue
    out.append(l)
keep_text = '\n'.join(out)
open(MD2, 'w', encoding='utf-8').write(keep_text)

# ---------- เปลี่ยนชื่อไฟล์จริง ----------
renamed = 0
for old, new in FILE_MAP:  # ชิ้นที่ย้าย (2-x -> 3-x ไม่ชนกัน)
    if os.path.exists('figures/%s.png' % old):
        os.rename('figures/%s.png' % old, 'figures/%s.png' % new)
        renamed += 1
for old, new in K_FILES:   # ชิ้นที่เหลือในบทที่ 2 (หลังชุดแรกย้ายออกแล้ว ชื่อว่าง)
    if os.path.exists('figures/%s.png' % old):
        os.rename('figures/%s.png' % old, 'figures/%s.png' % new)
        renamed += 1
if os.path.exists('figures/table-2-7n.png'):
    os.rename('figures/table-2-7n.png', 'figures/table-2-7.png')
    # แก้ลิงก์ชั่วคราวในไฟล์
    t = open(MD2, encoding='utf-8').read().replace('figures/table-2-7n.png', 'figures/table-2-7.png')
    open(MD2, 'w', encoding='utf-8').write(t)

print('cutA lines:', len(cutA), '| cutB lines:', len(cutB), '| renamed:', renamed)
# รายการอ้างอิงที่อาจค้าง (ให้ตามแก้มือ)
left = open(MD2, encoding='utf-8').read()
for pat in [r'หัวข้อ 4\.(1[4-9]|2[01])\b', r'หัวข้อ 1\.6\.[1-6]', r'ภาพที่ 2-(?:[5-9]|1[0-9])', r'ตารางที่ 2-(?:[89]|1[0-9]|2[0-9])']:
    for m in set(re.findall(pat, left)):
        print('WARN kept-ch2 still refs:', pat, '->', m)
