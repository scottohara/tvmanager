find ../ -name *.js -not -path "*framework*" -exec nodelint '{}' --config nodelint-options \; 3>&1 1>&2 2>&3 | sed '/^[0-9]*\serrors*$/d'