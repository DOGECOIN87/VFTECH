"""Rebuild the VFTech logo SVGs.

Usage:  python3 build.py FONT [--wght 700] [--suffix=-ttnorms] [--gaps 14.2,23.2]
                          [--fit-bar-to-mark] [--bar-ratio 1.0] [--bar-len 234.5]
FONT is a variable font (instanced at --wght, upright) or a static Bold-ish cut (used as is),
e.g. Montserrat[wght].ttf from Google Fonts (OFL) or `npm pack @fontsource-variable/montserrat`.
Spacing: the font's sidebearings plus uniform tracking. A monospaced font (or --gaps) is instead
spaced with fixed e→c, c→h gaps, since monospaced advances are not logo spacing.
Scale: the e is held at the traced e height, or with --fit-bar-to-mark the wordmark is scaled so
the T crossbar is centred on the white gap between the mark's top bar and its F bar (for fonts
whose ascender is short relative to the x-height). --bar-ratio sets the crossbar weight relative
to the stem, --bar-len the crossbar's midline length.
Writes vftech-logo{suffix}.svg plus the font-independent vftech-monogram.svg / vftech-icon.svg.
Needs: pip install fonttools skia-pathops brotli
"""
import argparse, math
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.basePen import BasePen
from fontTools.pens.recordingPen import RecordingPen
ap=argparse.ArgumentParser(); ap.add_argument('font'); ap.add_argument('--wght',type=float,default=700)
ap.add_argument('--suffix',default=''); ap.add_argument('--gaps',help='e→c,c→h gaps in logo units')
ap.add_argument('--fit-bar-to-mark',action='store_true'); ap.add_argument('--bar-ratio',type=float,default=1.0)
ap.add_argument('--bar-len',type=float,default=234.5)
args=ap.parse_args()
R3=math.sqrt(3); T60=R3
f=TTFont(args.font)
if 'fvar' in f:
    axes={a.axisTag for a in f['fvar'].axes}
    f=instantiateVariableFont(f,{'wght':args.wght,**({'slnt':0} if 'slnt' in axes else {})},overlap=2)
gs=f.getGlyphSet(); cm=f.getBestCmap(); hm=f['hmtx']
def g(ch): return gs[cm[ord(ch)]]
def fbounds(ch):
    bp=BoundsPen(gs); g(ch).draw(bp); return bp.bounds  # xmin,ymin,xmax,ymax (y-up)
def fmt(v): s=('%.2f'%v).rstrip('0').rstrip('.'); return '0' if s=='-0' else s
class _Flat(BasePen):
    """Flattens a glyph to polylines so its stems can be measured with a scanline."""
    def __init__(s,gs): super().__init__(gs); s.c=[]
    def _moveTo(s,p): s.c.append([p])
    def _lineTo(s,p): s.c[-1].append(p)
    def _curveToOne(s,a,b,c):
        p0=s.c[-1][-1]
        for i in range(1,17):
            t=i/16; s.c[-1].append(tuple((1-t)**3*p0[k]+3*(1-t)**2*t*a[k]+3*(1-t)*t*t*b[k]+t**3*c[k] for k in (0,1)))
    def _qCurveToOne(s,a,b):
        p0=s.c[-1][-1]
        for i in range(1,13):
            t=i/12; s.c[-1].append(tuple((1-t)**2*p0[k]+2*(1-t)*t*a[k]+t*t*b[k] for k in (0,1)))
def stem_fu(ch):
    """Width of the left stem up in the ascender (85% of the glyph height), clear of the shoulder; font units."""
    pen=_Flat(gs); g(ch).draw(pen); b=fbounds(ch); y=b[1]+0.85*(b[3]-b[1]); xs=[]
    for c in pen.c:
        for (x0,y0),(x1,y1) in zip(c,c[1:]+c[:1]):
            if (y0-y)*(y1-y)<0: xs.append(x0+(y-y0)*(x1-x0)/(y1-y0))
    xs.sort(); return xs[1]-xs[0]
