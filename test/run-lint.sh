# Added extra pass through sed to remove node warnings about sys module renamed to util.  Can be removed later when node/nodelint is upgraded.
find ../ -name *.js -not -path "*framework*" -exec nodelint '{}' --config nodelint-options \; 3>&1 1>&2 2>&3 | sed '/^[0-9]* errors.*$/d' | sed '/^The \"sys\" module is now called \"util\"\. It should have a similar interface\.$/d'
