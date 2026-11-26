# Bakes the main organs from BodyParts3D (CC BY 4.0, human-atlas simplified copy) for the organs / visceral fat view.
import json,struct,re,numpy as np,fast_simplification as fs,os
A=json.load(open('/tmp/atlas.json'));M='/tmp/ha/public/models/';bufs={}
def mesh(p):
    c=p['chunk']
    if c not in bufs:bufs[c]=open(M+f'body-{c}.bin','rb').read()
    b=bufs[c];V=np.frombuffer(b,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3)
    I=np.frombuffer(b,dtype='<u4',count=p['indexCount'],offset=p['indices']).reshape(-1,3);return V.astype(np.float32),I.astype(np.int64)
SEL=[('heart',r'^wall of (ventricle|left atrium|right atrium)$',.5),('liver',r'^hepatovenous segment|^caudate lobe of liver$',.35),('gallbladder',r'^gallbladder$',.4),
('stomach',r'^stomach$',.6),('spleen',r'^spleen$',.6),('pancreas',r'^pancreas$',.5),('kidney',r'^(left|right) kidney$',.6),('esophagus',r'^esophagus$',.8),
('intestine',r'^(duodenum|(proximal|middle|distal) part of (ileum|jejunum)|ileocecal junction|appendix)$',.45),('colon',r'^(ascending|transverse|descending|sigmoid) colon$|^rectum$|^cecum$',.45),('bladder',r'^urinary bladder$',.8)]
ov=[];oi=[];groups=[];vb=0;ib=0
for key,rx,keep in SEL:
    for p in A['parts']:
        if not re.search(rx,p['name'].lower()):continue
        V,I=mesh(p)
        if keep<1 and len(I)>200:
            V,I=fs.simplify(V,I.astype(np.int32),target_reduction=1-keep);I=I.astype(np.int64)
        groups.append({'m':key,'n':p['name'],'v0':vb,'vn':len(V),'i0':ib,'in':int(I.size)})
        ov.append(V.astype('<f4'));oi.append((I+vb).astype('<u4').ravel());vb+=len(V);ib+=I.size
V=np.concatenate(ov);I=np.concatenate(oi);print('verts',len(V),'tris',len(I)//3,V.min(0),V.max(0))
print(sorted(set(g['m'] for g in groups)))
head=json.dumps({'nv':len(V),'ni':int(len(I)),'groups':groups}).encode();head+=b' '*((4-len(head)%4)%4)
out='/home/claude/v2/site/vendor/organs.bin';open(out,'wb').write(struct.pack('<I',len(head))+head+V.tobytes()+I.tobytes());print('bytes',os.path.getsize(out))