# --- monogram: user's equilateral construction (side 1000), scaled so V stem = old 35.5 units & height = old 323.2
MS=323.2/(500*R3); M_TOP=226.8
V=[(0,0),(175,0),(405,230*R3),(405,0),(1000,0),(1000-95/R3,95),(500,95),(500,500*R3)]
F=[(585,180),(1000-180/R3,180),(585,1000*R3/2-(585-500)*R3),(585,370),(750-85/R3,370),(750,285),(585,285)]
MARK_GAP_CY=M_TOP+(95+180)/2*MS        # centre of the white gap between the mark's top bar and F bar
# --- scale & baseline: keep the traced e's height (192.7) and baseline 510, or fit the crossbar to the mark gap
BASE=510.0
if args.fit_bar_to_mark:
    S=(BASE-MARK_GAP_CY)/(fbounds('h')[3]-args.bar_ratio*stem_fu('h')/2)
else:
    eb=fbounds('e'); S=192.7/(eb[3]-eb[1])
def glyph_d(ch,x_left):
    """Font outline, scaled, its bbox-left placed at x_left (y flipped onto baseline).
    Horizontal line segments under 8 font units are dropped: text-size crotch steps such as
    TT Norms' h shoulder read as burrs at logo size."""
    b=fbounds(ch); rec=RecordingPen(); g(ch).draw(rec); ops=[]; prev=None
    for op,a in rec.value:
        if op=='lineTo' and prev and a[0][1]==prev[1] and abs(a[0][0]-prev[0])<8: continue
        ops.append((op,a)); prev=a[-1] if a else prev
    pen=SVGPathPen(gs,ntos=fmt); rec.value=ops
    rec.replay(TransformPen(pen,(S,0,0,-S,x_left-b[0]*S,BASE))); return pen.getCommands()
def rsb(ch): b=fbounds(ch); return (hm[cm[ord(ch)]][0]-b[2])*S
def lsb(ch): return fbounds(ch)[0]*S
def width(ch): b=fbounds(ch); return (b[2]-b[0])*S
# --- horizontal layout: e stays where it was
E_LEFT=748.0
mono=len({hm[cm[ord(ch)]][0] for ch in 'Tech'})==1
if args.gaps or mono:
    # fixed optical gaps; defaults are the ones the Montserrat lockup ends up with
    G_EC,G_CH=(float(v) for v in (args.gaps or '14.2,23.2').split(','))
    TRACK=float('nan')
    x_e=E_LEFT; x_c=x_e+width('e')+G_EC; x_h=x_c+width('c')+G_CH; H_RIGHT=x_h+width('h')
else:
    # font sidebearings + uniform tracking chosen so h ends where the original did (1361.8)
    H_RIGHT=1361.83
    natural=width('e')+rsb('e')+lsb('c')+width('c')+rsb('c')+lsb('h')+width('h')
    TRACK=(H_RIGHT-E_LEFT-natural)/2
    x_e=E_LEFT; x_c=x_e+width('e')+rsb('e')+lsb('c')+TRACK; x_h=x_c+width('c')+rsb('c')+lsb('h')+TRACK
hb=fbounds('h'); ASC=BASE-hb[3]*S        # h ascender top -> cap line for the custom T
# --- custom T: stem = the font's h stem, crossbar = --bar-ratio × stem, 60° parallelogram ends
STEM=round(stem_fu('h')*S,1); BAR=round(STEM*args.bar_ratio,1); T_CX=683.36; BAR_LEN=args.bar_len   # stem centre kept from original
off=BAR/T60                                       # horizontal run of a 60° cut over the bar height
mx0,mx1=T_CX-BAR_LEN/2,T_CX+BAR_LEN/2
yt,yb=ASC,ASC+BAR
T=[(mx0+off/2,yt),(mx1+off/2,yt),(mx1-off/2,yb),(T_CX+STEM/2,yb),(T_CX+STEM/2,BASE),
   (T_CX-STEM/2,BASE),(T_CX-STEM/2,yb),(mx0-off/2,yb)]
