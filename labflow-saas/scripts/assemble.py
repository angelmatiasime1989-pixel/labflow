# Compatibility entry point: keep one canonical assembler for Node hosting.
from pathlib import Path
import subprocess
subprocess.run(["node",str(Path(__file__).resolve().with_name("assemble.mjs"))],check=True)
