from fontTools.ttLib import TTFont
from pathlib import Path
import json,base64
p=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'); f=TTFont(p); cmap=f.getBestCmap(); glyphs=f.getGlyphOrder(); indexes={n:i for i,n in enumerate(glyphs)}
m={str(cp):[indexes[n],f['hmtx'][n][0]] for cp,n in cmap.items()}
head=f['head'];h=f['hhea'];meta={'unitsPerEm':head.unitsPerEm,'postscriptName':'DejaVuSans','ascent':h.ascent,'descent':h.descent,'italicAngle':0,'bbox':{'minX':head.xMin,'minY':head.yMin,'maxX':head.xMax,'maxY':head.yMax},'post':{'isFixedPitch':False},'head':{'macStyle':{'italic':False}},'cff':False}
Path('vendor/font-data.js').write_text('const FONT_B64='+json.dumps(base64.b64encode(p.read_bytes()).decode())+';\nconst FONT_META='+json.dumps(meta)+';\nconst FONT_GLYPHS='+json.dumps(m)+';\n')
