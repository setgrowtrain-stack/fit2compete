import json, os, sys
from PIL import Image
src='/home/claude/ext/fedb'; out='/home/claude/v2/site/lib'
os.makedirs(out+'/img',exist_ok=True)
d=json.load(open(src+'/dist/exercises.json'))
ok=[];missing=0
for x in d:
    i=x['id']
    if not all(c.isalnum() or c in '_-' for c in i): print('skip id',i); continue
    imgs=[]
    for k,rel in enumerate(x.get('images',[])[:2]):
        p=os.path.join(src,'exercises',rel)
        if not os.path.isfile(p): missing+=1; continue
        im=Image.open(p).convert('RGB'); w=360
        if im.width>w: im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
        os.makedirs(f'{out}/img/{i}',exist_ok=True); im.save(f'{out}/img/{i}/{k}.jpg',quality=70,optimize=True,progressive=True); imgs.append(k)
    ok.append({'i':i,'n':x['name'],'e':x.get('equipment') or 'other','p':x.get('primaryMuscles',[]),'s':x.get('secondaryMuscles',[]),
               'l':x.get('level',''),'c':x.get('category',''),'f':x.get('force') or '','m':x.get('mechanic') or '','t':x.get('instructions',[]),'g':len(imgs)})
json.dump(ok,open(out+'/exercises.json','w'),separators=(',',':'),ensure_ascii=False)
print(len(ok),'exercises; missing images',missing)