# place the mark so the 60° channel between its top bar and the T's crossbar keeps the original ~42u perpendicular gap
GAP=42.0
# mark's top-right corner (mx,M_TOP); T top-left corner (tx,yt); both cut lines run in direction (-1/2, √3/2)
tx=T[0][0]; mx=tx-(GAP-0.5*(yt-M_TOP))/(R3/2)
M_LEFT=mx-1000*MS
def poly(P,ox,oy,s): return 'M'+' '.join('%s %s'%(fmt(ox+x*s),fmt(oy+y*s)) for x,y in P)+'Z'
mono_d=poly(V,M_LEFT,M_TOP,MS)+poly(F,M_LEFT,M_TOP,MS)
T_d=poly(T,0,0,1)
parts={'letter-e':glyph_d('e',x_e),'letter-c':glyph_d('c',x_c),'letter-h':glyph_d('h',x_h)}
# viewBox: same 24u margin the original used around its art
x0=M_LEFT-24; y0=M_TOP-24; x1=H_RIGHT+24; y1=M_TOP+500*R3*MS+24
W,H=x1-x0,y1-y0
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{fmt(W)}" height="{fmt(H)}" viewBox="{fmt(x0)} {fmt(y0)} {fmt(W)} {fmt(H)}" role="img" aria-labelledby="title"><title id="title">VFTech</title><g id="vftech-artwork" fill="#000"><path id="vf-monogram" d="{mono_d}"/><g id="tech-lettering"><path id="letter-t" d="{T_d}"/><path id="letter-e" d="{parts['letter-e']}"/><path id="letter-c" d="{parts['letter-c']}"/><path id="letter-h" d="{parts['letter-h']}"/></g></g></svg>
'''
open(f'vftech-logo{args.suffix}.svg','w').write(svg)
# standalone monogram master (no transforms, tight box) + square icon
mono_master=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="{fmt(500*R3)}" viewBox="0 0 1000 {fmt(500*R3)}" role="img" aria-labelledby="title"><title id="title">VFTech monogram</title><path fill="#000" d="{poly(V,0,0,1)}{poly(F,0,0,1)}"/></svg>
'''
open('vftech-monogram.svg','w').write(mono_master)
# icon: 1254 canvas, 0.9 scale as supplied, but nudged down ~1/3 of the way from box-centre to ink-centroid (top-heavy shape)
ink_cy=294.9; box_cy=250*R3; nudge=(box_cy-ink_cy)/3*0.9
ox,oy=177,(1254-0.9*500*R3)/2+nudge
icon=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254" role="img" aria-labelledby="title"><title id="title">VFTech app icon</title><rect width="1254" height="1254" fill="#fff"/><path fill="#000" d="{poly(V,ox,oy,0.9)}{poly(F,ox,oy,0.9)}"/></svg>
'''
open('vftech-icon.svg','w').write(icon)
eb=fbounds('e')
print('stem %.1f  scale %.4f track %.2f  x_e %.1f x_c %.1f x_h %.1f  asc %.2f'%(STEM,S,TRACK,x_e,x_c,x_h,ASC))
print('gaps: T-stem->e %.1f  e->c %.1f  c->h %.1f'%(x_e-(T_CX+STEM/2), x_c-(x_e+width('e')), x_h-(x_c+width('c'))))
print('mark left %.1f top-right %.1f, scale %.4f, stem %.1f, V-arm %.1f, internal gap %.1f'%(M_LEFT,mx,MS,95*MS,175*MS*R3/2,85*MS))
print('T bar %.1f..%.1f top, %.1f..%.1f bottom, weight %.1f; e top %.1f (bar clearance %.1f); bar centre vs mark gap %+.2f'%(
    T[0][0],T[1][0],T[7][0],T[2][0],BAR,BASE-eb[3]*S,BASE-eb[3]*S-yb,(yt+yb)/2-MARK_GAP_CY))
print('icon nudge %.1f'%nudge)
