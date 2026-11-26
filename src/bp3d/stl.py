import numpy as np
def read(p):
    b=open(p,'rb').read();n=int.from_bytes(b[80:84],'little')
    d=np.frombuffer(b,dtype=np.dtype([('n','<f4',3),('v','<f4',(3,3)),('a','<u2')]),count=n,offset=84)
    V=d['v'].reshape(-1,3).astype(np.float64)
    u,inv=np.unique(np.round(V,4),axis=0,return_inverse=True)
    return u,inv.reshape(-1,3)
