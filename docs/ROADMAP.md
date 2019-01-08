## [Roadmap]
**Plan for the future**
<p>

* Consolidate API configuration with client configuration, fold into common module.
* Identify core components that can be required like regular node modules, cover with tests.

This repository is meant to be implemented as a submodule into the target project with some core files merging into the target projects base directory.
* Create scripts to generate file manifest (json) containing CRC data used to ensure modified files are not overwritten.
* Manifest metadata for some files will define if file is skipped or only ejected on first first deployment (such as example/template files).
* Create eject script to actually move necessary files out of submodule, config to either ask permission on changed file overwrite or skip automatically.
* CRC/Metadata from core files will be stored either in file as a comment line or in reports directory.

</p>
