# Bakes the surface muscles and skin from BodyParts3D (CC BY 4.0, via the human-atlas simplified copy) into one file for the app.
import json,struct,sys,numpy as np,fast_simplification as fs
sys.path.insert(0,'/home/claude/v2/bp3d');import stl
A=json.load(open('/tmp/atlas.json'));M='/tmp/ha/public/models/'
SEL={'shoulders':['deltoid'],'biceps':['biceps brachii','brachialis'],'triceps':['triceps brachii'],
'forearms':['brachioradialis','flexor carpi','extensor carpi','palmaris longus','pronator teres','extensor digitorum','flexor digitorum superficialis'],
'obliques':['external oblique','serratus anterior'],'traps':['trapezius'],'upperback':['infraspinatus','teres major','teres minor','rhomboid'],
'lowerback':['iliocostalis lumborum','longissimus thoracis'],'glutes':['gluteus maximus','gluteus medius'],
'quads':['rectus femoris','vastus lateralis','vastus medialis'],'hamstrings':['biceps femoris','semitendinosus','semimembranosus'],
'calves':['gastrocnemius','soleus'],'other':['sternocleidomastoid','sartorius','gracilis','adductor longus','adductor magnus','tensor fasciae','tibialis anterior','fibularis longus','peroneus longus']}
KEEP={'obliques':.22,'forearms':.35,'lowerback':.4,'other':.45,'traps':.55}
bufs={}
def mesh(p):
    c=p['chunk']
    if c not in bufs:bufs[c]=open(M+f'body-{c}.bin','rb').read()
    b=bufs[c];V=np.frombuffer(b,dtype='<f4',count=p['vertexCount']*3,offset=p['positions']).reshape(-1,3)
    I=np.frombuffer(b,dtype='<u4',count=p['indexCount'],offset=p['indices']).reshape(-1,3)
    return V.astype(np.float32),I.astype(np.int64)
out_v=[];out_i=[];out_f=[];groups=[];vbase=0
FAN={'chest':(.185,1.345,.0),'lats':(.165,1.30,-.02)}   # where fan-shaped muscles insert on the arm
def fiber(key,V):
    # a coordinate that runs ACROSS the muscle fibers, so evenly spaced lines in it look like striations
    if key in ('skin','other'):return np.zeros(len(V),np.float32)
    C=V-V.mean(0);_,_,ax=np.linalg.svd(C[::max(1,len(C)//4000)],full_matrices=False)
    if key in FAN:
        ins=np.array(FAN[key]);ins[0]*=np.sign(V[:,0].mean());D=V-ins
        a=np.arctan2(D@ax[1],D@ax[0]);r=np.linalg.norm(D,axis=1).mean();return (a*r).astype(np.float32)
    if key=='abs':return V[:,0].astype(np.float32)
    return (C@ax[1]).astype(np.float32)
def add(key,name,V,I,keep):
    global vbase
    if keep<1 and len(I)>300:
        try:V,I=fs.simplify(V,I.astype(np.int32),target_reduction=1-keep);I=I.astype(np.int64)
        except Exception as e:print('simplify fail',name,e)
    groups.append({'m':key,'n':name,'v0':vbase,'vn':len(V),'i0':sum(len(x) for x in out_i),'in':int(I.size)})
    out_v.append(V.astype('<f4'));out_f.append(fiber(key,V.astype(np.float64)).astype('<f4'));out_i.append((I+vbase).astype('<u4').ravel());vbase+=len(V)
for key,kws in SEL.items():
    for p in A['parts']:
        n=p['name'].lower()
        if p['system'] not in ('muscular','skeletal') or not any(k in n for k in kws) or ' foot' in n or 'hand' in n or 'pollicis' in n or 'indicis' in n:continue
        if key=='forearms' and p['bounds'][0][1]<.7:continue   # leg muscles share names like extensor digitorum
        V,I=mesh(p)
        if 'external oblique' in n:   # drop the flat front sheet (aponeurosis) that would hide the six-pack
            c=V[I].mean(1);I=I[~((np.abs(c[:,0])<.088)&(c[:,2]>-.02))]
        add(key,p['name'],V,I,KEEP.get(key,.7))
S='/tmp/kmm/repo/assets/BodyParts3D_data/stl/FMA'
HI={'chest':[(79979,12000),(79980,12000),(34690,4000),(34691,4000),(45874,3000),(45875,3000)],'lats':[(13358,9000),(13359,9000)],'abs':[(13377,8000),(13378,8000)]}
for key,lst in HI.items():
    for fid,tgt in lst:
        V,I=stl.read(S+f'{fid}.stl');V=np.stack([V[:,0]/1000,V[:,2]/1000+.0565,-V[:,1]/1000-.1015],1).astype(np.float32)
        add(key,f'FMA{fid}',V,I,min(1,tgt/len(I)))
sk=[p for p in A['parts'] if p['name']=='Skin'][0];V,I=mesh(sk);add('skin','Skin',V,I,.5)
V=np.concatenate(out_v);I=np.concatenate(out_i)
print('verts',len(V),'tris',len(I)//3,'bbox',V.min(0),V.max(0))
F=np.concatenate(out_f)
head=json.dumps({'nv':len(V),'ni':int(len(I)),'fib':1,'groups':groups}).encode();head+=b' '*((4-len(head)%4)%4)
open('/home/claude/v2/site/vendor/anatomy.bin','wb').write(struct.pack('<I',len(head))+head+V.tobytes()+F.tobytes()+I.tobytes())
import os;print('bytes',os.path.getsize('/home/claude/v2/site/vendor/anatomy.bin'))
