"""Validate generated electronic accounting against downloaded official SAT 1.3 XSDs."""
from pathlib import Path
from lxml import etree
base = Path(__file__).resolve().parent / 'fixtures' / 'sat30'
qa = Path('/workspace/scratch/2dce74215f64/qa30')
for schema_file, data_file in [('catalog.xsd','catalog.xml'),('balance.xsd','balance.xml')]:
    doc=etree.parse(str(base/schema_file))
    for item in doc.findall('{http://www.w3.org/2001/XMLSchema}import'):
        item.set('schemaLocation',str(base/'groups.xsd'))
    schema=etree.XMLSchema(doc)
    data=etree.parse(str(qa/data_file))
    schema.assertValid(data)
    print('PASS official SAT XSD:',data_file)
